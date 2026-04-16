/**
 * StartEndNodes Components for ADK Studio v2.0
 * 
 * Displays start and end marker nodes with theme-aware styling.
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';

/**
 * StartNode marks the beginning of a workflow.
 * Uses green accent color for positive/go indication.
 * 
 * Has both input (for optional trigger) and output handles:
 * - Input: Trigger node can connect TO START
 * - Output: START connects to first agent/action node
 */
export const StartNode = memo(function StartNode() {
  return (
    <div className="node-base" style={{ minWidth: 'auto' }}>
      {/* Input handle for trigger node connection */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="node-handle"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="node-handle"
      />
      <div className="node-header node-header-start">
        <span className="node-icon">▶</span>
        <span className="node-label">START</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="node-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="node-handle"
      />
    </div>
  );
});

StartNode.displayName = 'StartNode';

/**
 * EndNode marks the end of a workflow.
 * Uses red accent color for stop indication.
 */
export const EndNode = memo(function EndNode() {
  return (
    <div className="node-base" style={{ minWidth: 'auto' }}>
      <div className="node-header node-header-end">
        <span className="node-icon">⏹</span>
        <span className="node-label">END</span>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="node-handle"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="node-handle"
      />
    </div>
  );
});

EndNode.displayName = 'EndNode';

export default { StartNode, EndNode };
