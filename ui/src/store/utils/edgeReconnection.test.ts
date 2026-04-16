/**
 * Property Tests for Edge Reconnection
 *
 * **Feature: adk-studio-cleanup, Property 1: Edge Reconnection Preserves Connectivity**
 * *For any* workflow graph with N nodes connected from START to END, removing any single
 * non-START/non-END node using `reconnectEdgesOnRemoval` SHALL produce an edge set where
 * every remaining node is reachable from START and END is reachable from at least one node.
 * **Validates: Requirements 3.1, 3.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Edge } from '../../types/project';
import { reconnectEdgesOnRemoval } from './edgeReconnection';

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid node IDs (lowercase alpha, 1-8 chars).
 * Excludes 'START' and 'END' which are reserved.
 */
const arbNodeId: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z]{1,8}$/)
  .filter((s) => s !== 'start' && s !== 'end');

/**
 * Generator for a linear chain of unique node IDs.
 * Produces between 1 and 10 unique middle nodes.
 */
const arbLinearChain: fc.Arbitrary<string[]> = fc
  .uniqueArray(arbNodeId, { minLength: 1, maxLength: 10 })
  .filter((arr) => arr.length >= 1);

/**
 * Build edges for a linear chain: START → n1 → n2 → ... → nN → END
 */
function buildLinearChainEdges(nodes: string[]): Edge[] {
  const edges: Edge[] = [];
  edges.push({ from: 'START', to: nodes[0] });
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i], to: nodes[i + 1] });
  }
  edges.push({ from: nodes[nodes.length - 1], to: 'END' });
  return edges;
}

/**
 * Generator for a linear chain with a random middle node index to remove.
 * Returns { nodes, removeIndex } where removeIndex is a valid index into nodes.
 */
const arbLinearChainWithRemoval: fc.Arbitrary<{
  nodes: string[];
  removeIndex: number;
}> = arbLinearChain.chain((nodes) =>
  fc.record({
    nodes: fc.constant(nodes),
    removeIndex: fc.integer({ min: 0, max: nodes.length - 1 }),
  })
);

/**
 * Generator for a diamond-shaped graph:
 *   START → A → B → END
 *                ↗
 *   START → C ──┘
 *
 * Produces 3+ unique nodes with extra edges for branching/merging.
 */
const arbBranchingGraph: fc.Arbitrary<{
  nodes: string[];
  edges: Edge[];
  removeIndex: number;
}> = fc
  .uniqueArray(arbNodeId, { minLength: 3, maxLength: 8 })
  .chain((nodes) => {
    // Build a base linear chain
    const edges = buildLinearChainEdges(nodes);

    // Add some extra edges for branching (skip edges)
    const extraEdges: Edge[] = [];
    if (nodes.length >= 3) {
      // Add a skip edge from START to a later node (branching)
      extraEdges.push({ from: 'START', to: nodes[Math.min(2, nodes.length - 1)] });
      // Add a skip edge from an early node to END (merging)
      extraEdges.push({ from: nodes[Math.max(0, nodes.length - 3)], to: 'END' });
    }

    return fc.record({
      nodes: fc.constant(nodes),
      edges: fc.constant([...edges, ...extraEdges]),
      removeIndex: fc.integer({ min: 0, max: nodes.length - 1 }),
    });
  });

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a node is reachable from START via BFS.
 */
function isReachableFromStart(
  nodeId: string,
  edges: Edge[],
  _allNodeIds: string[]
): boolean {
  const visited = new Set<string>();
  const queue = ['START'];
  visited.add('START');

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === nodeId) return true;

    for (const edge of edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push(edge.to);
      }
    }
  }

  return false;
}

// ============================================
// Property Tests
// ============================================

describe('Edge Reconnection Properties', () => {
  describe('Property 1: Edge Reconnection Preserves Connectivity', () => {
    /**
     * **Property 1.1: Linear Chain Reconnection**
     * *For any* linear chain START→n1→n2→...→nN→END, removing a middle node
     * SHALL produce a valid chain where the removed node is bypassed.
     * **Validates: Requirements 3.1, 3.5**
     */
    it('should reconnect a linear chain when a middle node is removed', () => {
      fc.assert(
        fc.property(arbLinearChainWithRemoval, ({ nodes, removeIndex }) => {
          const edges = buildLinearChainEdges(nodes);
          const removedId = nodes[removeIndex];
          const remainingNodes = nodes.filter((n) => n !== removedId);

          const result = reconnectEdgesOnRemoval({
            removedIds: [removedId],
            currentEdges: edges,
            remainingNodeIds: remainingNodes,
          });

          // The removed node should not appear in any edge
          for (const edge of result) {
            expect(edge.from).not.toBe(removedId);
            expect(edge.to).not.toBe(removedId);
          }

          // If there are remaining nodes, verify the chain is still connected
          if (remainingNodes.length > 0) {
            // START should have an outgoing edge
            const startHasOutgoing = result.some((e) => e.from === 'START');
            expect(startHasOutgoing).toBe(true);

            // END should have an incoming edge
            const endHasIncoming = result.some((e) => e.to === 'END');
            expect(endHasIncoming).toBe(true);

            // Every remaining node should be reachable from START
            for (const nodeId of remainingNodes) {
              expect(isReachableFromStart(nodeId, result, remainingNodes)).toBe(true);
            }

            // END should be reachable from START
            expect(isReachableFromStart('END', result, remainingNodes)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.2: No Removed Node References**
     * *For any* graph, after removing a node, no edge in the result SHALL
     * reference the removed node ID.
     * **Validates: Requirements 3.1, 3.5**
     */
    it('should not contain any references to removed nodes in result edges', () => {
      fc.assert(
        fc.property(arbLinearChainWithRemoval, ({ nodes, removeIndex }) => {
          const edges = buildLinearChainEdges(nodes);
          const removedId = nodes[removeIndex];
          const remainingNodes = nodes.filter((n) => n !== removedId);

          const result = reconnectEdgesOnRemoval({
            removedIds: [removedId],
            currentEdges: edges,
            remainingNodeIds: remainingNodes,
          });

          // No edge should reference the removed node
          for (const edge of result) {
            expect(edge.from).not.toBe(removedId);
            expect(edge.to).not.toBe(removedId);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.3: START and END Connectivity Preserved**
     * *For any* graph with START/END connectivity, removing a non-START/non-END
     * node SHALL preserve that START has an outgoing edge and END has an incoming edge.
     * **Validates: Requirements 3.1, 3.5**
     */
    it('should preserve START and END connectivity for branching graphs', () => {
      fc.assert(
        fc.property(arbBranchingGraph, ({ nodes, edges, removeIndex }) => {
          const removedId = nodes[removeIndex];
          const remainingNodes = nodes.filter((n) => n !== removedId);

          const result = reconnectEdgesOnRemoval({
            removedIds: [removedId],
            currentEdges: edges,
            remainingNodeIds: remainingNodes,
          });

          // No edge should reference the removed node
          for (const edge of result) {
            expect(edge.from).not.toBe(removedId);
            expect(edge.to).not.toBe(removedId);
          }

          if (remainingNodes.length > 0) {
            // START must have an outgoing edge
            const startHasOutgoing = result.some((e) => e.from === 'START');
            expect(startHasOutgoing).toBe(true);

            // END must have an incoming edge
            const endHasIncoming = result.some((e) => e.to === 'END');
            expect(endHasIncoming).toBe(true);

            // END should be reachable from START
            expect(isReachableFromStart('END', result, remainingNodes)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.4: Linear Chain Produces Expected Chain**
     * *For any* linear chain START→A→B→C→END, removing B SHALL produce
     * START→A→C→END (the chain with B bypassed).
     * **Validates: Requirements 3.1, 3.5**
     */
    it('should produce a valid shorter chain when removing from a linear chain', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(arbNodeId, { minLength: 3, maxLength: 8 }),
          fc.integer({ min: 0, max: 100 }),
          (nodes, seed) => {
            const removeIndex = seed % nodes.length;
            const edges = buildLinearChainEdges(nodes);
            const removedId = nodes[removeIndex];
            const remainingNodes = nodes.filter((n) => n !== removedId);

            const result = reconnectEdgesOnRemoval({
              removedIds: [removedId],
              currentEdges: edges,
              remainingNodeIds: remainingNodes,
            });

            // The result should form a valid linear chain of the remaining nodes
            // Verify: START → remaining[0]
            if (remainingNodes.length > 0) {
              expect(result.some((e) => e.from === 'START' && e.to === remainingNodes[0])).toBe(
                true
              );

              // Verify: remaining[last] → END
              expect(
                result.some(
                  (e) => e.from === remainingNodes[remainingNodes.length - 1] && e.to === 'END'
                )
              ).toBe(true);

              // Verify: each consecutive pair is connected
              for (let i = 0; i < remainingNodes.length - 1; i++) {
                const hasEdge = result.some(
                  (e) => e.from === remainingNodes[i] && e.to === remainingNodes[i + 1]
                );
                expect(hasEdge).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.5: Every Remaining Node Has Incoming and Outgoing Edges**
     * *For any* graph, after removing a node, every remaining node SHALL have
     * at least one incoming edge and at least one outgoing edge.
     * **Validates: Requirements 3.1, 3.5**
     */
    it('should ensure every remaining node has incoming and outgoing edges', () => {
      fc.assert(
        fc.property(arbBranchingGraph, ({ nodes, edges, removeIndex }) => {
          const removedId = nodes[removeIndex];
          const remainingNodes = nodes.filter((n) => n !== removedId);

          const result = reconnectEdgesOnRemoval({
            removedIds: [removedId],
            currentEdges: edges,
            remainingNodeIds: remainingNodes,
          });

          for (const nodeId of remainingNodes) {
            // Every remaining node should have at least one incoming edge
            const hasIncoming = result.some((e) => e.to === nodeId);
            expect(hasIncoming).toBe(true);

            // Every remaining node should have at least one outgoing edge
            const hasOutgoing = result.some((e) => e.from === nodeId);
            expect(hasOutgoing).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
