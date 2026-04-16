import type { Edge } from '../../types/project';

/**
 * Parameters for the edge reconnection algorithm.
 *
 * When a node is removed from a workflow, edges must be reconnected
 * so that the graph remains connected from START to END.
 */
export interface ReconnectionParams {
  /** IDs of the nodes being removed */
  removedIds: string[];
  /** Current edge list before removal */
  currentEdges: Edge[];
  /** IDs of all nodes that will remain after removal (excludes START/END) */
  remainingNodeIds: string[];
}

/**
 * Reconnects edges after one or more nodes are removed from the workflow.
 *
 * Algorithm:
 * 1. For each removed node, find its incoming and outgoing edges
 * 2. Create bridge edges connecting each source to each target (edge bridging)
 * 3. Filter out all edges that reference removed nodes
 * 4. Validate START/END connectivity:
 *    - Every remaining node must have at least one incoming edge (orphan detection)
 *    - Every remaining node must have at least one outgoing edge
 *    - START must have an outgoing edge if nodes exist
 *    - END must have an incoming edge if nodes exist
 *
 * @param params - The reconnection parameters
 * @returns The new edge array with reconnected edges
 */
export function reconnectEdgesOnRemoval(params: ReconnectionParams): Edge[] {
  const { removedIds, currentEdges, remainingNodeIds } = params;

  const removedSet = new Set(removedIds);

  // --- Step 1 & 2: Edge bridging ---
  // For each removed node, connect its predecessors to its successors
  const bridgeEdges: Edge[] = [];

  for (const removedId of removedIds) {
    const incomingEdges = currentEdges.filter((e) => e.to === removedId);
    const outgoingEdges = currentEdges.filter((e) => e.from === removedId);

    for (const incoming of incomingEdges) {
      for (const outgoing of outgoingEdges) {
        // Don't create self-loops
        if (incoming.from === outgoing.to) continue;

        // Don't create duplicate bridge edges
        const alreadyBridged = bridgeEdges.some(
          (e) => e.from === incoming.from && e.to === outgoing.to
        );
        if (alreadyBridged) continue;

        // Don't duplicate edges that already exist between non-removed nodes
        const alreadyExists = currentEdges.some(
          (e) =>
            e.from === incoming.from &&
            e.to === outgoing.to &&
            !removedSet.has(e.from) &&
            !removedSet.has(e.to)
        );
        if (alreadyExists) continue;

        bridgeEdges.push({ from: incoming.from, to: outgoing.to });
      }
    }
  }

  // --- Step 3: Remove edges involving removed nodes ---
  const survivingEdges = currentEdges.filter(
    (e) => !removedSet.has(e.from) && !removedSet.has(e.to)
  );

  let finalEdges = [...survivingEdges, ...bridgeEdges];

  // --- Step 4: START/END connectivity validation ---

  // 4a. Every remaining node must have an incoming edge (orphan detection)
  for (const nodeId of remainingNodeIds) {
    const hasIncoming = finalEdges.some((e) => e.to === nodeId);
    if (!hasIncoming) {
      // If START has an edge to an invalid (removed) target, clean it up
      const startEdge = finalEdges.find((e) => e.from === 'START');
      if (!startEdge || !remainingNodeIds.includes(startEdge.to)) {
        finalEdges = finalEdges.filter(
          (e) => !(e.from === 'START' && !remainingNodeIds.includes(e.to))
        );
        finalEdges.push({ from: 'START', to: nodeId });
      }
    }
  }

  // 4b. Every remaining node must have an outgoing edge
  for (const nodeId of remainingNodeIds) {
    const hasOutgoing = finalEdges.some((e) => e.from === nodeId);
    if (!hasOutgoing) {
      finalEdges.push({ from: nodeId, to: 'END' });
    }
  }

  // 4c. Ensure START has an outgoing edge if there are nodes
  if (remainingNodeIds.length > 0) {
    const startHasOutgoing = finalEdges.some((e) => e.from === 'START');
    if (!startHasOutgoing) {
      finalEdges.push({ from: 'START', to: remainingNodeIds[0] });
    }
  }

  // 4d. Ensure END has an incoming edge if there are nodes
  if (remainingNodeIds.length > 0) {
    const endHasIncoming = finalEdges.some((e) => e.to === 'END');
    if (!endHasIncoming) {
      finalEdges.push({
        from: remainingNodeIds[remainingNodeIds.length - 1],
        to: 'END',
      });
    }
  }

  return finalEdges;
}
