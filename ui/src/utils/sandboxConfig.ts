/**
 * Sandbox Configuration Utilities for ADK Studio
 * 
 * Provides utilities for validating and managing sandbox configurations
 * for Code action nodes.
 * 
 * Requirements: 10.2
 */

import type { SandboxConfig } from '../types/actionNodes';

// ============================================
// Constants
// ============================================

/**
 * Default sandbox configuration with strict security.
 * @see Requirement 10.2
 */
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  networkAccess: false,
  fileSystemAccess: false,
  memoryLimit: 128,
  timeLimit: 5000,
};

/**
 * Minimum allowed values for sandbox limits.
 */
export const SANDBOX_LIMITS = {
  memoryLimit: {
    min: 0,
    max: 1024,
    default: 128,
    unit: 'MB',
  },
  timeLimit: {
    min: 0,
    max: 60000,
    default: 5000,
    unit: 'ms',
  },
} as const;

// ============================================
// Security Level Types
// ============================================

/**
 * Security level of a sandbox configuration.
 * - strict: No network or file system access
 * - relaxed: Either network or file system access enabled
 * - open: Both network and file system access enabled
 */
export type SandboxSecurityLevel = 'strict' | 'relaxed' | 'open';

// ============================================
// Validation Functions
// ============================================

/**
 * Validates a sandbox configuration.
 * Returns an array of validation errors, or empty array if valid.
 * 
 * @param sandbox - The sandbox configuration to validate
 * @returns Array of validation error messages
 */
export function validateSandboxConfig(sandbox: SandboxConfig): string[] {
  const errors: string[] = [];
  
  // Validate memory limit
  if (sandbox.memoryLimit < SANDBOX_LIMITS.memoryLimit.min) {
    errors.push(`Memory limit cannot be negative`);
  }
  if (sandbox.memoryLimit > SANDBOX_LIMITS.memoryLimit.max) {
    errors.push(`Memory limit cannot exceed ${SANDBOX_LIMITS.memoryLimit.max}${SANDBOX_LIMITS.memoryLimit.unit}`);
  }
  
  // Validate time limit
  if (sandbox.timeLimit < SANDBOX_LIMITS.timeLimit.min) {
    errors.push(`Time limit cannot be negative`);
  }
  if (sandbox.timeLimit > SANDBOX_LIMITS.timeLimit.max) {
    errors.push(`Time limit cannot exceed ${SANDBOX_LIMITS.timeLimit.max}${SANDBOX_LIMITS.timeLimit.unit}`);
  }
  
  return errors;
}

/**
 * Checks if a sandbox configuration is valid.
 * 
 * @param sandbox - The sandbox configuration to check
 * @returns true if valid, false otherwise
 */
export function isSandboxConfigValid(sandbox: SandboxConfig): boolean {
  return validateSandboxConfig(sandbox).length === 0;
}

// ============================================
// Security Level Functions
// ============================================

/**
 * Determines the security level of a sandbox configuration.
 * 
 * @param sandbox - The sandbox configuration
 * @returns The security level
 * @see Requirement 10.2
 */
export function getSandboxSecurityLevel(sandbox: SandboxConfig): SandboxSecurityLevel {
  if (!sandbox.networkAccess && !sandbox.fileSystemAccess) {
    return 'strict';
  }
  if (sandbox.networkAccess && sandbox.fileSystemAccess) {
    return 'open';
  }
  return 'relaxed';
}

/**
 * Checks if a sandbox configuration is considered secure.
 * A configuration is secure if it has strict security level.
 * 
 * @param sandbox - The sandbox configuration
 * @returns true if secure (strict), false otherwise
 */
export function isSandboxSecure(sandbox: SandboxConfig): boolean {
  return getSandboxSecurityLevel(sandbox) === 'strict';
}

/**
 * Gets a human-readable description of the security level.
 * 
 * @param level - The security level
 * @returns Description string
 */
export function getSecurityLevelDescription(level: SandboxSecurityLevel): string {
  switch (level) {
    case 'strict':
      return 'No network or file system access. Code runs in complete isolation.';
    case 'relaxed':
      return 'Limited access enabled. Some restrictions have been relaxed.';
    case 'open':
      return 'Full access enabled. Code can make network requests and access the file system.';
  }
}

/**
 * Gets the icon for a security level.
 * 
 * @param level - The security level
 * @returns Emoji icon
 */
export function getSecurityLevelIcon(level: SandboxSecurityLevel): string {
  switch (level) {
    case 'strict':
      return '🔒';
    case 'relaxed':
      return '🔓';
    case 'open':
      return '⚠️';
  }
}

// ============================================
// Configuration Helpers
// ============================================

/**
 * Creates a sandbox configuration with the specified access permissions.
 * 
 * @param networkAccess - Whether to allow network access
 * @param fileSystemAccess - Whether to allow file system access
 * @param memoryLimit - Memory limit in MB (optional, defaults to 128)
 * @param timeLimit - Time limit in ms (optional, defaults to 5000)
 * @returns A new sandbox configuration
 */
export function createSandboxConfig(
  networkAccess: boolean = false,
  fileSystemAccess: boolean = false,
  memoryLimit: number = SANDBOX_LIMITS.memoryLimit.default,
  timeLimit: number = SANDBOX_LIMITS.timeLimit.default
): SandboxConfig {
  return {
    networkAccess,
    fileSystemAccess,
    memoryLimit,
    timeLimit,
  };
}

/**
 * Creates a strict sandbox configuration with no access permissions.
 * 
 * @returns A strict sandbox configuration
 */
export function createStrictSandbox(): SandboxConfig {
  return createSandboxConfig(false, false);
}

/**
 * Creates an open sandbox configuration with full access permissions.
 * Use with caution - only for trusted code.
 * 
 * @returns An open sandbox configuration
 */
export function createOpenSandbox(): SandboxConfig {
  return createSandboxConfig(true, true);
}

/**
 * Merges a partial sandbox configuration with defaults.
 * 
 * @param partial - Partial sandbox configuration
 * @returns Complete sandbox configuration
 */
export function mergeSandboxConfig(partial: Partial<SandboxConfig>): SandboxConfig {
  return {
    ...DEFAULT_SANDBOX_CONFIG,
    ...partial,
  };
}

// ============================================
// Serialization
// ============================================

/**
 * Serializes a sandbox configuration to a string representation.
 * Useful for display or logging.
 * 
 * @param sandbox - The sandbox configuration
 * @returns String representation
 */
export function sandboxConfigToString(sandbox: SandboxConfig): string {
  const parts: string[] = [];
  
  if (sandbox.networkAccess) {
    parts.push('network');
  }
  if (sandbox.fileSystemAccess) {
    parts.push('fs');
  }
  if (sandbox.memoryLimit > 0) {
    parts.push(`mem:${sandbox.memoryLimit}MB`);
  }
  if (sandbox.timeLimit > 0) {
    parts.push(`time:${sandbox.timeLimit}ms`);
  }
  
  if (parts.length === 0) {
    return 'strict (no access)';
  }
  
  return parts.join(', ');
}

/**
 * Gets a summary of the sandbox configuration for display.
 * 
 * @param sandbox - The sandbox configuration
 * @returns Summary object with icon, label, and description
 */
export function getSandboxSummary(sandbox: SandboxConfig): {
  icon: string;
  label: string;
  description: string;
  level: SandboxSecurityLevel;
} {
  const level = getSandboxSecurityLevel(sandbox);
  return {
    icon: getSecurityLevelIcon(level),
    label: level.charAt(0).toUpperCase() + level.slice(1),
    description: getSecurityLevelDescription(level),
    level,
  };
}
