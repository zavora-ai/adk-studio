/**
 * ThoughtBubble Component for ADK Studio v2.0
 * 
 * Displays agent reasoning in real-time with animated thought bubbles.
 * Supports different types: thinking, tool, decision with distinct icons.
 * Uses CSS transitions for smooth in/out animations.
 * 
 * Requirements: 9.1, 9.3, 9.4, 9.5
 */

import { memo, useEffect, useState, useRef } from 'react';
import '../../styles/thought-bubble.css';

/**
 * Thought bubble types with distinct visual styles
 * @see Requirement 9.4: Support thinking, tool, decision types with icons
 */
export type ThoughtBubbleType = 'thinking' | 'tool' | 'decision';

/**
 * Position of the thought bubble relative to the source node
 */
export type ThoughtBubblePosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Icons for each thought bubble type
 * @see Requirement 9.4: Different types with icons
 */
const typeIcons: Record<ThoughtBubbleType, string> = {
  thinking: '💭',
  tool: '🔧',
  decision: '🤔',
};

/**
 * CSS class names for each thought bubble type (for gradient colors)
 */
const typeClasses: Record<ThoughtBubbleType, string> = {
  thinking: 'thought-bubble-thinking',
  tool: 'thought-bubble-tool',
  decision: 'thought-bubble-decision',
};

export interface ThoughtBubbleProps {
  /** The text content to display */
  text: string;
  /** Position relative to the source node */
  position?: ThoughtBubblePosition;
  /** Whether the text is still streaming */
  streaming?: boolean;
  /** Type of thought bubble (affects icon and color) */
  type?: ThoughtBubbleType;
  /** Whether the bubble is visible (controls animation) */
  visible?: boolean;
  /** Unique identifier for the bubble */
  id?: string;
  /** Source node ID (for pointer indication) */
  sourceNodeId?: string;
  /** Callback when bubble should be dismissed */
  onDismiss?: () => void;
  /** Maximum width of the bubble */
  maxWidth?: number;
  /** Z-index for stacking multiple bubbles */
  zIndex?: number;
}

/**
 * ThoughtBubble displays agent reasoning in real-time.
 * 
 * Features:
 * - CSS transition animations for smooth in/out (Requirement 9.3)
 * - Support for thinking, tool, decision types with icons (Requirement 9.4)
 * - Pointer indicating source node (Requirement 9.5)
 * - Streaming text indicator
 * 
 * @see Requirement 9.1: Display thought bubble near node when agent is thinking
 * @see Requirement 9.3: Animate in/out smoothly using CSS transitions
 * @see Requirement 9.4: Support different types with icons
 * @see Requirement 9.5: Pointer indicating which node it belongs to
 */
export const ThoughtBubble = memo(function ThoughtBubble({
  text,
  position = 'right',
  streaming = false,
  type = 'thinking',
  visible = true,
  id,
  sourceNodeId,
  onDismiss,
  maxWidth = 280,
  zIndex = 1000,
}: ThoughtBubbleProps) {
  // Track animation state for CSS transitions
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(visible);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Handle visibility changes with animation
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready for animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
        onDismiss?.();
      }, 200); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  // Don't render if not visible and animation complete
  if (!shouldRender || !text) {
    return null;
  }

  const icon = typeIcons[type];
  const typeClass = typeClasses[type];

  // Build position class
  const positionClass = `thought-bubble-${position}`;

  // Build animation class
  const animationClass = isAnimating ? 'thought-bubble-enter' : 'thought-bubble-exit';

  return (
    <div
      ref={bubbleRef}
      className={`thought-bubble ${positionClass} ${typeClass} ${animationClass}`}
      style={{
        maxWidth,
        zIndex,
      }}
      data-bubble-id={id}
      data-source-node={sourceNodeId}
      role="status"
      aria-live="polite"
      aria-label={`${type} bubble: ${text}`}
    >
      {/* Pointer indicating source node - Requirement 9.5 */}
      <div className="thought-bubble-pointer" />
      
      {/* Content container */}
      <div className="thought-bubble-content">
        {/* Type icon - Requirement 9.4 */}
        <span className="thought-bubble-icon" aria-hidden="true">
          {icon}
        </span>
        
        {/* Text content */}
        <span className="thought-bubble-text">
          {text}
          {/* Streaming cursor indicator */}
          {streaming && (
            <span className="thought-bubble-cursor" aria-hidden="true">
              ▊
            </span>
          )}
        </span>
      </div>
    </div>
  );
});

ThoughtBubble.displayName = 'ThoughtBubble';

export default ThoughtBubble;
