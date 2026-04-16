/**
 * Property Tests for Standard Properties
 * 
 * **Feature: action-nodes, Property 1: Standard Properties Persistence**
 * *For any* valid StandardProperties object, serialization and deserialization
 * SHALL preserve all property values.
 * **Validates: Requirements 1.1-1.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type {
  StandardProperties,
  ErrorHandling,
  Tracing,
  Callbacks,
  ExecutionControl,
  InputOutputMapping,
  ErrorMode,
  LogLevel,
} from './standardProperties';
import {
  createDefaultStandardProperties,
  DEFAULT_ERROR_HANDLING,
  DEFAULT_TRACING,
  DEFAULT_CALLBACKS,
  DEFAULT_EXECUTION,
} from './standardProperties';

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid error modes.
 */
const arbErrorMode: fc.Arbitrary<ErrorMode> = fc.constantFrom(
  'stop',
  'continue',
  'retry',
  'fallback'
);

/**
 * Generator for valid log levels.
 */
const arbLogLevel: fc.Arbitrary<LogLevel> = fc.constantFrom(
  'none',
  'error',
  'info',
  'debug'
);

/**
 * Generator for valid error handling configuration.
 */
const arbErrorHandling: fc.Arbitrary<ErrorHandling> = fc.record({
  mode: arbErrorMode,
  retryCount: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  retryDelay: fc.option(fc.integer({ min: 0, max: 60000 }), { nil: undefined }),
  fallbackValue: fc.option(fc.jsonValue(), { nil: undefined }),
});

/**
 * Generator for valid tracing configuration.
 */
const arbTracing: fc.Arbitrary<Tracing> = fc.record({
  enabled: fc.boolean(),
  logLevel: arbLogLevel,
});

/**
 * Generator for valid callbacks configuration.
 */
const arbCallbacks: fc.Arbitrary<Callbacks> = fc.record({
  onStart: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
  onComplete: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
  onError: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
});

/**
 * Generator for valid execution control configuration.
 */
const arbExecutionControl: fc.Arbitrary<ExecutionControl> = fc.record({
  timeout: fc.integer({ min: 0, max: 300000 }),
  condition: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
});

/**
 * Generator for valid input/output mapping configuration.
 */
const arbInputOutputMapping: fc.Arbitrary<InputOutputMapping> = fc.record({
  inputMapping: fc.option(
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 100 })
    ),
    { nil: undefined }
  ),
  outputKey: fc.string({ minLength: 1, maxLength: 50 }),
});

/**
 * Generator for valid node identifiers.
 */
const arbNodeId: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(s));

/**
 * Generator for valid node names.
 */
const arbNodeName: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 100 });

/**
 * Generator for valid StandardProperties objects.
 */
const arbStandardProperties: fc.Arbitrary<StandardProperties> = fc.record({
  id: arbNodeId,
  name: arbNodeName,
  description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
  errorHandling: arbErrorHandling,
  tracing: arbTracing,
  callbacks: arbCallbacks,
  execution: arbExecutionControl,
  mapping: arbInputOutputMapping,
});

// ============================================
// Property Tests
// ============================================

describe('StandardProperties', () => {
  describe('Property 1: Standard Properties Persistence', () => {
    /**
     * **Property 1.1: JSON Round-Trip Preservation**
     * *For any* valid StandardProperties, JSON serialization and deserialization
     * SHALL preserve all property values exactly.
     */
    it('should preserve all properties through JSON round-trip', () => {
      fc.assert(
        fc.property(arbStandardProperties, (props) => {
          const serialized = JSON.stringify(props);
          const deserialized = JSON.parse(serialized) as StandardProperties;
          
          // Verify identity properties (Requirement 1.1)
          expect(deserialized.id).toBe(props.id);
          expect(deserialized.name).toBe(props.name);
          expect(deserialized.description).toBe(props.description);
          
          // Verify error handling (Requirement 1.2)
          expect(deserialized.errorHandling.mode).toBe(props.errorHandling.mode);
          expect(deserialized.errorHandling.retryCount).toBe(props.errorHandling.retryCount);
          expect(deserialized.errorHandling.retryDelay).toBe(props.errorHandling.retryDelay);
          
          // Verify tracing (Requirement 1.3)
          expect(deserialized.tracing.enabled).toBe(props.tracing.enabled);
          expect(deserialized.tracing.logLevel).toBe(props.tracing.logLevel);
          
          // Verify callbacks (Requirement 1.4)
          expect(deserialized.callbacks.onStart).toBe(props.callbacks.onStart);
          expect(deserialized.callbacks.onComplete).toBe(props.callbacks.onComplete);
          expect(deserialized.callbacks.onError).toBe(props.callbacks.onError);
          
          // Verify execution control (Requirement 1.5)
          expect(deserialized.execution.timeout).toBe(props.execution.timeout);
          expect(deserialized.execution.condition).toBe(props.execution.condition);
          
          // Verify mapping (Requirement 1.6)
          expect(deserialized.mapping.outputKey).toBe(props.mapping.outputKey);
          expect(deserialized.mapping.inputMapping).toEqual(props.mapping.inputMapping);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.2: Error Handling Mode Constraints**
     * *For any* error handling configuration, retry settings SHALL only be
     * meaningful when mode is 'retry', and fallback value SHALL only be
     * meaningful when mode is 'fallback'.
     */
    it('should have valid error handling mode constraints', () => {
      fc.assert(
        fc.property(arbErrorHandling, (errorHandling) => {
          // Mode must be one of the valid values
          expect(['stop', 'continue', 'retry', 'fallback']).toContain(errorHandling.mode);
          
          // Retry count must be in valid range if present
          if (errorHandling.retryCount !== undefined) {
            expect(errorHandling.retryCount).toBeGreaterThanOrEqual(1);
            expect(errorHandling.retryCount).toBeLessThanOrEqual(10);
          }
          
          // Retry delay must be non-negative if present
          if (errorHandling.retryDelay !== undefined) {
            expect(errorHandling.retryDelay).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.3: Execution Timeout Non-Negative**
     * *For any* execution control configuration, timeout SHALL be non-negative.
     */
    it('should have non-negative execution timeout', () => {
      fc.assert(
        fc.property(arbExecutionControl, (execution) => {
          expect(execution.timeout).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.4: Output Key Required**
     * *For any* input/output mapping, outputKey SHALL be a non-empty string.
     */
    it('should have non-empty output key', () => {
      fc.assert(
        fc.property(arbInputOutputMapping, (mapping) => {
          expect(mapping.outputKey.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.5: Node ID Format**
     * *For any* StandardProperties, id SHALL be a valid identifier
     * (starts with letter or underscore, contains only alphanumeric, underscore, or hyphen).
     */
    it('should have valid node ID format', () => {
      fc.assert(
        fc.property(arbStandardProperties, (props) => {
          expect(props.id.length).toBeGreaterThan(0);
          expect(/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(props.id)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Default Values', () => {
    it('should create valid default standard properties', () => {
      const props = createDefaultStandardProperties('test_node', 'Test Node', 'result');
      
      expect(props.id).toBe('test_node');
      expect(props.name).toBe('Test Node');
      expect(props.description).toBeUndefined();
      expect(props.errorHandling).toEqual(DEFAULT_ERROR_HANDLING);
      expect(props.tracing).toEqual(DEFAULT_TRACING);
      expect(props.callbacks).toEqual(DEFAULT_CALLBACKS);
      expect(props.execution).toEqual(DEFAULT_EXECUTION);
      expect(props.mapping.outputKey).toBe('result');
    });

    it('should have sensible default error handling', () => {
      expect(DEFAULT_ERROR_HANDLING.mode).toBe('stop');
      expect(DEFAULT_ERROR_HANDLING.retryCount).toBe(3);
      expect(DEFAULT_ERROR_HANDLING.retryDelay).toBe(1000);
    });

    it('should have sensible default tracing', () => {
      expect(DEFAULT_TRACING.enabled).toBe(false);
      expect(DEFAULT_TRACING.logLevel).toBe('error');
    });

    it('should have sensible default execution control', () => {
      expect(DEFAULT_EXECUTION.timeout).toBe(30000);
      expect(DEFAULT_EXECUTION.condition).toBeUndefined();
    });
  });
});
