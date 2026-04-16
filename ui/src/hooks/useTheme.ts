/**
 * Theme hook with localStorage persistence for ADK Studio v2.0
 * 
 * Uses Zustand with persist middleware to maintain theme preference across sessions.
 * Defaults to light mode for new users per Requirement 1.2.
 * 
 * Requirements: 1.2, 1.6, 1.7
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, ThemeTokens } from '../types/theme';
import { getThemeTokens } from '../types/theme';

/**
 * Theme store state interface
 */
interface ThemeState {
  /** Current theme mode */
  mode: ThemeMode;
  /** Set theme mode directly */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark modes */
  toggle: () => void;
  /** Get current theme tokens */
  getTokens: () => ThemeTokens;
}

/**
 * Storage key for theme persistence
 */
const THEME_STORAGE_KEY = 'adk-studio-theme';

/**
 * Theme store with localStorage persistence
 * 
 * v2.0: Theme is global (localStorage only), not per-project
 * Per-project theming deferred to v2.x
 */
export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Default to light mode for new users (Requirement 1.2)
      mode: 'light',
      
      setMode: (mode: ThemeMode) => set({ mode }),
      
      toggle: () => set((state) => ({ 
        mode: state.mode === 'light' ? 'dark' : 'light' 
      })),
      
      getTokens: () => getThemeTokens(get().mode),
    }),
    {
      name: THEME_STORAGE_KEY,
      // Only persist the mode, not the functions
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

/**
 * Helper hook to get current theme tokens
 */
export function useThemeTokens(): ThemeTokens {
  const mode = useTheme((state) => state.mode);
  return getThemeTokens(mode);
}
