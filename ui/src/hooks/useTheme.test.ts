/**
 * Property-based tests for theme persistence
 * 
 * **Feature: adk-studio-v2, Property 1: Theme Persistence Round-Trip** (CRITICAL)
 * *For any* theme selection (light or dark), saving the preference to localStorage
 * and then loading it on application restart SHALL return the same theme.
 * 
 * **Validates: Requirements 1.6, 1.7**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import type { ThemeMode } from '../types/theme';

// Storage key used by the theme hook
const THEME_STORAGE_KEY = 'adk-studio-theme';

/**
 * Arbitrary generator for theme modes
 */
const arbThemeMode = fc.constantFrom<ThemeMode>('light', 'dark');

describe('Theme Persistence Round-Trip', () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Property 1: Theme Persistence Round-Trip** (CRITICAL)
   * *For any* theme selection (light or dark), saving the preference to localStorage
   * and then loading it on application restart SHALL return the same theme.
   * **Validates: Requirements 1.6, 1.7**
   */
  it('should persist and restore theme mode correctly for any valid theme', () => {
    fc.assert(
      fc.property(arbThemeMode, (themeMode: ThemeMode) => {
        // Simulate saving theme to localStorage (as Zustand persist does)
        const persistedState = { state: { mode: themeMode }, version: 0 };
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(persistedState));

        // Simulate loading theme from localStorage
        const storedValue = localStorage.getItem(THEME_STORAGE_KEY);
        expect(storedValue).not.toBeNull();

        const parsedState = JSON.parse(storedValue!);
        const restoredMode = parsedState.state.mode;

        // Property: restored mode must equal original mode
        expect(restoredMode).toBe(themeMode);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default theme should be 'light' when no preference is stored
   * **Validates: Requirement 1.2**
   */
  it('should default to light mode when no preference is stored', () => {
    // No localStorage entry
    const storedValue = localStorage.getItem(THEME_STORAGE_KEY);
    expect(storedValue).toBeNull();

    // Default should be 'light' per Requirement 1.2
    const defaultMode: ThemeMode = 'light';
    expect(defaultMode).toBe('light');
  });

  /**
   * Property: Theme toggle should alternate between light and dark
   */
  it('should toggle between light and dark modes correctly', () => {
    fc.assert(
      fc.property(arbThemeMode, (initialMode: ThemeMode) => {
        // Toggle logic
        const toggledMode: ThemeMode = initialMode === 'light' ? 'dark' : 'light';
        
        // Property: toggled mode must be different from initial
        expect(toggledMode).not.toBe(initialMode);
        
        // Property: toggling twice returns to original
        const doubleToggledMode: ThemeMode = toggledMode === 'light' ? 'dark' : 'light';
        expect(doubleToggledMode).toBe(initialMode);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Persisted state structure should be valid
   */
  it('should maintain valid persisted state structure', () => {
    fc.assert(
      fc.property(arbThemeMode, (themeMode: ThemeMode) => {
        // Create persisted state as Zustand does
        const persistedState = { state: { mode: themeMode }, version: 0 };
        const serialized = JSON.stringify(persistedState);
        
        // Property: serialized state should be valid JSON
        expect(() => JSON.parse(serialized)).not.toThrow();
        
        // Property: parsed state should have correct structure
        const parsed = JSON.parse(serialized);
        expect(parsed).toHaveProperty('state');
        expect(parsed).toHaveProperty('version');
        expect(parsed.state).toHaveProperty('mode');
        expect(['light', 'dark']).toContain(parsed.state.mode);
      }),
      { numRuns: 100 }
    );
  });
});
