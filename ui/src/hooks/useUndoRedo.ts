import { create } from 'zustand';
import type { AgentSchema, Edge } from '../types/project';

/**
 * Undo/Redo MVP for ADK Studio v2.0
 * @see Requirements 11.5, 11.6: Undo/Redo support
 * @see Requirements 14.8: Minimum 50 action history (MVP: 20 entries)
 * 
 * MVP Scope:
 * - Track add node and delete node actions only
 * - Minimum 20 entries for history
 * - Full undo/redo for all actions deferred to v2.x
 */

/** Maximum number of actions to keep in history (MVP: 20) */
export const MAX_HISTORY_SIZE = 20;

/** Types of actions that can be undone/redone */
export type UndoableActionType = 'add_node' | 'delete_node';

/** Represents a single undoable action */
export interface UndoableAction {
  type: UndoableActionType;
  timestamp: number;
  /** Node ID affected by this action */
  nodeId: string;
  /** Agent data (for restoring deleted nodes or removing added nodes) */
  agent: AgentSchema;
  /** Edges connected to this node (for add_node: new edges created; for delete_node: edges that were removed) */
  edges: Edge[];
  /** Edges that existed BEFORE this action (for restoring previous state on undo) */
  edgesBefore: Edge[];
}

/** State for the undo/redo system */
interface UndoRedoState {
  /** Stack of actions that can be undone (most recent last) */
  undoStack: UndoableAction[];
  /** Stack of actions that can be redone (most recent last) */
  redoStack: UndoableAction[];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  
  /** Record an add node action */
  recordAddNode: (nodeId: string, agent: AgentSchema, edges: Edge[], edgesBefore: Edge[]) => void;
  /** Record a delete node action */
  recordDeleteNode: (nodeId: string, agent: AgentSchema, edges: Edge[], edgesBefore: Edge[]) => void;
  /** Pop the last action from undo stack (returns action to undo) */
  popUndo: () => UndoableAction | null;
  /** Pop the last action from redo stack (returns action to redo) */
  popRedo: () => UndoableAction | null;
  /** Push an action to redo stack (after undoing) */
  pushRedo: (action: UndoableAction) => void;
  /** Push an action to undo stack (after redoing) */
  pushUndo: (action: UndoableAction) => void;
  /** Clear all history (e.g., when switching projects) */
  clearHistory: () => void;
}

/**
 * Zustand store for undo/redo state
 * Uses a simple stack-based approach for MVP
 */
export const useUndoRedoStore = create<UndoRedoState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  recordAddNode: (nodeId, agent, edges, edgesBefore) => {
    const action: UndoableAction = {
      type: 'add_node',
      timestamp: Date.now(),
      nodeId,
      agent,
      edges,
      edgesBefore,
    };
    
    set((state) => {
      // Add to undo stack, trim if exceeds max size
      const newUndoStack = [...state.undoStack, action];
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift(); // Remove oldest
      }
      
      return {
        undoStack: newUndoStack,
        // Clear redo stack when new action is recorded
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  recordDeleteNode: (nodeId, agent, edges, edgesBefore) => {
    const action: UndoableAction = {
      type: 'delete_node',
      timestamp: Date.now(),
      nodeId,
      agent,
      edges,
      edgesBefore,
    };
    
    set((state) => {
      const newUndoStack = [...state.undoStack, action];
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift();
      }
      
      return {
        undoStack: newUndoStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    });
  },

  popUndo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    
    const action = undoStack[undoStack.length - 1];
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      canUndo: state.undoStack.length > 1,
    }));
    
    return action;
  },

  popRedo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    
    const action = redoStack[redoStack.length - 1];
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      canRedo: state.redoStack.length > 1,
    }));
    
    return action;
  },

  pushRedo: (action) => {
    set((state) => {
      const newRedoStack = [...state.redoStack, action];
      if (newRedoStack.length > MAX_HISTORY_SIZE) {
        newRedoStack.shift();
      }
      return {
        redoStack: newRedoStack,
        canRedo: true,
      };
    });
  },

  pushUndo: (action) => {
    set((state) => {
      const newUndoStack = [...state.undoStack, action];
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift();
      }
      return {
        undoStack: newUndoStack,
        canUndo: true,
      };
    });
  },

  clearHistory: () => {
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));

/**
 * Hook for undo/redo functionality
 * Provides high-level undo/redo operations that integrate with the store
 * 
 * @param handlers - Callbacks for performing the actual add/remove operations
 * @returns Undo/redo functions and state
 */
export function useUndoRedo(handlers: {
  onAddNode: (nodeId: string, agent: AgentSchema) => void;
  onRemoveNode: (nodeId: string) => void;
  onAddEdge: (from: string, to: string) => void;
  onRemoveEdge: (from: string, to: string) => void;
  onSetEdges: (edges: Edge[]) => void;
  getAgent: (nodeId: string) => AgentSchema | undefined;
  getEdgesForNode: (nodeId: string) => Edge[];
  getAllEdges: () => Edge[];
}) {
  const store = useUndoRedoStore();

  /**
   * Record an add node action for undo
   * @param nodeId - The ID of the newly added node
   * @param agent - The agent data
   * @param newEdges - The edges that were created for this node
   * @param edgesBefore - All edges that existed before this action
   */
  const recordAddNode = (nodeId: string, agent: AgentSchema, newEdges: Edge[], edgesBefore: Edge[]) => {
    store.recordAddNode(nodeId, agent, newEdges, edgesBefore);
  };

  /**
   * Record a delete node action for undo
   * @param nodeId - The ID of the node being deleted
   * @param edgesBefore - All edges that exist before deletion (for restoration)
   */
  const recordDeleteNode = (nodeId: string, edgesBefore: Edge[]) => {
    const agent = handlers.getAgent(nodeId);
    if (!agent) return;
    
    const edges = handlers.getEdgesForNode(nodeId);
    store.recordDeleteNode(nodeId, agent, edges, edgesBefore);
  };

  /**
   * Undo the last action
   * @see Requirements 11.5: Ctrl/Cmd+Z for undo
   */
  const undo = () => {
    const action = store.popUndo();
    if (!action) return;

    if (action.type === 'add_node') {
      // Undo add = remove the node and restore previous edge state
      handlers.onRemoveNode(action.nodeId);
      // Restore the edges that existed before this node was added
      handlers.onSetEdges(action.edgesBefore);
    } else if (action.type === 'delete_node') {
      // Undo delete = restore the node and restore previous edge state
      handlers.onAddNode(action.nodeId, action.agent);
      // Restore the edges that existed before deletion
      handlers.onSetEdges(action.edgesBefore);
    }

    // Push to redo stack
    store.pushRedo(action);
  };

  /**
   * Redo the last undone action
   * @see Requirements 11.6: Ctrl/Cmd+Shift+Z for redo
   */
  const redo = () => {
    const action = store.popRedo();
    if (!action) return;

    if (action.type === 'add_node') {
      // Redo add = add the node back with its edges
      handlers.onAddNode(action.nodeId, action.agent);
      // Set edges to include the new edges (edgesBefore + new edges, minus any that were replaced)
      const newEdgeSet = [...action.edgesBefore];
      // Remove edges that were replaced by the new node
      action.edges.forEach((newEdge) => {
        // If this new edge goes TO the new node, remove any edge that went to the same target
        // If this new edge goes FROM the new node, remove any edge that came from the same source
        const idx = newEdgeSet.findIndex(e => 
          (newEdge.from === action.nodeId && e.to === newEdge.to) ||
          (newEdge.to === action.nodeId && e.from === newEdge.from)
        );
        if (idx >= 0) newEdgeSet.splice(idx, 1);
      });
      // Add the new edges
      action.edges.forEach((edge) => {
        if (!newEdgeSet.some(e => e.from === edge.from && e.to === edge.to)) {
          newEdgeSet.push(edge);
        }
      });
      handlers.onSetEdges(newEdgeSet);
    } else if (action.type === 'delete_node') {
      // Redo delete = remove the node again
      handlers.onRemoveNode(action.nodeId);
      // Remove the edges that were connected to this node
      const edgesAfterDelete = action.edgesBefore.filter(
        e => e.from !== action.nodeId && e.to !== action.nodeId
      );
      handlers.onSetEdges(edgesAfterDelete);
    }

    // Push to undo stack
    store.pushUndo(action);
  };

  return {
    undo,
    redo,
    recordAddNode,
    recordDeleteNode,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    clearHistory: store.clearHistory,
  };
}
