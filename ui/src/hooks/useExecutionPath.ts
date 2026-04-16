/**
 * useExecutionPath Hook for ADK Studio v2.0
 * 
 * Tracks the execution path from start to current node during execution.
 * Used for highlighting edges and nodes in the execution path.
 * 
 * Requirements: 10.3, 10.5
 */

import { useCallback, useState } from 'react';
import type { Edge as WorkflowEdge } from '../types/project';

/**
 * Execution path state
 */
export interface ExecutionPathState {
  /** Ordered list of node IDs in the execution path */
  path: string[];
  /** Currently active node ID */
  activeNodeId: string | null;
  /** Whether execution is in progress */
  isExecuting: boolean;
}

/**
 * Initial execution path state
 */
const INITIAL_STATE: ExecutionPathState = {
  path: [],
  activeNodeId: null,
  isExecuting: false,
};

/**
 * Hook for tracking execution path through the workflow.
 * 
 * Features:
 * - Track ordered execution path from START to current node
 * - Identify which edges are part of the execution path
 * - Support for highlighting completed path segments
 * 
 * @see Requirement 10.3: Highlight execution path from start to current node
 * @see Requirement 10.5: Green glow effect on active node
 */
export function useExecutionPath() {
  const [state, setState] = useState<ExecutionPathState>(INITIAL_STATE);

  /**
   * Start execution - initializes path with START node
   */
  const startExecution = useCallback(() => {
    setState({
      path: ['START'],
      activeNodeId: 'START',
      isExecuting: true,
    });
  }, []);

  /**
   * Move to next node in execution
   * Adds the node to the path and sets it as active
   */
  const moveToNode = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      path: [...prev.path, nodeId],
      activeNodeId: nodeId,
    }));
  }, []);

  /**
   * Complete execution - marks END as reached
   */
  const completeExecution = useCallback(() => {
    setState(prev => ({
      ...prev,
      path: [...prev.path, 'END'],
      activeNodeId: null,
      isExecuting: false,
    }));
  }, []);

  /**
   * Reset execution path
   */
  const resetPath = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /**
   * Check if a node is in the execution path
   */
  const isNodeInPath = useCallback((nodeId: string): boolean => {
    return state.path.includes(nodeId);
  }, [state.path]);

  /**
   * Check if a node is the currently active node
   */
  const isNodeActive = useCallback((nodeId: string): boolean => {
    return state.activeNodeId === nodeId;
  }, [state.activeNodeId]);

  /**
   * Check if an edge is in the execution path
   * An edge is in the path if both source and target are in the path
   * and the target comes after the source in the path order
   */
  const isEdgeInPath = useCallback((source: string, target: string): boolean => {
    const sourceIndex = state.path.indexOf(source);
    const targetIndex = state.path.indexOf(target);
    
    // Both nodes must be in path and target must come after source
    return sourceIndex !== -1 && targetIndex !== -1 && targetIndex === sourceIndex + 1;
  }, [state.path]);

  /**
   * Check if an edge is currently animated (leading to active node)
   */
  const isEdgeAnimated = useCallback((source: string, target: string): boolean => {
    return state.isExecuting && target === state.activeNodeId && state.path.includes(source);
  }, [state.isExecuting, state.activeNodeId, state.path]);

  /**
   * Get the execution path edges from workflow edges
   * Returns edges that are part of the execution path
   */
  const getPathEdges = useCallback((workflowEdges: WorkflowEdge[]): WorkflowEdge[] => {
    return workflowEdges.filter(edge => isEdgeInPath(edge.from, edge.to));
  }, [isEdgeInPath]);

  /**
   * Get node status for styling
   */
  const getNodeStatus = useCallback((nodeId: string): 'active' | 'path' | 'none' => {
    if (isNodeActive(nodeId)) return 'active';
    if (isNodeInPath(nodeId)) return 'path';
    return 'none';
  }, [isNodeActive, isNodeInPath]);

  /**
   * Get edge status for styling
   */
  const getEdgeStatus = useCallback((source: string, target: string): 'animated' | 'path' | 'none' => {
    if (isEdgeAnimated(source, target)) return 'animated';
    if (isEdgeInPath(source, target)) return 'path';
    return 'none';
  }, [isEdgeAnimated, isEdgeInPath]);

  return {
    /** Current execution path state */
    ...state,
    /** Start execution */
    startExecution,
    /** Move to next node */
    moveToNode,
    /** Complete execution */
    completeExecution,
    /** Reset path */
    resetPath,
    /** Check if node is in path */
    isNodeInPath,
    /** Check if node is active */
    isNodeActive,
    /** Check if edge is in path */
    isEdgeInPath,
    /** Check if edge is animated */
    isEdgeAnimated,
    /** Get path edges from workflow */
    getPathEdges,
    /** Get node status for styling */
    getNodeStatus,
    /** Get edge status for styling */
    getEdgeStatus,
  };
}

export default useExecutionPath;
