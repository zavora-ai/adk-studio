import { memo, useCallback, useState } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

/**
 * Data for data flow edges.
 * State keys are populated from runtime SSE events only.
 * 
 * @see Requirements 3.1, 3.3, 3.5
 */
export interface DataFlowEdgeData {
  animated?: boolean;
  /** State keys from runtime SSE events (not inferred from node config) */
  stateKeys?: string[];
  /** Whether to show the data flow overlay */
  showOverlay?: boolean;
  /** Callback when a state key is hovered (for highlighting related edges) */
  onKeyHover?: (key: string | null) => void;
  /** Currently highlighted key (from another edge hover) */
  highlightedKey?: string | null;
}

/**
 * DataFlowEdge displays state key labels on edges.
 * 
 * State keys are sourced from runtime SSE events (agent input/output state).
 * Labels are only shown when:
 * 1. showOverlay is enabled
 * 2. stateKeys were provided by runtime (not inferred)
 * 
 * @see Requirements 3.1: Edge components SHALL support displaying state key labels
 * @see Requirements 3.3: State keys SHALL be sourced from runtime execution events
 * @see Requirements 3.5: Labels SHALL be positioned along the edge path
 */
export const DataFlowEdge = memo(function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as DataFlowEdgeData | undefined;
  const isAnimated = edgeData?.animated || false;
  const shouldShowLabel = edgeData?.showOverlay && edgeData?.stateKeys && edgeData.stateKeys.length > 0;
  const stateKeys = edgeData?.stateKeys || [];
  const highlightedKey = edgeData?.highlightedKey;
  const onKeyHover = edgeData?.onKeyHover;
  
  // Check if this edge contains the highlighted key
  const isHighlighted = highlightedKey && stateKeys.includes(highlightedKey);
  
  // Handle hover on state key labels
  const handleMouseEnter = useCallback((key: string) => {
    setIsHovered(true);
    onKeyHover?.(key);
  }, [onKeyHover]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onKeyHover?.(null);
  }, [onKeyHover]);

  // Determine edge color based on state
  const getEdgeColor = () => {
    if (isAnimated) return '#ef4444'; // Red for animated/active
    if (isHighlighted) return '#0F8A8A'; // Teal for highlighted
    if (selected) return '#3b82f6'; // Blue for selected
    return '#6b7280'; // Gray default
  };
  
  const getEdgeWidth = () => {
    if (isAnimated) return 3;
    if (isHighlighted) return 3;
    if (selected) return 2.5;
    return 2;
  };

  return (
    <>
      {/* Base edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={getEdgeColor()}
        strokeWidth={getEdgeWidth()}
        strokeDasharray={isAnimated ? '8 4' : 'none'}
        style={{ 
          animation: isAnimated ? 'dashFlow 0.5s linear infinite' : 'none',
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        }}
        className="react-flow__edge-path"
      />
      
      {/* Invisible wider path for easier interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      
      {/* State key labels (only shown when overlay is enabled and keys exist) */}
      {/* @see Requirements 3.5: Labels positioned along edge path */}
      {/* @see Requirements 3.6, 3.7: Multiple keys as comma-separated list with pill/badge style */}
      {/* @see Requirements 3.9: Overlay doesn't obstruct node interaction */}
      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            className="data-flow-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              // Only the label itself captures pointer events, not the surrounding area
              // This ensures nodes remain clickable/draggable
              pointerEvents: 'all',
              // Ensure label doesn't block underlying elements when not hovered
              zIndex: isHovered ? 10 : 1,
            }}
            onMouseEnter={() => handleMouseEnter(stateKeys[0])}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className={`
                data-flow-badge
                ${isHovered || isHighlighted ? 'data-flow-badge-highlighted' : ''}
              `}
            >
              {stateKeys.map((key, index) => (
                <span 
                  key={key}
                  className="data-flow-key"
                  onMouseEnter={() => handleMouseEnter(key)}
                >
                  {key}
                  {index < stateKeys.length - 1 && (
                    <span className="data-flow-separator">, </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Animation keyframes */}
      <style>{`
        @keyframes dashFlow { 
          to { stroke-dashoffset: -12; } 
        }
        
        .data-flow-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 3px 8px;
          background: var(--accent-primary, #0F8A8A);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          white-space: nowrap;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .data-flow-badge:hover,
        .data-flow-badge-highlighted {
          background: var(--accent-primary, #0F8A8A);
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(15, 138, 138, 0.4);
        }
        
        .data-flow-key {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        }
        
        .data-flow-separator {
          color: rgba(255, 255, 255, 0.7);
        }
        
        /* Dark theme adjustments */
        :root[data-theme="dark"] .data-flow-badge {
          background: var(--accent-primary, #4fd1c5);
          color: #1a1a2e;
        }
        
        :root[data-theme="dark"] .data-flow-badge:hover,
        :root[data-theme="dark"] .data-flow-badge-highlighted {
          box-shadow: 0 4px 8px rgba(79, 209, 197, 0.4);
        }
        
        :root[data-theme="dark"] .data-flow-separator {
          color: rgba(26, 26, 46, 0.7);
        }
      `}</style>
    </>
  );
});

DataFlowEdge.displayName = 'DataFlowEdge';
