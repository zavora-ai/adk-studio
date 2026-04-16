/**
 * Switch Condition Evaluator
 * 
 * Utility functions for evaluating Switch node conditions.
 * Used for both runtime execution and property testing.
 * 
 * @see Requirements 6.1, 6.2
 */

import type { 
  SwitchCondition, 
  ConditionOperator, 
  EvaluationMode 
} from '../types/actionNodes';

/**
 * Result of evaluating a single condition.
 */
export interface ConditionResult {
  conditionId: string;
  matched: boolean;
  outputPort: string;
}

/**
 * Result of evaluating all conditions in a Switch node.
 */
export interface SwitchEvaluationResult {
  /** The output ports that matched */
  matchedPorts: string[];
  /** Detailed results for each condition */
  conditionResults: ConditionResult[];
  /** Whether any condition matched */
  hasMatch: boolean;
  /** The first matched port (for first_match mode) */
  firstMatchedPort: string | null;
}

/**
 * Get a nested value from an object using dot notation.
 * 
 * @param obj - The object to get the value from
 * @param path - Dot-separated path (e.g., "user.profile.name")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (typeof current !== 'object') {
      return undefined;
    }
    
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

/**
 * Evaluate a single condition against a state value.
 * 
 * @param operator - The comparison operator
 * @param fieldValue - The value from the state
 * @param conditionValue - The value to compare against
 * @returns Whether the condition matches
 * 
 * @see Requirement 6.1
 */
export function evaluateOperator(
  operator: ConditionOperator,
  fieldValue: unknown,
  conditionValue: unknown
): boolean {
  switch (operator) {
    case 'eq':
      return fieldValue === conditionValue;
    
    case 'neq':
      return fieldValue !== conditionValue;
    
    case 'gt':
      if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
        return fieldValue > conditionValue;
      }
      return false;
    
    case 'lt':
      if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
        return fieldValue < conditionValue;
      }
      return false;
    
    case 'gte':
      if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
        return fieldValue >= conditionValue;
      }
      return false;
    
    case 'lte':
      if (typeof fieldValue === 'number' && typeof conditionValue === 'number') {
        return fieldValue <= conditionValue;
      }
      return false;
    
    case 'contains':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.includes(conditionValue);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(conditionValue);
      }
      return false;
    
    case 'startsWith':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.startsWith(conditionValue);
      }
      return false;
    
    case 'endsWith':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        return fieldValue.endsWith(conditionValue);
      }
      return false;
    
    case 'matches':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        try {
          const regex = new RegExp(conditionValue);
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      }
      return false;
    
    case 'in':
      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(fieldValue);
      }
      return false;
    
    case 'empty':
      if (fieldValue === null || fieldValue === undefined) {
        return true;
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.length === 0;
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.length === 0;
      }
      if (typeof fieldValue === 'object') {
        return Object.keys(fieldValue).length === 0;
      }
      return false;
    
    case 'exists':
      return fieldValue !== null && fieldValue !== undefined;
    
    default:
      return false;
  }
}

/**
 * Evaluate a single condition against the state.
 * 
 * @param condition - The condition to evaluate
 * @param state - The workflow state object
 * @returns The result of evaluating the condition
 * 
 * @see Requirement 6.1
 */
export function evaluateCondition(
  condition: SwitchCondition,
  state: Record<string, unknown>
): ConditionResult {
  const fieldValue = getNestedValue(state, condition.field);
  const matched = evaluateOperator(condition.operator, fieldValue, condition.value);
  
  return {
    conditionId: condition.id,
    matched,
    outputPort: condition.outputPort,
  };
}

/**
 * Evaluate all conditions in a Switch node.
 * 
 * In first_match mode, evaluation stops at the first matching condition.
 * In all_match mode, all conditions are evaluated.
 * 
 * @param conditions - Array of conditions to evaluate
 * @param state - The workflow state object
 * @param evaluationMode - The evaluation mode (first_match or all_match)
 * @returns The evaluation result with matched ports
 * 
 * @see Requirements 6.1, 6.2
 */
export function evaluateSwitch(
  conditions: SwitchCondition[],
  state: Record<string, unknown>,
  evaluationMode: EvaluationMode
): SwitchEvaluationResult {
  const conditionResults: ConditionResult[] = [];
  const matchedPorts: string[] = [];
  let firstMatchedPort: string | null = null;
  
  for (const condition of conditions) {
    const result = evaluateCondition(condition, state);
    conditionResults.push(result);
    
    if (result.matched) {
      matchedPorts.push(result.outputPort);
      
      if (firstMatchedPort === null) {
        firstMatchedPort = result.outputPort;
      }
      
      // In first_match mode, stop after first match
      if (evaluationMode === 'first_match') {
        break;
      }
    }
  }
  
  return {
    matchedPorts,
    conditionResults,
    hasMatch: matchedPorts.length > 0,
    firstMatchedPort,
  };
}

/**
 * Get the output port for a Switch node evaluation.
 * 
 * @param conditions - Array of conditions to evaluate
 * @param state - The workflow state object
 * @param evaluationMode - The evaluation mode
 * @param defaultBranch - Optional default branch if no conditions match
 * @returns The output port(s) to route to
 * 
 * @see Requirements 6.1, 6.2
 */
export function getSwitchOutputPorts(
  conditions: SwitchCondition[],
  state: Record<string, unknown>,
  evaluationMode: EvaluationMode,
  defaultBranch?: string
): string[] {
  const result = evaluateSwitch(conditions, state, evaluationMode);
  
  if (result.hasMatch) {
    if (evaluationMode === 'first_match') {
      return [result.firstMatchedPort!];
    }
    return result.matchedPorts;
  }
  
  // No match - use default branch if available
  if (defaultBranch) {
    return [defaultBranch];
  }
  
  return [];
}
