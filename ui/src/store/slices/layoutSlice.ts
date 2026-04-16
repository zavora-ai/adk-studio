import type { StateCreator } from 'zustand';
import type { LayoutMode, LayoutDirection } from '../../types/layout';

/**
 * Full store state type.
 * Defined here so the slice can access cross-slice state via get().
 * When slices are composed in the main store, this will be replaced
 * by the actual composed StudioState type.
 */
export interface StudioState {
  // Layout slice state
  layoutMode: LayoutMode;
  layoutDirection: LayoutDirection;
  snapToGrid: boolean;
  gridSize: number;
}

export interface LayoutSlice {
  // State
  layoutMode: LayoutMode;
  layoutDirection: LayoutDirection;
  snapToGrid: boolean;
  gridSize: number;

  // Actions
  setLayoutMode: (mode: LayoutMode) => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
}

export const createLayoutSlice: StateCreator<StudioState, [], [], LayoutSlice> = (set) => ({
  // State
  layoutMode: 'free',
  layoutDirection: 'LR',
  snapToGrid: true,
  gridSize: 20,

  // Actions
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setLayoutDirection: (dir) => set({ layoutDirection: dir }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setGridSize: (size) => set({ gridSize: size }),
});
