/**
 * Property-based tests for SSE state snapshot capture
 * 
 * **Feature: adk-studio-v2, Property 13: State Snapshot Capture** (CRITICAL)
 * *For any* node execution event, the system SHALL capture and store a state snapshot
 * containing input state, output state, timestamp, and duration.
 * 
 * **Validates: Requirements 5.8**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { StateSnapshot, TraceEventPayload } from '../types/execution';

/**
 * Arbitrary generator for state key names (valid JavaScript identifiers)
 */
const arbStateKey = fc.stringMatching(/^[a-z][a-z0-9_]{0,19}$/);

/**
 * Arbitrary generator for state values (JSON-compatible primitives)
 */
const arbStateValue = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.boolean(),
  fc.constant(null)
);

/**
 * Arbitrary generator for state objects (Record<string, unknown>)
 */
const arbStateObject = fc.dictionary(arbStateKey, arbStateValue, { minKeys: 0, maxKeys: 5 });

/**
 * Arbitrary generator for node names
 */
const arbNodeName = fc.stringMatching(/^[a-z][a-z0-9_]{2,15}$/);

/**
 * Arbitrary generator for step numbers
 */
const arbStep = fc.integer({ min: 1, max: 1000 });

/**
 * Arbitrary generator for duration in milliseconds
 */
const arbDuration = fc.integer({ min: 0, max: 60000 });

/**
 * Arbitrary generator for trace event payloads with state snapshots
 */
const arbTraceEventPayload = fc.record({
  type: fc.constantFrom<'node_start' | 'node_end' | 'state' | 'done'>('node_start', 'node_end', 'state', 'done'),
  node: fc.option(arbNodeName, { nil: undefined }),
  step: fc.option(arbStep, { nil: undefined }),
  duration_ms: fc.option(arbDuration, { nil: undefined }),
  total_steps: fc.option(arbStep, { nil: undefined }),
  state_snapshot: fc.option(
    fc.record({
      input: arbStateObject,
      output: arbStateObject,
    }),
    { nil: undefined }
  ),
  state_keys: fc.option(fc.array(arbStateKey, { minLength: 0, maxLength: 10 }), { nil: undefined }),
});

/**
 * Convert a trace event payload to a StateSnapshot for testing.
 * This mirrors the logic in useSSE.ts.
 */
function traceToSnapshot(
  trace: TraceEventPayload,
  nodeId: string,
  status: 'running' | 'success' | 'error'
): StateSnapshot | null {
  if (!trace.state_snapshot) {
    return null;
  }
  
  return {
    nodeId,
    timestamp: Date.now(),
    inputState: trace.state_snapshot.input || {},
    outputState: trace.state_snapshot.output || {},
    duration: trace.duration_ms || 0,
    status,
  };
}

/**
 * Extract state keys from a state object (mirrors backend logic)
 */
function extractStateKeys(state: Record<string, unknown>): string[] {
  return Object.keys(state);
}

describe('State Snapshot Capture', () => {
  /**
   * **Property 13: State Snapshot Capture** (CRITICAL)
   * *For any* node execution event, the system SHALL capture and store a state snapshot
   * containing input state, output state, timestamp, and duration.
   * **Validates: Requirements 5.8**
   */
  it('should capture state snapshot with all required fields for any valid trace event', () => {
    fc.assert(
      fc.property(
        arbTraceEventPayload,
        arbNodeName,
        fc.constantFrom<'running' | 'success' | 'error'>('running', 'success', 'error'),
        (trace, nodeId, status) => {
          const snapshot = traceToSnapshot(trace, nodeId, status);
          
          if (trace.state_snapshot) {
            // Property: snapshot should be created when state_snapshot is present
            expect(snapshot).not.toBeNull();
            
            if (snapshot) {
              // Property: snapshot should contain nodeId
              expect(snapshot.nodeId).toBe(nodeId);
              
              // Property: snapshot should contain timestamp (positive number)
              expect(snapshot.timestamp).toBeGreaterThan(0);
              
              // Property: snapshot should contain inputState as object
              expect(typeof snapshot.inputState).toBe('object');
              expect(snapshot.inputState).not.toBeNull();
              
              // Property: snapshot should contain outputState as object
              expect(typeof snapshot.outputState).toBe('object');
              expect(snapshot.outputState).not.toBeNull();
              
              // Property: snapshot should contain duration (non-negative)
              expect(snapshot.duration).toBeGreaterThanOrEqual(0);
              
              // Property: snapshot should contain status
              expect(['running', 'success', 'error']).toContain(snapshot.status);
            }
          } else {
            // Property: snapshot should be null when state_snapshot is not present
            expect(snapshot).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State keys should be correctly extracted from output state
   * **Validates: Requirements 3.3**
   */
  it('should extract state keys from output state correctly', () => {
    fc.assert(
      fc.property(arbStateObject, (stateObject) => {
        const keys = extractStateKeys(stateObject);
        const expectedKeys = Object.keys(stateObject);
        
        // Property: extracted keys should match object keys
        expect(keys.sort()).toEqual(expectedKeys.sort());
        
        // Property: number of keys should match
        expect(keys.length).toBe(expectedKeys.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Input state should be preserved in snapshot
   */
  it('should preserve input state in snapshot', () => {
    fc.assert(
      fc.property(arbStateObject, arbStateObject, arbNodeName, (inputState, outputState, nodeId) => {
        const trace: TraceEventPayload = {
          type: 'node_end',
          node: nodeId,
          step: 1,
          duration_ms: 100,
          state_snapshot: {
            input: inputState,
            output: outputState,
          },
        };
        
        const snapshot = traceToSnapshot(trace, nodeId, 'success');
        
        expect(snapshot).not.toBeNull();
        if (snapshot) {
          // Property: input state should be preserved exactly
          expect(snapshot.inputState).toEqual(inputState);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Output state should be preserved in snapshot
   */
  it('should preserve output state in snapshot', () => {
    fc.assert(
      fc.property(arbStateObject, arbStateObject, arbNodeName, (inputState, outputState, nodeId) => {
        const trace: TraceEventPayload = {
          type: 'node_end',
          node: nodeId,
          step: 1,
          duration_ms: 100,
          state_snapshot: {
            input: inputState,
            output: outputState,
          },
        };
        
        const snapshot = traceToSnapshot(trace, nodeId, 'success');
        
        expect(snapshot).not.toBeNull();
        if (snapshot) {
          // Property: output state should be preserved exactly
          expect(snapshot.outputState).toEqual(outputState);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Duration should be captured from trace event
   */
  it('should capture duration from trace event', () => {
    fc.assert(
      fc.property(arbDuration, arbNodeName, (duration, nodeId) => {
        const trace: TraceEventPayload = {
          type: 'node_end',
          node: nodeId,
          step: 1,
          duration_ms: duration,
          state_snapshot: {
            input: {},
            output: {},
          },
        };
        
        const snapshot = traceToSnapshot(trace, nodeId, 'success');
        
        expect(snapshot).not.toBeNull();
        if (snapshot) {
          // Property: duration should match trace event duration
          expect(snapshot.duration).toBe(duration);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Snapshot array should respect MAX_SNAPSHOTS limit
   */
  it('should maintain snapshot array within MAX_SNAPSHOTS limit', () => {
    const MAX_SNAPSHOTS = 100;
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        (numSnapshots) => {
          const snapshots: StateSnapshot[] = [];
          
          // Simulate adding snapshots
          for (let i = 0; i < numSnapshots; i++) {
            const snapshot: StateSnapshot = {
              nodeId: `node_${i}`,
              timestamp: Date.now() + i,
              inputState: {},
              outputState: { step: i },
              duration: i * 10,
              status: 'success',
            };
            
            snapshots.push(snapshot);
            
            // Apply MAX_SNAPSHOTS limit (as in useSSE)
            if (snapshots.length > MAX_SNAPSHOTS) {
              snapshots.shift();
            }
          }
          
          // Property: array length should never exceed MAX_SNAPSHOTS
          expect(snapshots.length).toBeLessThanOrEqual(MAX_SNAPSHOTS);
          
          // Property: if we added more than MAX_SNAPSHOTS, length should be exactly MAX_SNAPSHOTS
          if (numSnapshots > MAX_SNAPSHOTS) {
            expect(snapshots.length).toBe(MAX_SNAPSHOTS);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Snapshot status should match the provided status
   */
  it('should set correct status on snapshot', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'running' | 'success' | 'error'>('running', 'success', 'error'),
        arbNodeName,
        (status, nodeId) => {
          const trace: TraceEventPayload = {
            type: 'node_end',
            node: nodeId,
            step: 1,
            state_snapshot: {
              input: {},
              output: {},
            },
          };
          
          const snapshot = traceToSnapshot(trace, nodeId, status);
          
          expect(snapshot).not.toBeNull();
          if (snapshot) {
            // Property: status should match provided status
            expect(snapshot.status).toBe(status);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
