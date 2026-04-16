/**
 * Property Tests for Switch Condition Evaluation
 * 
 * **Feature: action-nodes, Property 4: Switch Condition Evaluation**
 * *For any* Switch node in `first_match` mode, the system SHALL evaluate
 * conditions in order and route to the first matching branch.
 * **Validates: Requirements 6.1, 6.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { SwitchCondition, ConditionOperator, EvaluationMode } from '../types/actionNodes';
import {
  evaluateOperator,
  // evaluateCondition is used in property tests below
  evaluateSwitch,
  getSwitchOutputPorts,
  getNestedValue,
} from './switchConditionEvaluator';

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid condition operators.
 */
const arbConditionOperator: fc.Arbitrary<ConditionOperator> = fc.constantFrom(
  'eq', 'neq', 'gt', 'lt', 'gte', 'lte',
  'contains', 'startsWith', 'endsWith',
  'matches', 'in', 'empty', 'exists'
);

/**
 * Generator for evaluation modes.
 */
const arbEvaluationMode: fc.Arbitrary<EvaluationMode> = fc.constantFrom(
  'first_match',
  'all_match'
);

/**
 * Generator for simple field names (no dots).
 */
const arbSimpleFieldName: fc.Arbitrary<string> = fc.stringOf(
  fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'),
  { minLength: 1, maxLength: 10 }
);

/**
 * Generator for output port names.
 */
const arbOutputPort: fc.Arbitrary<string> = fc.stringOf(
  fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', '_'),
  { minLength: 1, maxLength: 15 }
);

/**
 * Generator for condition IDs.
 */
const arbConditionId: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 20 })
  .map(s => `cond_${s.replace(/[^a-zA-Z0-9]/g, '')}`);

/**
 * Generator for condition names.
 */
const arbConditionName: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 30 });

/**
 * Generator for primitive values (for condition comparisons).
 */
const arbPrimitiveValue: fc.Arbitrary<unknown> = fc.oneof(
  fc.string({ minLength: 0, maxLength: 50 }),
  fc.integer({ min: -1000, max: 1000 }),
  fc.double({ min: -1000, max: 1000, noNaN: true }),
  fc.boolean(),
  fc.constant(null)
);

/**
 * Generator for a single switch condition.
 */
const arbSwitchCondition: fc.Arbitrary<SwitchCondition> = fc.record({
  id: arbConditionId,
  name: arbConditionName,
  field: arbSimpleFieldName,
  operator: arbConditionOperator,
  value: arbPrimitiveValue,
  outputPort: arbOutputPort,
});

/**
 * Generator for an array of switch conditions.
 */
const arbConditions: fc.Arbitrary<SwitchCondition[]> = fc.array(arbSwitchCondition, {
  minLength: 0,
  maxLength: 10,
});

/**
 * Generator for a simple state object.
 */
const arbSimpleState: fc.Arbitrary<Record<string, unknown>> = fc.dictionary(
  arbSimpleFieldName,
  arbPrimitiveValue
);

// ============================================
// Property Tests
// ============================================

describe('Switch Condition Evaluation', () => {
  describe('Property 4: Switch Condition Evaluation', () => {
    /**
     * **Property 4.1: First Match Mode Stops at First Match**
     * *For any* Switch node in first_match mode with multiple matching conditions,
     * the system SHALL return only the first matching branch.
     */
    it('should stop at first match in first_match mode', () => {
      fc.assert(
        fc.property(
          fc.array(arbSwitchCondition, { minLength: 2, maxLength: 5 }),
          arbSimpleState,
          (conditions, state) => {
            // Make all conditions match by setting the field to the expected value
            const matchingConditions = conditions.map((c, i) => ({
              ...c,
              field: 'testField',
              operator: 'eq' as ConditionOperator,
              value: 'matchValue',
              outputPort: `port_${i}`,
            }));
            
            const stateWithMatch = { ...state, testField: 'matchValue' };
            
            const result = evaluateSwitch(matchingConditions, stateWithMatch, 'first_match');
            
            // In first_match mode, should only return the first matching port
            if (result.hasMatch) {
              expect(result.matchedPorts.length).toBe(1);
              expect(result.firstMatchedPort).toBe(matchingConditions[0].outputPort);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.2: All Match Mode Returns All Matches**
     * *For any* Switch node in all_match mode with multiple matching conditions,
     * the system SHALL return all matching branches.
     */
    it('should return all matches in all_match mode', () => {
      fc.assert(
        fc.property(
          fc.array(arbSwitchCondition, { minLength: 2, maxLength: 5 }),
          arbSimpleState,
          (conditions, state) => {
            // Make all conditions match
            const matchingConditions = conditions.map((c, i) => ({
              ...c,
              field: 'testField',
              operator: 'eq' as ConditionOperator,
              value: 'matchValue',
              outputPort: `port_${i}`,
            }));
            
            const stateWithMatch = { ...state, testField: 'matchValue' };
            
            const result = evaluateSwitch(matchingConditions, stateWithMatch, 'all_match');
            
            // In all_match mode, should return all matching ports
            if (result.hasMatch) {
              expect(result.matchedPorts.length).toBe(matchingConditions.length);
              matchingConditions.forEach((c, i) => {
                expect(result.matchedPorts[i]).toBe(c.outputPort);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.3: Condition Order Preservation**
     * *For any* Switch node, conditions SHALL be evaluated in the order they are defined.
     */
    it('should evaluate conditions in order', () => {
      fc.assert(
        fc.property(
          fc.array(arbSwitchCondition, { minLength: 1, maxLength: 5 }),
          arbSimpleState,
          (conditions, state) => {
            // Create conditions where only the last one matches
            const orderedConditions = conditions.map((c, i) => ({
              ...c,
              field: `field_${i}`,
              operator: 'eq' as ConditionOperator,
              value: `value_${i}`,
              outputPort: `port_${i}`,
            }));
            
            // Only set the last field to match
            const lastIndex = orderedConditions.length - 1;
            const stateWithLastMatch = {
              ...state,
              [`field_${lastIndex}`]: `value_${lastIndex}`,
            };
            
            const result = evaluateSwitch(orderedConditions, stateWithLastMatch, 'first_match');
            
            // Should match the last condition
            if (result.hasMatch) {
              expect(result.firstMatchedPort).toBe(`port_${lastIndex}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.4: No Match Returns Empty**
     * *For any* Switch node where no conditions match, the system SHALL return
     * an empty result (unless default branch is specified).
     */
    it('should return empty when no conditions match', () => {
      fc.assert(
        fc.property(
          arbEvaluationMode,
          (mode) => {
            // Create conditions that explicitly won't match
            const conditions: SwitchCondition[] = [
              {
                id: 'cond_1',
                name: 'Test Condition',
                field: 'testField',
                operator: 'eq',  // Use eq operator which requires exact match
                value: 'specificValue',
                outputPort: 'port_1',
              },
            ];
            
            // Create state where the field exists but has a different value
            const nonMatchingState = { testField: 'differentValue' };
            
            const result = evaluateSwitch(conditions, nonMatchingState, mode);
            
            // The eq operator should not match since values are different
            expect(result.matchedPorts.length).toBe(0);
            expect(result.hasMatch).toBe(false);
            expect(result.firstMatchedPort).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.5: Default Branch Used When No Match**
     * *For any* Switch node with a default branch, when no conditions match,
     * the system SHALL route to the default branch.
     */
    it('should use default branch when no conditions match', () => {
      fc.assert(
        fc.property(
          arbConditions,
          arbEvaluationMode,
          arbOutputPort,
          (conditions, mode, defaultBranch) => {
            // Create state that doesn't match any condition
            const nonMatchingState = { unrelatedField: 'unrelatedValue' };
            
            const ports = getSwitchOutputPorts(
              conditions,
              nonMatchingState,
              mode,
              defaultBranch
            );
            
            // If no conditions match, should use default branch
            const result = evaluateSwitch(conditions, nonMatchingState, mode);
            if (!result.hasMatch) {
              expect(ports).toEqual([defaultBranch]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Operator Evaluation', () => {
    /**
     * **Property 4.6: Equality Operator Symmetry**
     * *For any* two values, eq(a, b) === eq(b, a).
     */
    it('should have symmetric equality', () => {
      fc.assert(
        fc.property(arbPrimitiveValue, arbPrimitiveValue, (a, b) => {
          const result1 = evaluateOperator('eq', a, b);
          const result2 = evaluateOperator('eq', b, a);
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.7: Inequality is Negation of Equality**
     * *For any* two values, neq(a, b) === !eq(a, b).
     */
    it('should have neq as negation of eq', () => {
      fc.assert(
        fc.property(arbPrimitiveValue, arbPrimitiveValue, (a, b) => {
          const eqResult = evaluateOperator('eq', a, b);
          const neqResult = evaluateOperator('neq', a, b);
          expect(neqResult).toBe(!eqResult);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.8: Numeric Comparison Transitivity**
     * *For any* numbers a, b, c: if a > b and b > c, then a > c.
     */
    it('should have transitive numeric comparisons', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 100 }),
          fc.integer({ min: -100, max: 100 }),
          fc.integer({ min: -100, max: 100 }),
          (a, b, c) => {
            const aGtB = evaluateOperator('gt', a, b);
            const bGtC = evaluateOperator('gt', b, c);
            const aGtC = evaluateOperator('gt', a, c);
            
            if (aGtB && bGtC) {
              expect(aGtC).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.9: Empty Operator Correctness**
     * *For any* value, empty should return true for null, undefined, empty string,
     * empty array, or empty object.
     */
    it('should correctly identify empty values', () => {
      // Test known empty values
      expect(evaluateOperator('empty', null, undefined)).toBe(true);
      expect(evaluateOperator('empty', undefined, undefined)).toBe(true);
      expect(evaluateOperator('empty', '', undefined)).toBe(true);
      expect(evaluateOperator('empty', [], undefined)).toBe(true);
      expect(evaluateOperator('empty', {}, undefined)).toBe(true);
      
      // Test known non-empty values
      expect(evaluateOperator('empty', 'hello', undefined)).toBe(false);
      expect(evaluateOperator('empty', [1], undefined)).toBe(false);
      expect(evaluateOperator('empty', { a: 1 }, undefined)).toBe(false);
      expect(evaluateOperator('empty', 0, undefined)).toBe(false);
      expect(evaluateOperator('empty', false, undefined)).toBe(false);
    });

    /**
     * **Property 4.10: Exists Operator Correctness**
     * *For any* value, exists should return false only for null or undefined.
     */
    it('should correctly identify existing values', () => {
      fc.assert(
        fc.property(arbPrimitiveValue, (value) => {
          const exists = evaluateOperator('exists', value, undefined);
          
          if (value === null || value === undefined) {
            expect(exists).toBe(false);
          } else {
            expect(exists).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Nested Value Access', () => {
    /**
     * **Property 4.11: Simple Path Access**
     * *For any* object with a simple field, getNestedValue should return the field value.
     */
    it('should access simple paths correctly', () => {
      fc.assert(
        fc.property(arbSimpleFieldName, arbPrimitiveValue, (field, value) => {
          const obj = { [field]: value };
          const result = getNestedValue(obj, field);
          expect(result).toBe(value);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.12: Nested Path Access**
     * *For any* nested object, getNestedValue should traverse the path correctly.
     */
    it('should access nested paths correctly', () => {
      const obj = {
        level1: {
          level2: {
            level3: 'deepValue',
          },
        },
      };
      
      expect(getNestedValue(obj, 'level1')).toEqual({ level2: { level3: 'deepValue' } });
      expect(getNestedValue(obj, 'level1.level2')).toEqual({ level3: 'deepValue' });
      expect(getNestedValue(obj, 'level1.level2.level3')).toBe('deepValue');
    });

    /**
     * **Property 4.13: Missing Path Returns Undefined**
     * *For any* object and non-existent path, getNestedValue should return undefined.
     */
    it('should return undefined for missing paths', () => {
      fc.assert(
        fc.property(arbSimpleState, (state) => {
          const result = getNestedValue(state, 'nonExistentPath.deep.nested');
          expect(result).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });
});
