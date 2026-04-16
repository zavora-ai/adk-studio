/**
 * BaseNode Component for ADK Studio v2.0
 * 
 * Shared node wrapper with theme support, colored header bar based on node type,
 * node type icon, type badge, and integrated StatusIndicator.
 * 
 * Requirements: 7.2, 7.3, 7.9
 */

import { Handle, Position } from '@xyflow/react';
import { memo, ReactNode } from 'react';
import { StatusIndicator, type NodeStatus } from '../Overlays/StatusIndicator';

/**
 * Node type identifiers for styling
 */
export type NodeType = 'agent' | 'sequential' | 'loop' | 'parallel' | 'router' | 'start' | 'end';

/**
 * Node type icons mapping
 * Requirement 7.3: THE Node components SHALL show an icon representing the node type
 */
const nodeIcons: Record<NodeType, string> = {
  agent: '🤖',
  sequential: '⛓',
  loop: '🔄',
  parallel: '⚡',
  router: '🔀',
  start: '▶',
  end: '⏹',
};

/**
 * Node type labels for badge display
 */
const nodeLabels: Record<NodeType, string> = {
  agent: 'agent',
  sequential: 'sequential',
  loop: 'loop',
  parallel: 'parallel',
  router: 'router',
  start: 'start',
  end: 'end',
};

interface BaseNodeProps {
  /** Unique node identifier */
  id?: string;
  /** Display label for the node */
  label: string;
  /** Optional custom icon (overrides default type icon) */
  icon?: string;
  /** Node type for header color styling */
  nodeType: NodeType;
  /** Whether the node is currently executing */
  isActive?: boolean;
  /** Whether the node is selected */
  isSelected?: boolean;
  /** Whether the node is interrupted (HITL waiting for input) */
  isInterrupted?: boolean;
  /** Current execution status */
  status?: NodeStatus;
  /** Optional children to render in the node body */
  children?: ReactNode;
  /** Whether to show top handle */
  showTopHandle?: boolean;
  /** Whether to show bottom handle */
  showBottomHandle?: boolean;
  /** Whether to show left handle */
  showLeftHandle?: boolean;
  /** Whether to show right handle */
  showRightHandle?: boolean;
  /** Whether to show the type badge (default: true) */
  showTypeBadge?: boolean;
}

/**
 * BaseNode provides a consistent visual structure for all node types.
 * 
 * Features:
 * - Colored header bar based on node type (Requirement 7.2)
 * - Node type icon (Requirement 7.3)
 * - Integrated StatusIndicator (Requirement 7.4)
 * - Selection highlighting with distinct border (Requirement 7.9)
 * - Theme-aware styling using CSS variables
 * - Interrupted state for HITL (trigger-input-flow Requirement 3.3)
 */
export const BaseNode = memo(function BaseNode({
  label,
  icon,
  nodeType,
  isActive = false,
  isSelected = false,
  isInterrupted = false,
  status = 'idle',
  children,
  showTopHandle = true,
  showBottomHandle = true,
  showLeftHandle = true,
  showRightHandle = true,
  showTypeBadge = true,
}: BaseNodeProps) {
  // Use custom icon or default type icon
  const displayIcon = icon || nodeIcons[nodeType];
  const typeBadgeLabel = nodeLabels[nodeType];
  
  // Determine effective status: interrupted takes precedence over active
  const effectiveStatus: NodeStatus = isInterrupted ? 'interrupted' : (isActive ? 'running' : status);
  
  // Build class names for styling
  const containerClasses = [
    'node-base',
    isSelected && 'node-selected',
    isActive && 'node-active',
    isInterrupted && 'node-interrupted',
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'node-header',
    `node-header-${nodeType}`,
  ].join(' ');

  return (
    <div className={containerClasses}>
      {/* Target handles */}
      {showTopHandle && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="node-handle"
        />
      )}
      {showLeftHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="node-handle"
        />
      )}

      {/* Colored header bar - Requirement 7.2 */}
      <div className={headerClasses}>
        <span className="node-icon">{displayIcon}</span>
        <span className="node-label">{label}</span>
        {showTypeBadge && nodeType !== 'start' && nodeType !== 'end' && (
          <span className="node-type-badge">{typeBadgeLabel}</span>
        )}
        <StatusIndicator status={effectiveStatus} size="sm" />
      </div>

      {/* Node body content */}
      {children && (
        <div className="node-body">
          {children}
        </div>
      )}

      {/* Source handles */}
      {showBottomHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="node-handle"
        />
      )}
      {showRightHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="node-handle"
        />
      )}
    </div>
  );
});

export default BaseNode;
