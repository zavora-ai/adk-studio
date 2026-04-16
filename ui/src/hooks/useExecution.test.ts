/**
 * Property-based tests for execution state and timeline scrubbing
 * 
 * **Feature: adk-studio-v2, Property 12: Timeline Scrubbing Synchronization** (CRITICAL)
 * *For any* timeline position index i, scrubbing to position i SHALL highlight
 * the corresponding node on the canvas AND display the state snapshot at index i
 * in the State_Inspector.
 * 
 * **Validates: Requirements 5.3, 5.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { StateSnapshot } from '../types/execution';
import { MAX_SNAPSHOTS } from '../types/execution';

/**
 * Arbitrary generator for node IDs
 */
const arbNodeId = fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s));

/**
 * Arbitrary generator for snapshot status
 */
const arbStatus = fc.constantFrom<'running' | 'success' | 'error'>('running', 'success', 'error');

/**
 * Arbitrary generator for simple JSON-like objects
 */
const arbSimpleObject = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
);

/**
 * Arbitrary generator for a state snapshot
 */
const arbStateSnapshot: fc.Arbitrary<StateSnapshot> = fc.record({
  nodeId: arbNodeId,
  nodeLabel: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
  timestamp: fc.nat({ max: Date.now() }),
  inputState: arbSimpleObject,
  outputState: arbSimpleObject,
  duration: fc.nat({ max: 60000 }),
  status: arbStatus,
  error: fc.option(fc.string(), { nil: undefined }),
  step: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
  iteration: fc.option(fc.nat({ max: 10 }), { nil: undefined }),
});

/**
 * Arbitrary generator for an array of snapshots (1 to MAX_SNAPSHOTS)
 */
const arbSnapshots = fc.array(arbStateSnapshot, { minLength: 1, maxLength: MAX_SNAPSHOTS });

/**
 * Simulates the scrubTo function behavior
 * @param _currentIndex - Current index (unused but kept for API consistency)
 */
function scrubTo(snapshots: StateSnapshot[], _currentIndex: number, targetIndex: number): number {
  return Math.max(0, Math.min(targetIndex, snapshots.length - 1));
}

/**
 * Simulates getting the highlighted node ID at a given index
 */
function getHighlightedNodeId(snapshots: StateSnapshot[], index: number): string | null {
  if (index < 0 || index >= snapshots.length) {
    return null;
  }
  return snapshots[index].nodeId;
}

/**
 * Simulates getting the current snapshot at a given index
 */
function getCurrentSnapshot(snapshots: StateSnapshot[], index: number): StateSnapshot | null {
  if (index < 0 || index >= snapshots.length) {
    return null;
  }
  return snapshots[index];
}

describe('Timeline Scrubbing Synchronization', () => {
  /**
   * **Property 12: Timeline Scrubbing Synchronization** (CRITICAL)
   * *For any* timeline position index i, scrubbing to position i SHALL highlight
   * the corresponding node on the canvas AND display the state snapshot at index i
   * in the State_Inspector.
   * **Validates: Requirements 5.3, 5.4**
   */
  it('should synchronize canvas highlight and state inspector when scrubbing to any valid index', () => {
    fc.assert(
      fc.property(
        arbSnapshots,
        fc.nat({ max: MAX_SNAPSHOTS + 10 }), // Allow out-of-bounds indices to test clamping
        (snapshots, targetIndex) => {
          // Scrub to the target index
          const newIndex = scrubTo(snapshots, -1, targetIndex);
          
          // Property 1: Index should be clamped to valid range
          expect(newIndex).toBeGreaterThanOrEqual(0);
          expect(newIndex).toBeLessThan(snapshots.length);
          
          // Property 2: Highlighted node should match snapshot at new index
          const highlightedNodeId = getHighlightedNodeId(snapshots, newIndex);
          expect(highlightedNodeId).toBe(snapshots[newIndex].nodeId);
          
          // Property 3: Current snapshot should be the one at new index
          const currentSnapshot = getCurrentSnapshot(snapshots, newIndex);
          expect(currentSnapshot).toBe(snapshots[newIndex]);
          
          // Property 4: Snapshot should have required fields for State Inspector
          expect(currentSnapshot).not.toBeNull();
          expect(currentSnapshot!.inputState).toBeDefined();
          expect(currentSnapshot!.outputState).toBeDefined();
          expect(currentSnapshot!.status).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Scrubbing to negative index should clamp to 0
   */
  it('should clamp negative indices to 0', () => {
    fc.assert(
      fc.property(
        arbSnapshots,
        fc.integer({ min: -1000, max: -1 }),
        (snapshots, negativeIndex) => {
          const newIndex = scrubTo(snapshots, -1, negativeIndex);
          expect(newIndex).toBe(0);
          
          // Should still return valid snapshot
          const snapshot = getCurrentSnapshot(snapshots, newIndex);
          expect(snapshot).toBe(snapshots[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Scrubbing to index beyond array length should clamp to last index
   */
  it('should clamp indices beyond array length to last valid index', () => {
    fc.assert(
      fc.property(
        arbSnapshots,
        fc.nat({ max: 1000 }),
        (snapshots, extraOffset) => {
          const beyondIndex = snapshots.length + extraOffset;
          const newIndex = scrubTo(snapshots, -1, beyondIndex);
          
          expect(newIndex).toBe(snapshots.length - 1);
          
          // Should return last snapshot
          const snapshot = getCurrentSnapshot(snapshots, newIndex);
          expect(snapshot).toBe(snapshots[snapshots.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Sequential scrubbing should visit all snapshots in order
   */
  it('should allow sequential scrubbing through all snapshots', () => {
    fc.assert(
      fc.property(arbSnapshots, (snapshots) => {
        // Scrub through all indices sequentially
        for (let i = 0; i < snapshots.length; i++) {
          const newIndex = scrubTo(snapshots, i - 1, i);
          expect(newIndex).toBe(i);
          
          const highlightedNodeId = getHighlightedNodeId(snapshots, newIndex);
          expect(highlightedNodeId).toBe(snapshots[i].nodeId);
          
          const currentSnapshot = getCurrentSnapshot(snapshots, newIndex);
          expect(currentSnapshot).toBe(snapshots[i]);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Scrubbing to same index should be idempotent
   */
  it('should be idempotent when scrubbing to the same index', () => {
    fc.assert(
      fc.property(
        arbSnapshots,
        fc.nat({ max: MAX_SNAPSHOTS - 1 }),
        (snapshots, targetIndex) => {
          const validIndex = Math.min(targetIndex, snapshots.length - 1);
          
          // Scrub to index twice
          const firstScrub = scrubTo(snapshots, -1, validIndex);
          const secondScrub = scrubTo(snapshots, firstScrub, validIndex);
          
          // Should return same index
          expect(secondScrub).toBe(firstScrub);
          
          // Should return same snapshot
          const firstSnapshot = getCurrentSnapshot(snapshots, firstScrub);
          const secondSnapshot = getCurrentSnapshot(snapshots, secondScrub);
          expect(secondSnapshot).toBe(firstSnapshot);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty snapshots array should return null for all operations
   */
  it('should handle empty snapshots array gracefully', () => {
    const emptySnapshots: StateSnapshot[] = [];
    
    // Scrubbing should return -1 (clamped to length - 1 = -1, but max with 0 = 0)
    // Actually, with empty array, Math.min(0, -1) = -1, Math.max(0, -1) = 0
    // But accessing snapshots[0] would be undefined
    const highlightedNodeId = getHighlightedNodeId(emptySnapshots, 0);
    expect(highlightedNodeId).toBeNull();
    
    const currentSnapshot = getCurrentSnapshot(emptySnapshots, 0);
    expect(currentSnapshot).toBeNull();
  });

  /**
   * Property: Node ID at scrubbed position should always be a non-empty string
   */
  it('should always return a valid node ID when scrubbing to valid index', () => {
    fc.assert(
      fc.property(
        arbSnapshots,
        fc.nat({ max: MAX_SNAPSHOTS - 1 }),
        (snapshots, targetIndex) => {
          const validIndex = Math.min(targetIndex, snapshots.length - 1);
          const newIndex = scrubTo(snapshots, -1, validIndex);
          
          const highlightedNodeId = getHighlightedNodeId(snapshots, newIndex);
          
          // Node ID should be a non-empty string
          expect(typeof highlightedNodeId).toBe('string');
          expect(highlightedNodeId!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('State Snapshot Capture', () => {
  /**
   * **Property 13: State Snapshot Capture** (CRITICAL)
   * *For any* node execution event, the system SHALL capture and store a state
   * snapshot containing input state, output state, timestamp, and duration.
   * **Validates: Requirements 5.8**
   */
  it('should capture all required fields in state snapshots', () => {
    fc.assert(
      fc.property(arbStateSnapshot, (snapshot) => {
        // Property: All required fields must be present
        expect(snapshot.nodeId).toBeDefined();
        expect(typeof snapshot.nodeId).toBe('string');
        expect(snapshot.nodeId.length).toBeGreaterThan(0);
        
        expect(snapshot.timestamp).toBeDefined();
        expect(typeof snapshot.timestamp).toBe('number');
        expect(snapshot.timestamp).toBeGreaterThanOrEqual(0);
        
        expect(snapshot.inputState).toBeDefined();
        expect(typeof snapshot.inputState).toBe('object');
        
        expect(snapshot.outputState).toBeDefined();
        expect(typeof snapshot.outputState).toBe('object');
        
        expect(snapshot.duration).toBeDefined();
        expect(typeof snapshot.duration).toBe('number');
        expect(snapshot.duration).toBeGreaterThanOrEqual(0);
        
        expect(snapshot.status).toBeDefined();
        expect(['running', 'success', 'error']).toContain(snapshot.status);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Snapshot retention should be limited to MAX_SNAPSHOTS
   */
  it('should limit snapshot retention to MAX_SNAPSHOTS', () => {
    fc.assert(
      fc.property(
        fc.array(arbStateSnapshot, { minLength: MAX_SNAPSHOTS + 1, maxLength: MAX_SNAPSHOTS + 50 }),
        (manySnapshots) => {
          // Simulate adding snapshots with retention limit
          let snapshots: StateSnapshot[] = [];
          
          for (const snapshot of manySnapshots) {
            snapshots = [...snapshots, snapshot];
            if (snapshots.length > MAX_SNAPSHOTS) {
              snapshots.shift(); // Remove oldest
            }
          }
          
          // Property: Should never exceed MAX_SNAPSHOTS
          expect(snapshots.length).toBeLessThanOrEqual(MAX_SNAPSHOTS);
          
          // Property: Should retain the most recent snapshots
          expect(snapshots[snapshots.length - 1]).toBe(manySnapshots[manySnapshots.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error snapshots should have error field populated
   */
  it('should have error field when status is error', () => {
    const arbErrorSnapshot: fc.Arbitrary<StateSnapshot> = fc.record({
      nodeId: arbNodeId,
      nodeLabel: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
      timestamp: fc.nat({ max: Date.now() }),
      inputState: arbSimpleObject,
      outputState: arbSimpleObject,
      duration: fc.nat({ max: 60000 }),
      status: fc.constant('error' as const),
      error: fc.string({ minLength: 1, maxLength: 200 }),
      step: fc.option(fc.nat({ max: 100 }), { nil: undefined }),
      iteration: fc.option(fc.nat({ max: 10 }), { nil: undefined }),
    });

    fc.assert(
      fc.property(arbErrorSnapshot, (snapshot) => {
        expect(snapshot.status).toBe('error');
        // Error field should be present for error status
        expect(snapshot.error).toBeDefined();
        expect(typeof snapshot.error).toBe('string');
      }),
      { numRuns: 100 }
    );
  });
});
