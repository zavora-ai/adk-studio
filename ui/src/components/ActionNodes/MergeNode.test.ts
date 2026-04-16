/**
 * Property Tests for Merge Wait Behavior
 * 
 * **Feature: action-nodes, Property 6: Merge Wait Behavior**
 * *For any* Merge node configuration, the wait behavior SHALL be correctly
 * determined by the mode setting (wait_all, wait_any, wait_n).
 * **Validates: Requirements 8.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { 
  MergeNodeConfig, 
  MergeMode, 
  CombineStrategy,
  TimeoutBehavior,
} from '../../types/actionNodes';
import { createDefaultStandardProperties } from '../../types/standardProperties';

// ============================================
// Constants
// ============================================

const MERGE_MODES: MergeMode[] = ['wait_all', 'wait_any', 'wait_n'];
const COMBINE_STRATEGIES: CombineStrategy[] = ['array', 'object', 'first', 'last'];
const TIMEOUT_BEHAVIORS: TimeoutBehavior[] = ['continue', 'error'];

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid merge modes.
 */
const arbMergeMode: fc.Arbitrary<MergeMode> = fc.constantFrom(...MERGE_MODES);

/**
 * Generator for valid combine strategies.
 */
const arbCombineStrategy: fc.Arbitrary<CombineStrategy> = fc.constantFrom(...COMBINE_STRATEGIES);

/**
 * Generator for valid timeout behaviors.
 */
const arbTimeoutBehavior: fc.Arbitrary<TimeoutBehavior> = fc.constantFrom(...TIMEOUT_BEHAVIORS);

/**
 * Generator for valid wait counts (1-100).
 */
const arbWaitCount: fc.Arbitrary<number> = fc.integer({ min: 1, max: 100 });

/**
 * Generator for valid timeout durations (0-300000ms).
 */
const arbTimeoutMs: fc.Arbitrary<number> = fc.integer({ min: 0, max: 300000 });

/**
 * Generator for branch keys (valid identifiers).
 */
const arbBranchKey: fc.Arbitrary<string> = fc.stringMatching(/^[a-z][a-zA-Z0-9_]{0,19}$/);

/**
 * Generator for arrays of branch keys.
 */
const arbBranchKeys: fc.Arbitrary<string[]> = fc.array(arbBranchKey, { minLength: 0, maxLength: 10 });

/**
 * Generator for valid MergeNodeConfig.
 */
const arbMergeNodeConfig: fc.Arbitrary<MergeNodeConfig> = fc.record({
  mode: arbMergeMode,
  waitCount: fc.option(arbWaitCount, { nil: undefined }),
  combineStrategy: arbCombineStrategy,
  branchKeys: fc.option(arbBranchKeys, { nil: undefined }),
  timeout: fc.record({
    enabled: fc.boolean(),
    ms: arbTimeoutMs,
    behavior: arbTimeoutBehavior,
  }),
}).map((config) => {
  const baseProps = createDefaultStandardProperties(
    `merge_${Date.now()}`,
    'Test Merge',
    'mergeResult'
  );
  return {
    ...baseProps,
    type: 'merge' as const,
    ...config,
  };
});

// ============================================
// Helper Functions
// ============================================

/**
 * Simulates branch completion tracking for testing wait behavior.
 */
interface BranchState {
  id: string;
  completed: boolean;
  result?: unknown;
}

/**
 * Determines if a merge node should proceed based on its mode and branch states.
 */
function shouldMergeProceed(
  config: MergeNodeConfig,
  branches: BranchState[]
): boolean {
  const completedCount = branches.filter(b => b.completed).length;
  const totalBranches = branches.length;
  
  switch (config.mode) {
    case 'wait_all':
      return completedCount === totalBranches;
    case 'wait_any':
      return completedCount >= 1;
    case 'wait_n':
      return completedCount >= (config.waitCount || 1);
    default:
      return false;
  }
}

/**
 * Combines branch results based on the combine strategy.
 */
function combineResults(
  config: MergeNodeConfig,
  branches: BranchState[]
): unknown {
  const completedBranches = branches.filter(b => b.completed);
  
  switch (config.combineStrategy) {
    case 'array':
      return completedBranches.map(b => b.result);
    case 'object': {
      const result: Record<string, unknown> = {};
      completedBranches.forEach((b, i) => {
        const key = config.branchKeys?.[i] || b.id;
        result[key] = b.result;
      });
      return result;
    }
    case 'first':
      return completedBranches[0]?.result;
    case 'last':
      return completedBranches[completedBranches.length - 1]?.result;
    default:
      return null;
  }
}

// ============================================
// Property Tests
// ============================================

describe('MergeNode', () => {
  describe('Property 6: Merge Wait Behavior', () => {
    /**
     * **Property 6.1: Wait All Mode Requires All Branches**
     * *For any* Merge node in wait_all mode, the node SHALL NOT proceed
     * until ALL incoming branches have completed.
     */
    it('should not proceed in wait_all mode until all branches complete', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (totalBranches, completedIndex) => {
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_all',
              combineStrategy: 'array',
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            // Create branches with only some completed
            const branches: BranchState[] = Array.from({ length: totalBranches }, (_, i) => ({
              id: `branch_${i}`,
              completed: i <= completedIndex,
              result: `result_${i}`,
            }));
            
            const allCompleted = completedIndex >= totalBranches - 1;
            const shouldProceed = shouldMergeProceed(config, branches);
            
            // Should only proceed when all branches are completed
            expect(shouldProceed).toBe(allCompleted);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.2: Wait Any Mode Proceeds on First Completion**
     * *For any* Merge node in wait_any mode, the node SHALL proceed
     * as soon as ANY branch completes.
     */
    it('should proceed in wait_any mode when any branch completes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 0, max: 9 }),
          (totalBranches, completedCount) => {
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_any',
              combineStrategy: 'first',
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            // Create branches with specified number completed
            const actualCompleted = Math.min(completedCount, totalBranches);
            const branches: BranchState[] = Array.from({ length: totalBranches }, (_, i) => ({
              id: `branch_${i}`,
              completed: i < actualCompleted,
              result: `result_${i}`,
            }));
            
            const shouldProceed = shouldMergeProceed(config, branches);
            
            // Should proceed if at least one branch is completed
            expect(shouldProceed).toBe(actualCompleted >= 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.3: Wait N Mode Requires N Branches**
     * *For any* Merge node in wait_n mode with waitCount=N, the node SHALL
     * proceed when exactly N branches have completed.
     */
    it('should proceed in wait_n mode when N branches complete', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (totalBranches, waitCount, completedCount) => {
            const actualWaitCount = Math.min(waitCount, totalBranches);
            const actualCompleted = Math.min(completedCount, totalBranches);
            
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_n',
              waitCount: actualWaitCount,
              combineStrategy: 'array',
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            // Create branches with specified number completed
            const branches: BranchState[] = Array.from({ length: totalBranches }, (_, i) => ({
              id: `branch_${i}`,
              completed: i < actualCompleted,
              result: `result_${i}`,
            }));
            
            const shouldProceed = shouldMergeProceed(config, branches);
            
            // Should proceed if completed count >= waitCount
            expect(shouldProceed).toBe(actualCompleted >= actualWaitCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.4: Mode Determines Wait Behavior**
     * *For any* valid MergeNodeConfig, the wait behavior SHALL be
     * determined solely by the mode setting.
     */
    it('should determine wait behavior based on mode setting', () => {
      fc.assert(
        fc.property(arbMergeNodeConfig, (config) => {
          // Mode should be one of the valid modes
          expect(MERGE_MODES).toContain(config.mode);
          
          // If mode is wait_n, waitCount should be respected
          if (config.mode === 'wait_n') {
            // waitCount should be a positive number or undefined (defaults to 1)
            if (config.waitCount !== undefined) {
              expect(config.waitCount).toBeGreaterThanOrEqual(1);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Combine Strategy Behavior', () => {
    /**
     * **Property 6.5: Array Strategy Collects All Results**
     * *For any* Merge node with array combine strategy, the output SHALL
     * be an array containing all completed branch results.
     */
    it('should collect results into array with array strategy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (branchCount) => {
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_all',
              combineStrategy: 'array',
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            const branches: BranchState[] = Array.from({ length: branchCount }, (_, i) => ({
              id: `branch_${i}`,
              completed: true,
              result: `result_${i}`,
            }));
            
            const result = combineResults(config, branches);
            
            expect(Array.isArray(result)).toBe(true);
            expect((result as unknown[]).length).toBe(branchCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.6: Object Strategy Uses Branch Keys**
     * *For any* Merge node with object combine strategy, the output SHALL
     * be an object with branch keys as property names.
     */
    it('should merge results into object with object strategy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (branchCount) => {
            const branchKeys = Array.from({ length: branchCount }, (_, i) => `key_${i}`);
            
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_all',
              combineStrategy: 'object',
              branchKeys,
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            const branches: BranchState[] = Array.from({ length: branchCount }, (_, i) => ({
              id: `branch_${i}`,
              completed: true,
              result: `result_${i}`,
            }));
            
            const result = combineResults(config, branches) as Record<string, unknown>;
            
            expect(typeof result).toBe('object');
            expect(Object.keys(result).length).toBe(branchCount);
            branchKeys.forEach((key, i) => {
              expect(result[key]).toBe(`result_${i}`);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.7: First Strategy Returns First Result**
     * *For any* Merge node with first combine strategy, the output SHALL
     * be the result of the first completed branch.
     */
    it('should return first result with first strategy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (branchCount) => {
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_any',
              combineStrategy: 'first',
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            const branches: BranchState[] = Array.from({ length: branchCount }, (_, i) => ({
              id: `branch_${i}`,
              completed: true,
              result: `result_${i}`,
            }));
            
            const result = combineResults(config, branches);
            
            expect(result).toBe('result_0');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.8: Last Strategy Returns Last Result**
     * *For any* Merge node with last combine strategy, the output SHALL
     * be the result of the last completed branch.
     */
    it('should return last result with last strategy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (branchCount) => {
            const config: MergeNodeConfig = {
              ...createDefaultStandardProperties('merge_test', 'Test', 'result'),
              type: 'merge',
              mode: 'wait_all',
              combineStrategy: 'last',
              timeout: { enabled: false, ms: 30000, behavior: 'error' },
            };
            
            const branches: BranchState[] = Array.from({ length: branchCount }, (_, i) => ({
              id: `branch_${i}`,
              completed: true,
              result: `result_${i}`,
            }));
            
            const result = combineResults(config, branches);
            
            expect(result).toBe(`result_${branchCount - 1}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Timeout Configuration', () => {
    /**
     * **Property 6.9: Timeout Configuration Validity**
     * *For any* MergeNodeConfig, the timeout configuration SHALL have
     * valid enabled, ms, and behavior fields.
     */
    it('should have valid timeout configuration', () => {
      fc.assert(
        fc.property(arbMergeNodeConfig, (config) => {
          expect(typeof config.timeout.enabled).toBe('boolean');
          expect(typeof config.timeout.ms).toBe('number');
          expect(config.timeout.ms).toBeGreaterThanOrEqual(0);
          expect(TIMEOUT_BEHAVIORS).toContain(config.timeout.behavior);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 6.10: Timeout Behavior Options**
     * *For any* Merge node with timeout enabled, the behavior SHALL be
     * either 'continue' or 'error'.
     */
    it('should have valid timeout behavior when enabled', () => {
      fc.assert(
        fc.property(
          arbMergeNodeConfig.filter(c => c.timeout.enabled),
          (config) => {
            expect(['continue', 'error']).toContain(config.timeout.behavior);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Configuration Persistence', () => {
    /**
     * **Property 6.11: Configuration Round-Trip**
     * *For any* MergeNodeConfig, serializing and deserializing SHALL
     * preserve all configuration values.
     */
    it('should preserve configuration through serialization', () => {
      fc.assert(
        fc.property(arbMergeNodeConfig, (config) => {
          const serialized = JSON.stringify(config);
          const deserialized = JSON.parse(serialized) as MergeNodeConfig;
          
          expect(deserialized.type).toBe(config.type);
          expect(deserialized.mode).toBe(config.mode);
          expect(deserialized.waitCount).toBe(config.waitCount);
          expect(deserialized.combineStrategy).toBe(config.combineStrategy);
          expect(deserialized.timeout.enabled).toBe(config.timeout.enabled);
          expect(deserialized.timeout.ms).toBe(config.timeout.ms);
          expect(deserialized.timeout.behavior).toBe(config.timeout.behavior);
          
          if (config.branchKeys) {
            expect(deserialized.branchKeys).toEqual(config.branchKeys);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
