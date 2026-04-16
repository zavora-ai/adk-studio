import { useCallback, useState } from 'react';
import type { ExecutionState, StateSnapshot, ToolCall } from '../types/execution';
import { MAX_SNAPSHOTS, INITIAL_EXECUTION_STATE, DEFAULT_TIMELINE_STATE } from '../types/execution';

/**
 * Hook for managing execution state and timeline debugging.
 * 
 * @see Requirements 5.8: State snapshot capture
 * @see Requirements 5.3, 5.4: Timeline scrubbing synchronization
 */
export function useExecution() {
  const [state, setState] = useState<ExecutionState>(INITIAL_EXECUTION_STATE);

  const start = useCallback(() => {
    setState({ 
      ...INITIAL_EXECUTION_STATE, 
      isRunning: true, 
      startTime: Date.now(),
      timeline: DEFAULT_TIMELINE_STATE,
    });
  }, []);

  const stop = useCallback(() => {
    setState(s => ({ ...s, isRunning: false }));
  }, []);

  const setActiveNode = useCallback((nodeId: string | null, subAgent?: string) => {
    setState(s => ({ ...s, activeNode: nodeId, activeSubAgent: subAgent || null }));
  }, []);

  const setThought = useCallback((nodeId: string, thought: string) => {
    setState(s => ({ ...s, thoughts: { ...s.thoughts, [nodeId]: thought } }));
  }, []);

  const clearThought = useCallback((nodeId: string) => {
    setState(s => {
      const { [nodeId]: _, ...rest } = s.thoughts;
      return { ...s, thoughts: rest };
    });
  }, []);

  const addToolCall = useCallback((tc: Omit<ToolCall, 'status'>) => {
    setState(s => ({ ...s, toolCalls: [...s.toolCalls, { ...tc, status: 'running' }] }));
  }, []);

  const completeToolCall = useCallback((id: string, result: unknown) => {
    setState(s => ({
      ...s,
      toolCalls: s.toolCalls.map(tc => tc.id === id ? { ...tc, result, status: 'complete' } : tc),
    }));
  }, []);

  const incrementIteration = useCallback(() => {
    setState(s => ({ ...s, iteration: s.iteration + 1 }));
  }, []);

  /**
   * Add a state snapshot for timeline debugging (v2.0).
   * Maintains a maximum of MAX_SNAPSHOTS entries (best-effort retention).
   * 
   * @see Requirements 5.8: State snapshot capture
   */
  const addSnapshot = useCallback((snapshot: StateSnapshot) => {
    setState(s => {
      const newSnapshots = [...s.snapshots, snapshot];
      // Best-effort: keep only last MAX_SNAPSHOTS (100)
      if (newSnapshots.length > MAX_SNAPSHOTS) {
        newSnapshots.shift(); // Remove oldest
      }
      return {
        ...s,
        snapshots: newSnapshots,
        currentSnapshotIndex: newSnapshots.length - 1,
      };
    });
  }, []);

  /**
   * Scrub to a specific position in the timeline.
   * Clamps the index to valid range.
   * 
   * @see Requirements 5.3, 5.4: Timeline scrubbing synchronization
   */
  const scrubTo = useCallback((index: number) => {
    setState(s => {
      const clampedIndex = Math.max(0, Math.min(index, s.snapshots.length - 1));
      return {
        ...s,
        currentSnapshotIndex: clampedIndex,
      };
    });
  }, []);

  /**
   * Get the current snapshot based on currentSnapshotIndex.
   */
  const getCurrentSnapshot = useCallback((): StateSnapshot | null => {
    if (state.currentSnapshotIndex < 0 || state.currentSnapshotIndex >= state.snapshots.length) {
      return null;
    }
    return state.snapshots[state.currentSnapshotIndex];
  }, [state.snapshots, state.currentSnapshotIndex]);

  /**
   * Get the previous snapshot for diff highlighting.
   */
  const getPreviousSnapshot = useCallback((): StateSnapshot | null => {
    const prevIndex = state.currentSnapshotIndex - 1;
    if (prevIndex < 0 || prevIndex >= state.snapshots.length) {
      return null;
    }
    return state.snapshots[prevIndex];
  }, [state.snapshots, state.currentSnapshotIndex]);

  /**
   * Get the node ID at the current timeline position.
   * Used for highlighting the corresponding node on canvas.
   * 
   * @see Requirements 5.3: Highlight corresponding node when scrubbing
   */
  const getHighlightedNodeId = useCallback((): string | null => {
    const snapshot = getCurrentSnapshot();
    return snapshot?.nodeId || null;
  }, [getCurrentSnapshot]);

  /**
   * Toggle timeline collapsed state.
   * 
   * @see Requirements 5.10: Timeline collapsible
   */
  const toggleTimelineCollapsed = useCallback(() => {
    setState(s => ({
      ...s,
      timeline: {
        ...s.timeline,
        isCollapsed: !s.timeline.isCollapsed,
      },
    }));
  }, []);

  /**
   * Set timeline collapsed state.
   */
  const setTimelineCollapsed = useCallback((collapsed: boolean) => {
    setState(s => ({
      ...s,
      timeline: {
        ...s.timeline,
        isCollapsed: collapsed,
      },
    }));
  }, []);

  /**
   * Clear all snapshots (for new execution).
   */
  const clearSnapshots = useCallback(() => {
    setState(s => ({
      ...s,
      snapshots: [],
      currentSnapshotIndex: -1,
    }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_EXECUTION_STATE), []);

  return {
    ...state,
    start,
    stop,
    setActiveNode,
    setThought,
    clearThought,
    addToolCall,
    completeToolCall,
    incrementIteration,
    addSnapshot,
    scrubTo,
    getCurrentSnapshot,
    getPreviousSnapshot,
    getHighlightedNodeId,
    toggleTimelineCollapsed,
    setTimelineCollapsed,
    clearSnapshots,
    reset,
  };
}
