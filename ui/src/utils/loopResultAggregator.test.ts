/**
 * Property Tests for Loop Result Aggregation
 * 
 * **Feature: action-nodes, Property 5: Loop Result Aggregation**
 * *For any* sequence of loop iterations, result aggregation SHALL:
 * - Preserve iteration order when collecting results
 * - Accurately count successes and failures
 * - Return empty results array when collect is disabled
 * - Correctly determine allSucceeded status
 * **Validates: Requirements 7.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ResultsConfig } from '../types/actionNodes';
import {
  aggregateLoopResults,
  createSuccessResult,
  createFailureResult,
  validateAggregatedResults,
  getAggregationKey,
  type IterationResult,
} from './loopResultAggregator';

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid iteration values.
 */
const arbIterationValue: fc.Arbitrary<unknown> = fc.oneof(
  fc.string(),
  fc.integer(),
  fc.double({ noNaN: true }),
  fc.boolean(),
  fc.constant(null),
  fc.array(fc.integer(), { maxLength: 5 }),
  fc.dictionary(fc.string({ maxLength: 10 }), fc.integer(), { maxKeys: 5 })
);

/**
 * Generator for arrays of iteration results with sequential indices.
 */
const arbIterationResults: fc.Arbitrary<IterationResult[]> = fc
  .array(fc.record({
    value: arbIterationValue,
    success: fc.boolean(),
    error: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  }), { maxLength: 50 })
  .map(items => items.map((item, index) => ({
    index,
    value: item.success ? item.value : undefined,
    success: item.success,
    error: item.success ? undefined : (item.error || 'Error'),
  })));

/**
 * Generator for valid results configuration.
 */
const arbResultsConfig: fc.Arbitrary<ResultsConfig> = fc.record({
  collect: fc.boolean(),
  aggregationKey: fc.option(
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    { nil: undefined }
  ),
});

/**
 * Generator for valid output keys.
 */
const arbOutputKey: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s));

// ============================================
// Property Tests
// ============================================

describe('Loop Result Aggregation', () => {
  describe('Property 5: Loop Result Aggregation', () => {
    /**
     * **Property 5.1: Count Consistency**
     * *For any* sequence of iterations, successCount + failureCount SHALL equal totalIterations.
     */
    it('should have consistent counts (successCount + failureCount === totalIterations)', () => {
      fc.assert(
        fc.property(arbIterationResults, arbResultsConfig, (iterations, config) => {
          const aggregated = aggregateLoopResults(iterations, config);
          
          expect(aggregated.successCount + aggregated.failureCount).toBe(aggregated.totalIterations);
          expect(aggregated.totalIterations).toBe(iterations.length);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.2: Collect Behavior**
     * *For any* sequence of iterations:
     * - When collect is true, results array SHALL have same length as iterations
     * - When collect is false, results array SHALL be empty
     */
    it('should respect collect configuration', () => {
      fc.assert(
        fc.property(arbIterationResults, arbResultsConfig, (iterations, config) => {
          const aggregated = aggregateLoopResults(iterations, config);
          
          if (config.collect) {
            expect(aggregated.results.length).toBe(iterations.length);
          } else {
            expect(aggregated.results.length).toBe(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.3: Order Preservation**
     * *For any* sequence of iterations with collect enabled,
     * results SHALL preserve the order of iteration values.
     */
    it('should preserve iteration order when collecting', () => {
      fc.assert(
        fc.property(arbIterationResults, (iterations) => {
          const config: ResultsConfig = { collect: true };
          const aggregated = aggregateLoopResults(iterations, config);
          
          // Results should be in same order as iterations
          for (let i = 0; i < iterations.length; i++) {
            expect(aggregated.results[i]).toEqual(iterations[i].value);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.4: Success Count Accuracy**
     * *For any* sequence of iterations, successCount SHALL equal
     * the number of iterations with success=true.
     */
    it('should accurately count successful iterations', () => {
      fc.assert(
        fc.property(arbIterationResults, arbResultsConfig, (iterations, config) => {
          const aggregated = aggregateLoopResults(iterations, config);
          const expectedSuccessCount = iterations.filter(i => i.success).length;
          
          expect(aggregated.successCount).toBe(expectedSuccessCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.5: Failure Count Accuracy**
     * *For any* sequence of iterations, failureCount SHALL equal
     * the number of iterations with success=false.
     */
    it('should accurately count failed iterations', () => {
      fc.assert(
        fc.property(arbIterationResults, arbResultsConfig, (iterations, config) => {
          const aggregated = aggregateLoopResults(iterations, config);
          const expectedFailureCount = iterations.filter(i => !i.success).length;
          
          expect(aggregated.failureCount).toBe(expectedFailureCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.6: allSucceeded Consistency**
     * *For any* sequence of iterations:
     * - allSucceeded SHALL be true only when failureCount is 0 AND totalIterations > 0
     * - allSucceeded SHALL be false when there are any failures
     * - allSucceeded SHALL be false when there are no iterations
     */
    it('should correctly determine allSucceeded status', () => {
      fc.assert(
        fc.property(arbIterationResults, arbResultsConfig, (iterations, config) => {
          const aggregated = aggregateLoopResults(iterations, config);
          
          const expectedAllSucceeded = 
            aggregated.failureCount === 0 && aggregated.totalIterations > 0;
          
          expect(aggregated.allSucceeded).toBe(expectedAllSucceeded);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.7: Validation Consistency**
     * *For any* aggregated results produced by aggregateLoopResults,
     * validateAggregatedResults SHALL return true.
     */
    it('should produce valid aggregated results', () => {
      fc.assert(
        fc.property(arbIterationResults, arbResultsConfig, (iterations, config) => {
          const aggregated = aggregateLoopResults(iterations, config);
          
          expect(validateAggregatedResults(aggregated, config)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.8: Empty Iterations**
     * *For any* empty iteration array, aggregation SHALL produce:
     * - Empty results array
     * - Zero counts
     * - allSucceeded = false
     */
    it('should handle empty iterations correctly', () => {
      fc.assert(
        fc.property(arbResultsConfig, (config) => {
          const aggregated = aggregateLoopResults([], config);
          
          expect(aggregated.results).toEqual([]);
          expect(aggregated.totalIterations).toBe(0);
          expect(aggregated.successCount).toBe(0);
          expect(aggregated.failureCount).toBe(0);
          expect(aggregated.allSucceeded).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Helper Functions', () => {
    /**
     * **Property: createSuccessResult produces valid success results**
     */
    it('should create valid success results', () => {
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), arbIterationValue, (index, value) => {
          const result = createSuccessResult(index, value);
          
          expect(result.index).toBe(index);
          expect(result.value).toEqual(value);
          expect(result.success).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: createFailureResult produces valid failure results**
     */
    it('should create valid failure results', () => {
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), fc.string({ minLength: 1, maxLength: 100 }), (index, error) => {
          const result = createFailureResult(index, error);
          
          expect(result.index).toBe(index);
          expect(result.value).toBeUndefined();
          expect(result.success).toBe(false);
          expect(result.error).toBe(error);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: getAggregationKey returns correct key**
     */
    it('should return aggregationKey when provided, otherwise defaultOutputKey', () => {
      fc.assert(
        fc.property(arbResultsConfig, arbOutputKey, (config, defaultKey) => {
          const key = getAggregationKey(config, defaultKey);
          
          if (config.aggregationKey) {
            expect(key).toBe(config.aggregationKey);
          } else {
            expect(key).toBe(defaultKey);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle all successful iterations', () => {
      const iterations: IterationResult[] = [
        createSuccessResult(0, 'a'),
        createSuccessResult(1, 'b'),
        createSuccessResult(2, 'c'),
      ];
      const config: ResultsConfig = { collect: true };
      
      const aggregated = aggregateLoopResults(iterations, config);
      
      expect(aggregated.results).toEqual(['a', 'b', 'c']);
      expect(aggregated.totalIterations).toBe(3);
      expect(aggregated.successCount).toBe(3);
      expect(aggregated.failureCount).toBe(0);
      expect(aggregated.allSucceeded).toBe(true);
    });

    it('should handle all failed iterations', () => {
      const iterations: IterationResult[] = [
        createFailureResult(0, 'error1'),
        createFailureResult(1, 'error2'),
      ];
      const config: ResultsConfig = { collect: true };
      
      const aggregated = aggregateLoopResults(iterations, config);
      
      expect(aggregated.results).toEqual([undefined, undefined]);
      expect(aggregated.totalIterations).toBe(2);
      expect(aggregated.successCount).toBe(0);
      expect(aggregated.failureCount).toBe(2);
      expect(aggregated.allSucceeded).toBe(false);
    });

    it('should handle mixed success/failure iterations', () => {
      const iterations: IterationResult[] = [
        createSuccessResult(0, 'a'),
        createFailureResult(1, 'error'),
        createSuccessResult(2, 'c'),
      ];
      const config: ResultsConfig = { collect: true };
      
      const aggregated = aggregateLoopResults(iterations, config);
      
      expect(aggregated.results).toEqual(['a', undefined, 'c']);
      expect(aggregated.totalIterations).toBe(3);
      expect(aggregated.successCount).toBe(2);
      expect(aggregated.failureCount).toBe(1);
      expect(aggregated.allSucceeded).toBe(false);
    });

    it('should handle single iteration', () => {
      const iterations: IterationResult[] = [createSuccessResult(0, 42)];
      const config: ResultsConfig = { collect: true };
      
      const aggregated = aggregateLoopResults(iterations, config);
      
      expect(aggregated.results).toEqual([42]);
      expect(aggregated.totalIterations).toBe(1);
      expect(aggregated.successCount).toBe(1);
      expect(aggregated.failureCount).toBe(0);
      expect(aggregated.allSucceeded).toBe(true);
    });
  });
});
