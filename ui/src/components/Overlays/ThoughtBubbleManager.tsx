/**
 * ThoughtBubbleManager Component for ADK Studio v2.0
 * 
 * Manages multiple thought bubbles with intelligent positioning to avoid
 * overlapping other nodes. Handles multiple simultaneous bubbles.
 * 
 * Requirements: 9.7, 9.8
 */

import { memo, useMemo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ThoughtBubble, ThoughtBubbleType, ThoughtBubblePosition } from './ThoughtBubble';

/**
 * Represents a thought bubble to be displayed
 */
export interface ThoughtBubbleData {
  /** Unique identifier for the bubble */
  id: string;
  /** Source node ID */
  nodeId: string;
  /** Text content */
  text: string;
  /** Type of thought (thinking, tool, decision) */
  type: ThoughtBubbleType;
  /** Whether the text is streaming */
  streaming?: boolean;
}

/**
 * Node bounds for collision detection
 */
interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Default node dimensions (used when actual dimensions unavailable)
 */
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 100;
const BUBBLE_WIDTH = 280;
const BUBBLE_HEIGHT = 80;
const BUBBLE_OFFSET = 16;

/**
 * Position priority order for bubble placement
 * Try right first, then top, then left, then bottom
 */
const POSITION_PRIORITY: ThoughtBubblePosition[] = ['right', 'top', 'left', 'bottom'];

export interface ThoughtBubbleManagerProps {
  /** Array of thought bubbles to display */
  bubbles: ThoughtBubbleData[];
  /** Callback when a bubble should be dismissed */
  onDismiss?: (id: string) => void;
}

/**
 * Calculate the bounds of a bubble at a given position relative to a node
 */
function getBubbleBounds(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  position: ThoughtBubblePosition
): { x: number; y: number; width: number; height: number } {
  const bubbleWidth = BUBBLE_WIDTH;
  const bubbleHeight = BUBBLE_HEIGHT;
  
  switch (position) {
    case 'right':
      return {
        x: nodeX + nodeWidth + BUBBLE_OFFSET,
        y: nodeY + (nodeHeight - bubbleHeight) / 2,
        width: bubbleWidth,
        height: bubbleHeight,
      };
    case 'left':
      return {
        x: nodeX - bubbleWidth - BUBBLE_OFFSET,
        y: nodeY + (nodeHeight - bubbleHeight) / 2,
        width: bubbleWidth,
        height: bubbleHeight,
      };
    case 'top':
      return {
        x: nodeX + (nodeWidth - bubbleWidth) / 2,
        y: nodeY - bubbleHeight - BUBBLE_OFFSET,
        width: bubbleWidth,
        height: bubbleHeight,
      };
    case 'bottom':
      return {
        x: nodeX + (nodeWidth - bubbleWidth) / 2,
        y: nodeY + nodeHeight + BUBBLE_OFFSET,
        width: bubbleWidth,
        height: bubbleHeight,
      };
  }
}

/**
 * Check if two rectangles overlap
 */
function rectsOverlap(
  r1: { x: number; y: number; width: number; height: number },
  r2: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    r1.x + r1.width < r2.x ||
    r2.x + r2.width < r1.x ||
    r1.y + r1.height < r2.y ||
    r2.y + r2.height < r1.y
  );
}

/**
 * Find the best position for a bubble that doesn't overlap with other nodes
 * @see Requirement 9.7: Position to avoid overlapping other nodes
 */
function findBestPosition(
  sourceNode: NodeBounds,
  otherNodes: NodeBounds[],
  existingBubbles: { position: ThoughtBubblePosition; bounds: { x: number; y: number; width: number; height: number } }[]
): ThoughtBubblePosition {
  for (const position of POSITION_PRIORITY) {
    const bubbleBounds = getBubbleBounds(
      sourceNode.x,
      sourceNode.y,
      sourceNode.width,
      sourceNode.height,
      position
    );
    
    // Check overlap with other nodes
    const overlapsNode = otherNodes.some(node => 
      rectsOverlap(bubbleBounds, node)
    );
    
    // Check overlap with existing bubbles
    const overlapsBubble = existingBubbles.some(bubble =>
      rectsOverlap(bubbleBounds, bubble.bounds)
    );
    
    if (!overlapsNode && !overlapsBubble) {
      return position;
    }
  }
  
  // Default to right if all positions overlap
  return 'right';
}

/**
 * ThoughtBubbleManager handles positioning and rendering of multiple thought bubbles.
 * 
 * Features:
 * - Intelligent positioning to avoid overlapping nodes (Requirement 9.7)
 * - Support for multiple simultaneous bubbles (Requirement 9.8)
 * - Automatic position adjustment based on canvas layout
 */
export const ThoughtBubbleManager = memo(function ThoughtBubbleManager({
  bubbles,
  onDismiss,
}: ThoughtBubbleManagerProps) {
  const { getNodes } = useReactFlow();
  
  // Get all node bounds for collision detection
  const nodeBounds = useMemo((): NodeBounds[] => {
    const nodes = getNodes();
    return nodes.map(node => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      width: (node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH) as number,
      height: (node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT) as number,
    }));
  }, [getNodes]);
  
  // Calculate positions for all bubbles
  const positionedBubbles = useMemo(() => {
    const existingBubbles: { position: ThoughtBubblePosition; bounds: { x: number; y: number; width: number; height: number } }[] = [];
    
    return bubbles.map(bubble => {
      const sourceNode = nodeBounds.find(n => n.id === bubble.nodeId);
      if (!sourceNode) {
        return { ...bubble, position: 'right' as ThoughtBubblePosition };
      }
      
      // Get other nodes (excluding source)
      const otherNodes = nodeBounds.filter(n => n.id !== bubble.nodeId);
      
      // Find best position
      const position = findBestPosition(sourceNode, otherNodes, existingBubbles);
      
      // Add this bubble to existing bubbles for next iteration
      const bounds = getBubbleBounds(
        sourceNode.x,
        sourceNode.y,
        sourceNode.width,
        sourceNode.height,
        position
      );
      existingBubbles.push({ position, bounds });
      
      return { ...bubble, position };
    });
  }, [bubbles, nodeBounds]);
  
  const handleDismiss = useCallback((id: string) => {
    onDismiss?.(id);
  }, [onDismiss]);
  
  if (bubbles.length === 0) {
    return null;
  }
  
  return (
    <>
      {positionedBubbles.map((bubble, index) => (
        <ThoughtBubble
          key={bubble.id}
          id={bubble.id}
          text={bubble.text}
          type={bubble.type}
          position={bubble.position}
          streaming={bubble.streaming}
          sourceNodeId={bubble.nodeId}
          visible={true}
          zIndex={1000 + index}
          onDismiss={() => handleDismiss(bubble.id)}
        />
      ))}
    </>
  );
});

ThoughtBubbleManager.displayName = 'ThoughtBubbleManager';

export default ThoughtBubbleManager;
