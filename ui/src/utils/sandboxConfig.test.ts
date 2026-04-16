/**
 * Property Tests for Code Sandbox Isolation
 * 
 * **Feature: action-nodes, Property 7: Code Sandbox Isolation**
 * *For any* sandbox configuration, the security constraints SHALL be enforced
 * and the security level SHALL be correctly determined.
 * **Validates: Requirements 10.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { SandboxConfig } from '../types/actionNodes';
import {
  DEFAULT_SANDBOX_CONFIG,
  SANDBOX_LIMITS,
  validateSandboxConfig,
  isSandboxConfigValid,
  getSandboxSecurityLevel,
  isSandboxSecure,
  getSecurityLevelDescription,
  getSecurityLevelIcon,
  createSandboxConfig,
  createStrictSandbox,
  createOpenSandbox,
  mergeSandboxConfig,
  sandboxConfigToString,
  getSandboxSummary,
  type SandboxSecurityLevel,
} from './sandboxConfig';

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid sandbox configurations.
 */
const arbSandboxConfig: fc.Arbitrary<SandboxConfig> = fc.record({
  networkAccess: fc.boolean(),
  fileSystemAccess: fc.boolean(),
  memoryLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
  timeLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
});

/**
 * Generator for sandbox configurations with invalid memory limits.
 */
const arbInvalidMemoryConfig: fc.Arbitrary<SandboxConfig> = fc.record({
  networkAccess: fc.boolean(),
  fileSystemAccess: fc.boolean(),
  memoryLimit: fc.oneof(
    fc.integer({ min: -1000, max: -1 }),
    fc.integer({ min: SANDBOX_LIMITS.memoryLimit.max + 1, max: SANDBOX_LIMITS.memoryLimit.max + 1000 })
  ),
  timeLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
});

/**
 * Generator for sandbox configurations with invalid time limits.
 */
const arbInvalidTimeConfig: fc.Arbitrary<SandboxConfig> = fc.record({
  networkAccess: fc.boolean(),
  fileSystemAccess: fc.boolean(),
  memoryLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
  timeLimit: fc.oneof(
    fc.integer({ min: -1000, max: -1 }),
    fc.integer({ min: SANDBOX_LIMITS.timeLimit.max + 1, max: SANDBOX_LIMITS.timeLimit.max + 10000 })
  ),
});

/**
 * Generator for strict sandbox configurations (no access).
 */
const arbStrictSandbox: fc.Arbitrary<SandboxConfig> = fc.record({
  networkAccess: fc.constant(false),
  fileSystemAccess: fc.constant(false),
  memoryLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
  timeLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
});

/**
 * Generator for open sandbox configurations (full access).
 */
const arbOpenSandbox: fc.Arbitrary<SandboxConfig> = fc.record({
  networkAccess: fc.constant(true),
  fileSystemAccess: fc.constant(true),
  memoryLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
  timeLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
});

/**
 * Generator for relaxed sandbox configurations (partial access).
 */
const arbRelaxedSandbox: fc.Arbitrary<SandboxConfig> = fc.oneof(
  fc.record({
    networkAccess: fc.constant(true),
    fileSystemAccess: fc.constant(false),
    memoryLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
    timeLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
  }),
  fc.record({
    networkAccess: fc.constant(false),
    fileSystemAccess: fc.constant(true),
    memoryLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
    timeLimit: fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
  })
);

/**
 * Generator for security levels.
 */
const arbSecurityLevel: fc.Arbitrary<SandboxSecurityLevel> = fc.constantFrom(
  'strict', 'relaxed', 'open'
);

// ============================================
// Property Tests
// ============================================

describe('Code Sandbox Isolation', () => {
  describe('Property 7: Code Sandbox Isolation', () => {
    /**
     * **Property 7.1: Strict Sandbox Has No Access**
     * *For any* sandbox configuration with both networkAccess and fileSystemAccess
     * set to false, the security level SHALL be 'strict'.
     * @see Requirement 10.2.1, 10.2.2
     */
    it('should classify sandbox as strict when no access is enabled', () => {
      fc.assert(
        fc.property(arbStrictSandbox, (sandbox) => {
          const level = getSandboxSecurityLevel(sandbox);
          expect(level).toBe('strict');
          expect(isSandboxSecure(sandbox)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.2: Open Sandbox Has Full Access**
     * *For any* sandbox configuration with both networkAccess and fileSystemAccess
     * set to true, the security level SHALL be 'open'.
     * @see Requirement 10.2.1, 10.2.2
     */
    it('should classify sandbox as open when full access is enabled', () => {
      fc.assert(
        fc.property(arbOpenSandbox, (sandbox) => {
          const level = getSandboxSecurityLevel(sandbox);
          expect(level).toBe('open');
          expect(isSandboxSecure(sandbox)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.3: Relaxed Sandbox Has Partial Access**
     * *For any* sandbox configuration with exactly one of networkAccess or
     * fileSystemAccess set to true, the security level SHALL be 'relaxed'.
     * @see Requirement 10.2.1, 10.2.2
     */
    it('should classify sandbox as relaxed when partial access is enabled', () => {
      fc.assert(
        fc.property(arbRelaxedSandbox, (sandbox) => {
          const level = getSandboxSecurityLevel(sandbox);
          expect(level).toBe('relaxed');
          expect(isSandboxSecure(sandbox)).toBe(false);
          // Verify exactly one access is enabled
          expect(sandbox.networkAccess !== sandbox.fileSystemAccess).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.4: Valid Memory Limits Are Accepted**
     * *For any* sandbox configuration with memory limit within valid range,
     * the configuration SHALL be valid.
     * @see Requirement 10.2.3
     */
    it('should accept valid memory limits', () => {
      fc.assert(
        fc.property(arbSandboxConfig, (sandbox) => {
          const errors = validateSandboxConfig(sandbox);
          const memoryErrors = errors.filter(e => e.toLowerCase().includes('memory'));
          expect(memoryErrors.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.5: Invalid Memory Limits Are Rejected**
     * *For any* sandbox configuration with memory limit outside valid range,
     * the configuration SHALL be invalid.
     * @see Requirement 10.2.3
     */
    it('should reject invalid memory limits', () => {
      fc.assert(
        fc.property(arbInvalidMemoryConfig, (sandbox) => {
          const errors = validateSandboxConfig(sandbox);
          expect(errors.length).toBeGreaterThan(0);
          expect(isSandboxConfigValid(sandbox)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.6: Valid Time Limits Are Accepted**
     * *For any* sandbox configuration with time limit within valid range,
     * the configuration SHALL be valid.
     * @see Requirement 10.2.4
     */
    it('should accept valid time limits', () => {
      fc.assert(
        fc.property(arbSandboxConfig, (sandbox) => {
          const errors = validateSandboxConfig(sandbox);
          const timeErrors = errors.filter(e => e.toLowerCase().includes('time'));
          expect(timeErrors.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.7: Invalid Time Limits Are Rejected**
     * *For any* sandbox configuration with time limit outside valid range,
     * the configuration SHALL be invalid.
     * @see Requirement 10.2.4
     */
    it('should reject invalid time limits', () => {
      fc.assert(
        fc.property(arbInvalidTimeConfig, (sandbox) => {
          const errors = validateSandboxConfig(sandbox);
          expect(errors.length).toBeGreaterThan(0);
          expect(isSandboxConfigValid(sandbox)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.8: Security Level Completeness**
     * *For any* sandbox configuration, the security level SHALL be one of
     * 'strict', 'relaxed', or 'open'.
     */
    it('should always return a valid security level', () => {
      fc.assert(
        fc.property(arbSandboxConfig, (sandbox) => {
          const level = getSandboxSecurityLevel(sandbox);
          expect(['strict', 'relaxed', 'open']).toContain(level);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.9: Security Level Determinism**
     * *For any* sandbox configuration, calling getSandboxSecurityLevel multiple
     * times SHALL return the same result.
     */
    it('should return consistent security level for same configuration', () => {
      fc.assert(
        fc.property(arbSandboxConfig, (sandbox) => {
          const level1 = getSandboxSecurityLevel(sandbox);
          const level2 = getSandboxSecurityLevel(sandbox);
          const level3 = getSandboxSecurityLevel(sandbox);
          expect(level1).toBe(level2);
          expect(level2).toBe(level3);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 7.10: Default Configuration Is Strict**
     * The default sandbox configuration SHALL have strict security level.
     */
    it('should have strict default configuration', () => {
      const level = getSandboxSecurityLevel(DEFAULT_SANDBOX_CONFIG);
      expect(level).toBe('strict');
      expect(isSandboxSecure(DEFAULT_SANDBOX_CONFIG)).toBe(true);
      expect(DEFAULT_SANDBOX_CONFIG.networkAccess).toBe(false);
      expect(DEFAULT_SANDBOX_CONFIG.fileSystemAccess).toBe(false);
    });
  });

  describe('Helper Functions', () => {
    /**
     * **Property: createSandboxConfig produces valid configurations**
     */
    it('should create valid sandbox configurations', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }),
          fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }),
          (network, fs, memory, time) => {
            const sandbox = createSandboxConfig(network, fs, memory, time);
            expect(isSandboxConfigValid(sandbox)).toBe(true);
            expect(sandbox.networkAccess).toBe(network);
            expect(sandbox.fileSystemAccess).toBe(fs);
            expect(sandbox.memoryLimit).toBe(memory);
            expect(sandbox.timeLimit).toBe(time);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: createStrictSandbox produces strict configuration**
     */
    it('should create strict sandbox configuration', () => {
      const sandbox = createStrictSandbox();
      expect(getSandboxSecurityLevel(sandbox)).toBe('strict');
      expect(sandbox.networkAccess).toBe(false);
      expect(sandbox.fileSystemAccess).toBe(false);
    });

    /**
     * **Property: createOpenSandbox produces open configuration**
     */
    it('should create open sandbox configuration', () => {
      const sandbox = createOpenSandbox();
      expect(getSandboxSecurityLevel(sandbox)).toBe('open');
      expect(sandbox.networkAccess).toBe(true);
      expect(sandbox.fileSystemAccess).toBe(true);
    });

    /**
     * **Property: mergeSandboxConfig preserves provided values**
     */
    it('should merge partial configurations with defaults', () => {
      fc.assert(
        fc.property(
          fc.record({
            networkAccess: fc.option(fc.boolean(), { nil: undefined }),
            fileSystemAccess: fc.option(fc.boolean(), { nil: undefined }),
            memoryLimit: fc.option(fc.integer({ min: 0, max: SANDBOX_LIMITS.memoryLimit.max }), { nil: undefined }),
            timeLimit: fc.option(fc.integer({ min: 0, max: SANDBOX_LIMITS.timeLimit.max }), { nil: undefined }),
          }),
          (partial) => {
            const merged = mergeSandboxConfig(partial as Partial<SandboxConfig>);
            
            // Provided values should be preserved
            if (partial.networkAccess !== undefined) {
              expect(merged.networkAccess).toBe(partial.networkAccess);
            }
            if (partial.fileSystemAccess !== undefined) {
              expect(merged.fileSystemAccess).toBe(partial.fileSystemAccess);
            }
            if (partial.memoryLimit !== undefined) {
              expect(merged.memoryLimit).toBe(partial.memoryLimit);
            }
            if (partial.timeLimit !== undefined) {
              expect(merged.timeLimit).toBe(partial.timeLimit);
            }
            
            // Result should be valid
            expect(isSandboxConfigValid(merged)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: sandboxConfigToString produces non-empty string**
     */
    it('should produce non-empty string representation', () => {
      fc.assert(
        fc.property(arbSandboxConfig, (sandbox) => {
          const str = sandboxConfigToString(sandbox);
          expect(typeof str).toBe('string');
          expect(str.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: getSandboxSummary returns complete summary**
     */
    it('should return complete sandbox summary', () => {
      fc.assert(
        fc.property(arbSandboxConfig, (sandbox) => {
          const summary = getSandboxSummary(sandbox);
          expect(summary.icon).toBeDefined();
          expect(summary.icon.length).toBeGreaterThan(0);
          expect(summary.label).toBeDefined();
          expect(summary.label.length).toBeGreaterThan(0);
          expect(summary.description).toBeDefined();
          expect(summary.description.length).toBeGreaterThan(0);
          expect(['strict', 'relaxed', 'open']).toContain(summary.level);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Security Level Descriptions', () => {
    /**
     * **Property: All security levels have descriptions**
     */
    it('should have descriptions for all security levels', () => {
      fc.assert(
        fc.property(arbSecurityLevel, (level) => {
          const description = getSecurityLevelDescription(level);
          expect(typeof description).toBe('string');
          expect(description.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: All security levels have icons**
     */
    it('should have icons for all security levels', () => {
      fc.assert(
        fc.property(arbSecurityLevel, (level) => {
          const icon = getSecurityLevelIcon(level);
          expect(typeof icon).toBe('string');
          expect(icon.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property: Different security levels have different icons**
     */
    it('should have unique icons for different security levels', () => {
      const strictIcon = getSecurityLevelIcon('strict');
      const relaxedIcon = getSecurityLevelIcon('relaxed');
      const openIcon = getSecurityLevelIcon('open');
      
      expect(strictIcon).not.toBe(relaxedIcon);
      expect(relaxedIcon).not.toBe(openIcon);
      expect(strictIcon).not.toBe(openIcon);
    });
  });

  describe('Edge Cases', () => {
    /**
     * Zero limits should be valid (unlimited).
     */
    it('should accept zero limits as unlimited', () => {
      const sandbox: SandboxConfig = {
        networkAccess: false,
        fileSystemAccess: false,
        memoryLimit: 0,
        timeLimit: 0,
      };
      expect(isSandboxConfigValid(sandbox)).toBe(true);
    });

    /**
     * Maximum limits should be valid.
     */
    it('should accept maximum limits', () => {
      const sandbox: SandboxConfig = {
        networkAccess: true,
        fileSystemAccess: true,
        memoryLimit: SANDBOX_LIMITS.memoryLimit.max,
        timeLimit: SANDBOX_LIMITS.timeLimit.max,
      };
      expect(isSandboxConfigValid(sandbox)).toBe(true);
    });

    /**
     * Boundary values should be handled correctly.
     */
    it('should handle boundary values correctly', () => {
      // Just below max should be valid
      const belowMax: SandboxConfig = {
        networkAccess: false,
        fileSystemAccess: false,
        memoryLimit: SANDBOX_LIMITS.memoryLimit.max - 1,
        timeLimit: SANDBOX_LIMITS.timeLimit.max - 1,
      };
      expect(isSandboxConfigValid(belowMax)).toBe(true);

      // Just above max should be invalid
      const aboveMax: SandboxConfig = {
        networkAccess: false,
        fileSystemAccess: false,
        memoryLimit: SANDBOX_LIMITS.memoryLimit.max + 1,
        timeLimit: SANDBOX_LIMITS.timeLimit.max + 1,
      };
      expect(isSandboxConfigValid(aboveMax)).toBe(false);
    });
  });
});
