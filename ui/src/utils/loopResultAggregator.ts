/**
 * Loop Result Aggregator Utility
 * 
 * Provides functions for aggregating loop iteration results.
 * Used by the Loop action node to collect and combine results
 * from forEach, while, and times loops.
 * 
 * @see Requirement 7.4: Result Aggregation
 */

import type { ResultsConfig } from '../types/actionNodes';

/**
 * Result of a single loop iteration.
 */
export interface IterationResult {
  /** Index of the iteration (0-based) */
  index: number;
  /** Output value from the iteration */
  value: unknown;
  /** Whether the iteration succeeded */
  success: boolean;
  /** Error message if iteration failed */
  error?: string;
}

/**
 * Aggregated results from a loop execution.
 */
export interface AggregatedResults {
  /** Array of all iteration results */
  results: unknown[];
  /** Total number of iterations */
  totalIterations: number;
  /** Number of successful iterations */
  successCount: number;
  /** Number of failed iterations */
  failureCount: number;
  /** Whether all iterations succeeded */
  allSucceeded: boolean;
}

/**
 * Aggregates loop iteration results based on configuration.
 * 
 * Properties:
 * - When collect is false, returns empty results array
 * - When collect is true, preserves order of iteration results
 * - Counts are always accurate regardless of collect setting
 * - allSucceeded is true only when all iterations succeed
 * 
 * @param iterations - Array of iteration results
 * @param config - Result aggregation configuration
 * @returns Aggregated results object
 * 
 * @see Requirement 7.4
 */
export function aggregateLoopResults(
  iterations: IterationResult[],
  config: ResultsConfig
): AggregatedResults {
  const totalIterations = iterations.length;
  const successCount = iterations.filter(i => i.success).length;
  const failureCount = totalIterations - successCount;
  const allSucceeded = failureCount === 0 && totalIterations > 0;
  
  // Only collect results if configured to do so
  const results = config.collect 
    ? iterations.map(i => i.value)
    : [];
  
  return {
    results,
    totalIterations,
    successCount,
    failureCount,
    allSucceeded,
  };
}

/**
 * Creates an iteration result from a successful execution.
 * 
 * @param index - Iteration index
 * @param value - Result value
 * @returns IterationResult with success=true
 */
export function createSuccessResult(index: number, value: unknown): IterationResult {
  return {
    index,
    value,
    success: true,
  };
}

/**
 * Creates an iteration result from a failed execution.
 * 
 * @param index - Iteration index
 * @param error - Error message
 * @returns IterationResult with success=false
 */
export function createFailureResult(index: number, error: string): IterationResult {
  return {
    index,
    value: undefined,
    success: false,
    error,
  };
}

/**
 * Validates that aggregated results are consistent.
 * 
 * Properties checked:
 * - successCount + failureCount === totalIterations
 * - results.length === totalIterations when collecting
 * - results.length === 0 when not collecting
 * - allSucceeded is consistent with counts
 * 
 * @param aggregated - Aggregated results to validate
 * @param config - Configuration used for aggregation
 * @returns true if results are valid
 */
export function validateAggregatedResults(
  aggregated: AggregatedResults,
  config: ResultsConfig
): boolean {
  // Count consistency
  if (aggregated.successCount + aggregated.failureCount !== aggregated.totalIterations) {
    return false;
  }
  
  // Results array length consistency
  if (config.collect) {
    if (aggregated.results.length !== aggregated.totalIterations) {
      return false;
    }
  } else {
    if (aggregated.results.length !== 0) {
      return false;
    }
  }
  
  // allSucceeded consistency
  const expectedAllSucceeded = aggregated.failureCount === 0 && aggregated.totalIterations > 0;
  if (aggregated.allSucceeded !== expectedAllSucceeded) {
    return false;
  }
  
  return true;
}

/**
 * Gets the state key for storing aggregated results.
 * 
 * @param config - Result aggregation configuration
 * @param defaultOutputKey - Default output key from node mapping
 * @returns State key to use for storing results
 */
export function getAggregationKey(
  config: ResultsConfig,
  defaultOutputKey: string
): string {
  return config.aggregationKey || defaultOutputKey;
}
