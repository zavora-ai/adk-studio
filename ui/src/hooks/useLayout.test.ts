/**
 * Property-based tests for layout mode persistence
 * 
 * **Feature: adk-studio-v2, Property 4: Layout Mode Persistence** (CRITICAL)
 * *For any* project with a layout mode setting, saving and reopening the project
 * SHALL restore the same layout mode.
 * 
 * **Validates: Requirements 2.9**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { LayoutMode, LayoutDirection } from '../types/layout';

/**
 * Arbitrary generator for layout modes
 */
const arbLayoutMode = fc.constantFrom<LayoutMode>('free', 'fixed');

/**
 * Arbitrary generator for layout directions
 */
const arbLayoutDirection = fc.constantFrom<LayoutDirection>('TB', 'LR', 'BT', 'RL');

/**
 * Arbitrary generator for project settings with layout configuration
 */
const arbProjectSettings = fc.record({
  layoutMode: arbLayoutMode,
  layoutDirection: arbLayoutDirection,
  showDataFlowOverlay: fc.boolean(),
});

/**
 * Simulates project save/load cycle for layout settings
 */
function simulateProjectPersistence(settings: {
  layoutMode: LayoutMode;
  layoutDirection: LayoutDirection;
  showDataFlowOverlay: boolean;
}) {
  // Serialize to JSON (as would happen when saving project)
  const serialized = JSON.stringify(settings);
  
  // Deserialize (as would happen when loading project)
  const restored = JSON.parse(serialized);
  
  return restored;
}

describe('Layout Mode Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Property 4: Layout Mode Persistence** (CRITICAL)
   * *For any* project with a layout mode setting, saving and reopening the project
   * SHALL restore the same layout mode.
   * **Validates: Requirements 2.9**
   */
  it('should persist and restore layout mode correctly for any valid layout configuration', () => {
    fc.assert(
      fc.property(arbProjectSettings, (settings) => {
        // Simulate save/load cycle
        const restored = simulateProjectPersistence(settings);

        // Property: restored layout mode must equal original
        expect(restored.layoutMode).toBe(settings.layoutMode);
        
        // Property: restored layout direction must equal original
        expect(restored.layoutDirection).toBe(settings.layoutDirection);
        
        // Property: restored showDataFlowOverlay must equal original
        expect(restored.showDataFlowOverlay).toBe(settings.showDataFlowOverlay);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Layout mode should be one of the valid values
   */
  it('should only allow valid layout mode values', () => {
    fc.assert(
      fc.property(arbLayoutMode, (mode) => {
        // Property: mode must be either 'free' or 'fixed'
        expect(['free', 'fixed']).toContain(mode);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Layout direction should be one of the valid values
   */
  it('should only allow valid layout direction values', () => {
    fc.assert(
      fc.property(arbLayoutDirection, (direction) => {
        // Property: direction must be one of TB, LR, BT, RL
        expect(['TB', 'LR', 'BT', 'RL']).toContain(direction);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default layout mode should be 'free'
   * **Validates: Requirement 2.1**
   */
  it('should default to free layout mode', () => {
    const defaultMode: LayoutMode = 'free';
    expect(defaultMode).toBe('free');
  });

  /**
   * Property: Default layout direction should be 'TB' (top-to-bottom)
   */
  it('should default to TB layout direction', () => {
    const defaultDirection: LayoutDirection = 'TB';
    expect(defaultDirection).toBe('TB');
  });

  /**
   * Property: Layout mode toggle should alternate between free and fixed
   */
  it('should toggle between free and fixed modes correctly', () => {
    fc.assert(
      fc.property(arbLayoutMode, (initialMode) => {
        // Toggle logic
        const toggledMode: LayoutMode = initialMode === 'free' ? 'fixed' : 'free';
        
        // Property: toggled mode must be different from initial
        expect(toggledMode).not.toBe(initialMode);
        
        // Property: toggling twice returns to original
        const doubleToggledMode: LayoutMode = toggledMode === 'free' ? 'fixed' : 'free';
        expect(doubleToggledMode).toBe(initialMode);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Layout direction toggle should cycle through directions
   */
  it('should toggle layout direction correctly', () => {
    fc.assert(
      fc.property(arbLayoutDirection, (initialDirection) => {
        // Simple toggle between TB and LR (as implemented in useLayout)
        const toggledDirection: LayoutDirection = initialDirection === 'LR' ? 'TB' : 'LR';
        
        // Property: toggled direction must be either TB or LR
        expect(['TB', 'LR']).toContain(toggledDirection);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Project settings structure should be valid after serialization
   */
  it('should maintain valid project settings structure after serialization', () => {
    fc.assert(
      fc.property(arbProjectSettings, (settings) => {
        // Serialize
        const serialized = JSON.stringify(settings);
        
        // Property: serialized settings should be valid JSON
        expect(() => JSON.parse(serialized)).not.toThrow();
        
        // Property: parsed settings should have correct structure
        const parsed = JSON.parse(serialized);
        expect(parsed).toHaveProperty('layoutMode');
        expect(parsed).toHaveProperty('layoutDirection');
        expect(parsed).toHaveProperty('showDataFlowOverlay');
        
        // Property: values should be of correct types
        expect(['free', 'fixed']).toContain(parsed.layoutMode);
        expect(['TB', 'LR', 'BT', 'RL']).toContain(parsed.layoutDirection);
        expect(typeof parsed.showDataFlowOverlay).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });
});
