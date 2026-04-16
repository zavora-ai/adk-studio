import type { StateCreator } from 'zustand';

/**
 * Full store state type.
 * Defined here so the slice can access cross-slice state via get().
 * When slices are composed in the main store, this will be replaced
 * by the actual composed StudioState type.
 */
export interface StudioState {
  // UI slice state
  showDataFlowOverlay: boolean;
  debugMode: boolean;

  // Cross-slice actions accessed by UI actions
  saveProject: () => Promise<void>;
}

export interface UiSlice {
  // State
  showDataFlowOverlay: boolean;
  debugMode: boolean;

  // Actions
  setShowDataFlowOverlay: (show: boolean) => void;
  setDebugMode: (enabled: boolean) => void;
}

export const createUiSlice: StateCreator<StudioState, [], [], UiSlice> = (set, get) => ({
  // State
  showDataFlowOverlay: false,
  debugMode: false,

  // Actions
  // @see Requirements 3.4: Store preference in project settings
  setShowDataFlowOverlay: (show) => {
    set({ showDataFlowOverlay: show });
    // Auto-save after state update
    setTimeout(() => get().saveProject(), 0);
  },

  // Controls visibility of StateInspector and Timeline
  setDebugMode: (enabled) => {
    set({ debugMode: enabled });
    // Auto-save after state update
    setTimeout(() => get().saveProject(), 0);
  },
});
