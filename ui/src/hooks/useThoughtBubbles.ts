/**
 * useThoughtBubbles Hook for ADK Studio v2.0
 * 
 * Manages thought bubble lifecycle including auto-dismiss when agents complete.
 * 
 * Requirements: 9.6
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import type { ThoughtBubbleData } from '../components/Overlays/ThoughtBubbleManager';
import type { ThoughtBubbleType } from '../components/Overlays/ThoughtBubble';

/**
 * Configuration for auto-dismiss behavior
 */
interface AutoDismissConfig {
  /** Delay in ms before auto-dismissing after agent completes */
  dismissDelay?: number;
  /** Whether to auto-dismiss on agent completion */
  autoDismissOnComplete?: boolean;
}

const DEFAULT_CONFIG: AutoDismissConfig = {
  dismissDelay: 500,
  autoDismissOnComplete: true,
};

/**
 * Internal bubble state with additional metadata
 */
interface BubbleState extends ThoughtBubbleData {
  /** Timestamp when bubble was created */
  createdAt: number;
  /** Whether the bubble is pending dismissal */
  pendingDismiss?: boolean;
}

/**
 * Hook for managing thought bubbles with auto-dismiss functionality.
 * 
 * Features:
 * - Add/update/remove thought bubbles
 * - Auto-dismiss when agent completes (Requirement 9.6)
 * - Support for multiple simultaneous bubbles
 * 
 * @see Requirement 9.6: Auto-dismiss bubble when agent completes
 */
export function useThoughtBubbles(config: AutoDismissConfig = {}) {
  const { dismissDelay, autoDismissOnComplete } = { ...DEFAULT_CONFIG, ...config };
  
  const [bubbles, setBubbles] = useState<BubbleState[]>([]);
  const dismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      dismissTimers.current.forEach(timer => clearTimeout(timer));
      dismissTimers.current.clear();
    };
  }, []);
  
  /**
   * Add or update a thought bubble for a node
   */
  const setThought = useCallback((
    nodeId: string,
    text: string,
    type: ThoughtBubbleType = 'thinking',
    streaming: boolean = false
  ) => {
    const id = `thought-${nodeId}`;
    
    // Clear any pending dismiss timer
    const existingTimer = dismissTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      dismissTimers.current.delete(id);
    }
    
    setBubbles(prev => {
      const existing = prev.find(b => b.nodeId === nodeId);
      if (existing) {
        // Update existing bubble
        return prev.map(b => 
          b.nodeId === nodeId 
            ? { ...b, text, type, streaming, pendingDismiss: false }
            : b
        );
      }
      // Add new bubble
      return [...prev, {
        id,
        nodeId,
        text,
        type,
        streaming,
        createdAt: Date.now(),
      }];
    });
  }, []);
  
  /**
   * Clear thought bubble for a node (immediate removal)
   */
  const clearThought = useCallback((nodeId: string) => {
    const id = `thought-${nodeId}`;
    
    // Clear any pending dismiss timer
    const existingTimer = dismissTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      dismissTimers.current.delete(id);
    }
    
    setBubbles(prev => prev.filter(b => b.nodeId !== nodeId));
  }, []);
  
  /**
   * Dismiss a bubble by ID
   */
  const dismissBubble = useCallback((id: string) => {
    // Clear any pending dismiss timer
    const existingTimer = dismissTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      dismissTimers.current.delete(id);
    }
    
    setBubbles(prev => prev.filter(b => b.id !== id));
  }, []);
  
  /**
   * Mark agent as complete - triggers auto-dismiss after delay
   * @see Requirement 9.6: Dismiss bubble when agent completes
   */
  const onAgentComplete = useCallback((nodeId: string) => {
    if (!autoDismissOnComplete) return;
    
    const id = `thought-${nodeId}`;
    
    // Mark as pending dismiss
    setBubbles(prev => prev.map(b => 
      b.nodeId === nodeId 
        ? { ...b, streaming: false, pendingDismiss: true }
        : b
    ));
    
    // Schedule dismiss after delay
    const timer = setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.nodeId !== nodeId));
      dismissTimers.current.delete(id);
    }, dismissDelay);
    
    dismissTimers.current.set(id, timer);
  }, [autoDismissOnComplete, dismissDelay]);
  
  /**
   * Clear all thought bubbles
   */
  const clearAll = useCallback(() => {
    // Clear all timers
    dismissTimers.current.forEach(timer => clearTimeout(timer));
    dismissTimers.current.clear();
    
    setBubbles([]);
  }, []);
  
  /**
   * Get bubble for a specific node
   */
  const getBubble = useCallback((nodeId: string): ThoughtBubbleData | undefined => {
    return bubbles.find(b => b.nodeId === nodeId);
  }, [bubbles]);
  
  /**
   * Check if a node has an active thought bubble
   */
  const hasThought = useCallback((nodeId: string): boolean => {
    return bubbles.some(b => b.nodeId === nodeId);
  }, [bubbles]);
  
  // Convert internal state to public format
  const publicBubbles: ThoughtBubbleData[] = bubbles.map(({ createdAt, pendingDismiss, ...rest }) => rest);
  
  return {
    /** Current thought bubbles */
    bubbles: publicBubbles,
    /** Add or update a thought bubble */
    setThought,
    /** Clear thought bubble for a node */
    clearThought,
    /** Dismiss a bubble by ID */
    dismissBubble,
    /** Mark agent as complete (triggers auto-dismiss) */
    onAgentComplete,
    /** Clear all thought bubbles */
    clearAll,
    /** Get bubble for a specific node */
    getBubble,
    /** Check if a node has an active thought bubble */
    hasThought,
  };
}

export default useThoughtBubbles;
