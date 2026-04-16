import { create } from 'zustand';
import { createProjectSlice } from './slices/projectSlice';
import { createCanvasSlice } from './slices/canvasSlice';
import { createActionNodeSlice } from './slices/actionNodeSlice';
import { createLayoutSlice } from './slices/layoutSlice';
import { createUiSlice } from './slices/uiSlice';

import type { ProjectSlice } from './slices/projectSlice';
import type { CanvasSlice } from './slices/canvasSlice';
import type { ActionNodeSlice } from './slices/actionNodeSlice';
import type { LayoutSlice } from './slices/layoutSlice';
import type { UiSlice } from './slices/uiSlice';

/**
 * Composed store state type — the intersection of all slice interfaces.
 * Each slice contributes its own state and actions.
 */
export type StudioState = ProjectSlice & CanvasSlice & ActionNodeSlice & LayoutSlice & UiSlice;

/**
 * Main Zustand store composed from modular slices.
 *
 * Slices:
 *   - projectSlice:    project CRUD, settings
 *   - canvasSlice:     node/edge selection, agent CRUD, tool CRUD
 *   - actionNodeSlice: action node CRUD, selection
 *   - layoutSlice:     layout mode, direction, snap, grid
 *   - uiSlice:         data flow overlay, debug mode
 *
 * @see Requirements 4.3, 4.4, 4.5
 */
export const useStore = create<StudioState>()((...a) => ({
  ...createProjectSlice(...a),
  ...createCanvasSlice(...a),
  ...createActionNodeSlice(...a),
  ...createLayoutSlice(...a),
  ...createUiSlice(...a),
}));
