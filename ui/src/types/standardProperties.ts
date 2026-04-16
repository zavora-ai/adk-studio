import type { Position } from './project';

/**
 * Standard Properties for Action Nodes
 * 
 * All action nodes share these standard properties for consistent behavior
 * across error handling, tracing, callbacks, execution control, and I/O mapping.
 * 
 * @see Requirements 1.1-1.6
 */

// ============================================
// Error Handling (Requirement 1.2)
// ============================================

/**
 * Error handling mode determines how the node behaves when an error occurs.
 * - stop: Halt workflow execution on error
 * - continue: Log error and continue to next node
 * - retry: Retry the operation with configurable count and delay
 * - fallback: Use a fallback value on error
 */
export type ErrorMode = 'stop' | 'continue' | 'retry' | 'fallback';

/**
 * Error handling configuration for action nodes.
 * @see Requirement 1.2
 */
export interface ErrorHandling {
  /** Error handling mode */
  mode: ErrorMode;
  /** Number of retry attempts (1-10), used when mode is 'retry' */
  retryCount?: number;
  /** Delay between retries in milliseconds, used when mode is 'retry' */
  retryDelay?: number;
  /** Fallback value to use when mode is 'fallback' */
  fallbackValue?: unknown;
}

// ============================================
// Tracing & Observability (Requirement 1.3)
// ============================================

/**
 * Log level for tracing output.
 * - none: No logging
 * - error: Only errors
 * - info: Errors and info messages
 * - debug: All messages including debug
 */
export type LogLevel = 'none' | 'error' | 'info' | 'debug';

/**
 * Tracing and observability configuration.
 * @see Requirement 1.3
 */
export interface Tracing {
  /** Enable detailed execution traces */
  enabled: boolean;
  /** Log level for this node */
  logLevel: LogLevel;
}

// ============================================
// Callbacks (Requirement 1.4)
// ============================================

/**
 * Lifecycle callbacks for action nodes.
 * Callbacks can be function names or inline code expressions.
 * @see Requirement 1.4
 */
export interface Callbacks {
  /** Callback fired before node execution */
  onStart?: string;
  /** Callback fired after successful execution */
  onComplete?: string;
  /** Callback fired on execution failure */
  onError?: string;
}

// ============================================
// Execution Control (Requirement 1.5)
// ============================================

/**
 * Execution control configuration.
 * @see Requirement 1.5
 */
export interface ExecutionControl {
  /** Timeout in milliseconds (default: 30000) */
  timeout: number;
  /** Expression to evaluate - skip node if false */
  condition?: string;
}

// ============================================
// Input/Output Mapping (Requirement 1.6)
// ============================================

/**
 * Input/output mapping configuration.
 * Supports dot notation for nested paths (e.g., "data.user.name").
 * @see Requirement 1.6
 */
export interface InputOutputMapping {
  /** Maps state fields to node inputs (state field -> node input) */
  inputMapping?: Record<string, string>;
  /** Key where result is stored in state */
  outputKey: string;
}

// ============================================
// Standard Properties (Requirements 1.1-1.6)
// ============================================

/**
 * Standard properties shared by all action nodes.
 * These provide consistent behavior for identity, error handling,
 * tracing, callbacks, execution control, and I/O mapping.
 * 
 * @see Requirements 1.1-1.6
 */
export interface StandardProperties {
  // Identity (Requirement 1.1)
  /** Unique identifier for the node */
  id: string;
  /** Display name for the node */
  name: string;
  /** Optional description shown in tooltip */
  description?: string;
  /** Optional canvas position for persisted free-form layouts */
  position?: Position;

  // Error Handling (Requirement 1.2)
  errorHandling: ErrorHandling;

  // Tracing & Observability (Requirement 1.3)
  tracing: Tracing;

  // Callbacks (Requirement 1.4)
  callbacks: Callbacks;

  // Execution Control (Requirement 1.5)
  execution: ExecutionControl;

  // Input/Output Mapping (Requirement 1.6)
  mapping: InputOutputMapping;
}

// ============================================
// Default Values
// ============================================

/**
 * Default error handling configuration.
 */
export const DEFAULT_ERROR_HANDLING: ErrorHandling = {
  mode: 'stop',
  retryCount: 3,
  retryDelay: 1000,
};

/**
 * Default tracing configuration.
 */
export const DEFAULT_TRACING: Tracing = {
  enabled: false,
  logLevel: 'error',
};

/**
 * Default callbacks configuration.
 */
export const DEFAULT_CALLBACKS: Callbacks = {};

/**
 * Default execution control configuration.
 */
export const DEFAULT_EXECUTION: ExecutionControl = {
  timeout: 30000,
};

/**
 * Creates default standard properties for a new action node.
 * @param id - Unique identifier for the node
 * @param name - Display name for the node
 * @param outputKey - Key where result is stored in state
 */
export function createDefaultStandardProperties(
  id: string,
  name: string,
  outputKey: string
): StandardProperties {
  return {
    id,
    name,
    errorHandling: { ...DEFAULT_ERROR_HANDLING },
    tracing: { ...DEFAULT_TRACING },
    callbacks: { ...DEFAULT_CALLBACKS },
    execution: { ...DEFAULT_EXECUTION },
    mapping: { outputKey },
  };
}
