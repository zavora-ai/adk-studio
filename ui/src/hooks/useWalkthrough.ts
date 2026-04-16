/**
 * Walkthrough hook with localStorage persistence for ADK Studio v2.0
 * 
 * Uses Zustand with persist middleware to track walkthrough completion.
 * Shows walkthrough for new users, allows skip/restart from Help menu.
 * 
 * Requirements: 6.9, 6.10
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Walkthrough store state interface
 */
interface WalkthroughState {
  /** Whether the walkthrough has been completed */
  completed: boolean;
  /** Whether the walkthrough has been skipped */
  skipped: boolean;
  /** Whether the walkthrough modal is currently visible */
  isVisible: boolean;
  /** Mark walkthrough as completed */
  complete: () => void;
  /** Mark walkthrough as skipped */
  skip: () => void;
  /** Show the walkthrough modal */
  show: () => void;
  /** Hide the walkthrough modal */
  hide: () => void;
  /** Reset walkthrough state (for restart) */
  reset: () => void;
  /** Check if walkthrough should be shown (first run) */
  shouldShowOnFirstRun: () => boolean;
}

/**
 * Storage key for walkthrough persistence
 */
const WALKTHROUGH_STORAGE_KEY = 'adk-studio-walkthrough';

/**
 * Walkthrough store with localStorage persistence
 * 
 * Tracks whether user has completed or skipped the walkthrough.
 * Allows restarting from Help menu.
 * 
 * Requirements: 6.9, 6.10
 */
export const useWalkthrough = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      // Default: not completed, not skipped, not visible
      completed: false,
      skipped: false,
      isVisible: false,
      
      complete: () => set({ 
        completed: true, 
        skipped: false, 
        isVisible: false 
      }),
      
      skip: () => set({ 
        completed: false, 
        skipped: true, 
        isVisible: false 
      }),
      
      show: () => set({ isVisible: true }),
      
      hide: () => set({ isVisible: false }),
      
      reset: () => set({ 
        completed: false, 
        skipped: false, 
        isVisible: true 
      }),
      
      shouldShowOnFirstRun: () => {
        const { completed, skipped } = get();
        return !completed && !skipped;
      },
    }),
    {
      name: WALKTHROUGH_STORAGE_KEY,
      // Only persist completed and skipped, not visibility
      partialize: (state) => ({ 
        completed: state.completed, 
        skipped: state.skipped 
      }),
    }
  )
);

/**
 * Helper hook to check if walkthrough should auto-show
 */
export function useShouldShowWalkthrough(): boolean {
  const completed = useWalkthrough((state) => state.completed);
  const skipped = useWalkthrough((state) => state.skipped);
  return !completed && !skipped;
}
