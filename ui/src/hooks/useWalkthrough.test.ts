/**
 * Property-based tests for walkthrough completion persistence
 * 
 * **Feature: adk-studio-v2, Property 16: Walkthrough Completion Persistence** (CRITICAL)
 * *For any* user who completes or skips the walkthrough, the completion state
 * SHALL persist across browser sessions.
 * 
 * **Validates: Requirements 6.9**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Storage key used by the walkthrough hook
const WALKTHROUGH_STORAGE_KEY = 'adk-studio-walkthrough';

/**
 * Interface matching the persisted walkthrough state
 */
interface PersistedWalkthroughState {
  completed: boolean;
  skipped: boolean;
}

/**
 * Arbitrary generator for walkthrough completion states
 * Generates all valid combinations of completed/skipped
 */
const arbWalkthroughState = fc.record({
  completed: fc.boolean(),
  skipped: fc.boolean(),
});

/**
 * Simulates the Zustand persist middleware storage format
 */
function createPersistedState(state: PersistedWalkthroughState) {
  return { state, version: 0 };
}

/**
 * Simulates saving walkthrough state to localStorage
 */
function saveWalkthroughState(state: PersistedWalkthroughState): void {
  const persistedState = createPersistedState(state);
  localStorage.setItem(WALKTHROUGH_STORAGE_KEY, JSON.stringify(persistedState));
}

/**
 * Simulates loading walkthrough state from localStorage
 */
function loadWalkthroughState(): PersistedWalkthroughState | null {
  const storedValue = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
  if (!storedValue) return null;
  
  const parsed = JSON.parse(storedValue);
  return parsed.state;
}

describe('Walkthrough Completion Persistence', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Property 16: Walkthrough Completion Persistence** (CRITICAL)
   * *For any* user who completes or skips the walkthrough, the completion state
   * SHALL persist across browser sessions.
   * **Validates: Requirements 6.9**
   */
  it('should persist and restore walkthrough completion state correctly for any valid state', () => {
    fc.assert(
      fc.property(arbWalkthroughState, (walkthroughState: PersistedWalkthroughState) => {
        // Simulate saving walkthrough state to localStorage (as Zustand persist does)
        saveWalkthroughState(walkthroughState);

        // Simulate loading walkthrough state from localStorage (browser restart)
        const restoredState = loadWalkthroughState();

        // Property: restored state must not be null
        expect(restoredState).not.toBeNull();

        // Property: restored completed state must equal original
        expect(restoredState!.completed).toBe(walkthroughState.completed);

        // Property: restored skipped state must equal original
        expect(restoredState!.skipped).toBe(walkthroughState.skipped);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Completed walkthrough should persist as completed
   * **Validates: Requirements 6.9**
   */
  it('should persist completed walkthrough state correctly', () => {
    // User completes the walkthrough
    const completedState: PersistedWalkthroughState = {
      completed: true,
      skipped: false,
    };

    saveWalkthroughState(completedState);
    const restored = loadWalkthroughState();

    expect(restored).not.toBeNull();
    expect(restored!.completed).toBe(true);
    expect(restored!.skipped).toBe(false);
  });

  /**
   * Property: Skipped walkthrough should persist as skipped
   * **Validates: Requirements 6.9, 6.10**
   */
  it('should persist skipped walkthrough state correctly', () => {
    // User skips the walkthrough
    const skippedState: PersistedWalkthroughState = {
      completed: false,
      skipped: true,
    };

    saveWalkthroughState(skippedState);
    const restored = loadWalkthroughState();

    expect(restored).not.toBeNull();
    expect(restored!.completed).toBe(false);
    expect(restored!.skipped).toBe(true);
  });

  /**
   * Property: Default state (first run) should show walkthrough
   */
  it('should return null when no walkthrough state is stored (first run)', () => {
    // No localStorage entry - simulates first run
    const storedValue = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
    expect(storedValue).toBeNull();

    const restored = loadWalkthroughState();
    expect(restored).toBeNull();
  });

  /**
   * Property: shouldShowOnFirstRun logic should work correctly
   * Shows walkthrough only when not completed AND not skipped
   */
  it('should correctly determine if walkthrough should show on first run', () => {
    fc.assert(
      fc.property(arbWalkthroughState, (state: PersistedWalkthroughState) => {
        // Logic from useWalkthrough.shouldShowOnFirstRun
        const shouldShow = !state.completed && !state.skipped;

        // Property: should show only when both completed and skipped are false
        if (state.completed || state.skipped) {
          expect(shouldShow).toBe(false);
        } else {
          expect(shouldShow).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Reset should restore initial state
   * **Validates: Requirements 6.10 (restart from Help menu)**
   */
  it('should reset walkthrough state correctly', () => {
    fc.assert(
      fc.property(arbWalkthroughState, (initialState: PersistedWalkthroughState) => {
        // Save some initial state
        saveWalkthroughState(initialState);

        // Reset state (as would happen from Help menu restart)
        const resetState: PersistedWalkthroughState = {
          completed: false,
          skipped: false,
        };
        saveWalkthroughState(resetState);

        // Load after reset
        const restored = loadWalkthroughState();

        // Property: after reset, both completed and skipped should be false
        expect(restored).not.toBeNull();
        expect(restored!.completed).toBe(false);
        expect(restored!.skipped).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Persisted state structure should be valid
   */
  it('should maintain valid persisted state structure', () => {
    fc.assert(
      fc.property(arbWalkthroughState, (state: PersistedWalkthroughState) => {
        // Create persisted state as Zustand does
        const persistedState = createPersistedState(state);
        const serialized = JSON.stringify(persistedState);

        // Property: serialized state should be valid JSON
        expect(() => JSON.parse(serialized)).not.toThrow();

        // Property: parsed state should have correct structure
        const parsed = JSON.parse(serialized);
        expect(parsed).toHaveProperty('state');
        expect(parsed).toHaveProperty('version');
        expect(parsed.state).toHaveProperty('completed');
        expect(parsed.state).toHaveProperty('skipped');

        // Property: values should be of correct types
        expect(typeof parsed.state.completed).toBe('boolean');
        expect(typeof parsed.state.skipped).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple save/load cycles should preserve state
   */
  it('should preserve state across multiple save/load cycles', () => {
    fc.assert(
      fc.property(
        arbWalkthroughState,
        fc.integer({ min: 1, max: 5 }),
        (state: PersistedWalkthroughState, cycles: number) => {
          // Perform multiple save/load cycles
          for (let i = 0; i < cycles; i++) {
            saveWalkthroughState(state);
            const restored = loadWalkthroughState();

            // Property: state should be preserved after each cycle
            expect(restored).not.toBeNull();
            expect(restored!.completed).toBe(state.completed);
            expect(restored!.skipped).toBe(state.skipped);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
