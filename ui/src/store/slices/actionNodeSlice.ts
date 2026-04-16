import type { StateCreator } from 'zustand';
import type { Project } from '../../types/project';
import type { ActionNodeConfig } from '../../types/actionNodes';
import { reconnectEdgesOnRemoval } from '../utils/edgeReconnection';

/**
 * Full store state type.
 * Defined here so the slice can access cross-slice state via get().
 * When slices are composed in the main store, this will be replaced
 * by the actual composed StudioState type.
 */
export interface StudioState {
  // Action node slice state
  selectedActionNodeId: string | null;

  // Cross-slice state accessed by action node actions
  currentProject: Project | null;
  selectedNodeId: string | null;
  selectedToolId: string | null;

  // Cross-slice actions accessed by action node actions
  saveProject: () => Promise<void>;
}

export interface ActionNodeSlice {
  // State
  selectedActionNodeId: string | null;

  // Actions
  selectActionNode: (id: string | null) => void;
  addActionNode: (id: string, node: ActionNodeConfig) => void;
  updateActionNode: (id: string, updates: Partial<ActionNodeConfig>) => void;
  removeActionNode: (id: string) => void;
  renameActionNode: (oldId: string, newId: string) => void;
}

export const createActionNodeSlice: StateCreator<StudioState, [], [], ActionNodeSlice> = (set, get) => ({
  // State
  selectedActionNodeId: null,

  // Actions
  selectActionNode: (id) =>
    set((s) => ({
      selectedActionNodeId: id,
      // Only clear selectedNodeId when selecting an action node (id is not null)
      selectedNodeId: id ? null : s.selectedNodeId,
      selectedToolId: id ? null : s.selectedToolId,
    })),

  addActionNode: (id, node) => {
    set((s) => {
      if (!s.currentProject) return s;
      // Ensure actionNodes exists (for backward compatibility)
      const actionNodes = s.currentProject.actionNodes || {};
      return {
        currentProject: {
          ...s.currentProject,
          actionNodes: { ...actionNodes, [id]: node },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  updateActionNode: (id, updates) => {
    set((s) => {
      if (!s.currentProject) return s;
      const actionNodes = s.currentProject.actionNodes || {};
      if (!actionNodes[id]) return s;
      return {
        currentProject: {
          ...s.currentProject,
          actionNodes: {
            ...actionNodes,
            [id]: { ...actionNodes[id], ...updates } as ActionNodeConfig,
          },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  removeActionNode: (id) => {
    set((s) => {
      if (!s.currentProject) return s;
      const actionNodes = { ...(s.currentProject.actionNodes || {}) };
      delete actionNodes[id];

      // Reconnect edges using shared utility
      const agents = s.currentProject.agents;
      const remainingAgentIds = Object.keys(agents);
      const actionNodeIds = Object.keys(actionNodes);
      const allNodeIds = [...remainingAgentIds, ...actionNodeIds];

      const finalEdges = reconnectEdgesOnRemoval({
        removedIds: [id],
        currentEdges: s.currentProject.workflow.edges,
        remainingNodeIds: allNodeIds,
      });

      return {
        currentProject: {
          ...s.currentProject,
          actionNodes,
          workflow: {
            ...s.currentProject.workflow,
            edges: finalEdges,
          },
        },
        selectedActionNodeId: s.selectedActionNodeId === id ? null : s.selectedActionNodeId,
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  renameActionNode: (oldId, newId) => {
    if (oldId === newId) return;
    set((s) => {
      if (!s.currentProject) return s;
      const actionNodes = s.currentProject.actionNodes || {};
      if (!actionNodes[oldId]) return s;

      // Clone action nodes, add new key, remove old
      const newActionNodes = { ...actionNodes };
      newActionNodes[newId] = { ...newActionNodes[oldId], id: newId };
      delete newActionNodes[oldId];

      // Update edges
      const edges = s.currentProject.workflow.edges.map((e) => ({
        ...e,
        from: e.from === oldId ? newId : e.from,
        to: e.to === oldId ? newId : e.to,
      }));

      return {
        currentProject: {
          ...s.currentProject,
          actionNodes: newActionNodes,
          workflow: { ...s.currentProject.workflow, edges },
        },
        selectedActionNodeId: s.selectedActionNodeId === oldId ? newId : s.selectedActionNodeId,
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },
});
