/**
 * LoopNode Component for ADK Studio v2.0
 * 
 * Displays loop workflow nodes with iteration info, sub-agents, and theme-aware styling.
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import type { NodeStatus } from '../Overlays/StatusIndicator';

/**
 * Tool icon mapping for common tool types
 */
const toolIcons: Record<string, string> = {
  google_search: '🔍',
  search: '🔍',
  browser: '🌐',
  web: '🌐',
  mcp: '🔌',
  function: '⚡',
  file: '📁',
  code: '💻',
  default: '🔧',
};

/**
 * Get icon for a tool based on its name
 */
function getToolIcon(toolName: string): string {
  const lowerName = toolName.toLowerCase();
  for (const [key, icon] of Object.entries(toolIcons)) {
    if (key !== 'default' && lowerName.includes(key)) {
      return icon;
    }
  }
  return toolIcons.default;
}

interface LoopNodeData {
  /** Display label for the node */
  label: string;
  /** List of sub-agent names */
  subAgents?: string[];
  /** Tools configured for each sub-agent */
  subAgentTools?: Record<string, string[]>;
  /** Currently active sub-agent name */
  activeSubAgent?: string;
  /** Maximum number of iterations */
  maxIterations?: number;
  /** Current iteration (0-indexed) */
  currentIteration?: number;
  /** Whether the node is currently executing */
  isActive?: boolean;
  /** Whether the node is interrupted (HITL waiting for input) */
  isInterrupted?: boolean;
  /** Execution status */
  status?: NodeStatus;
}

interface Props {
  data: LoopNodeData;
  selected?: boolean;
}

/**
 * IterationBadge displays the current iteration status
 */
function IterationBadge({
  current,
  max,
  isActive,
}: {
  current: number;
  max: number;
  isActive: boolean;
}) {
  const label = isActive
    ? `Iteration ${current + 1}/${max}`
    : `Max ${max}×`;

  const className = [
    'iteration-badge',
    isActive && 'iteration-badge-active',
  ].filter(Boolean).join(' ');

  return (
    <div className="iteration-info">
      <span className={className}>{label}</span>
    </div>
  );
}

/**
 * SubAgentItem displays a single sub-agent with its tools
 */
function SubAgentItem({
  name,
  index,
  tools,
  isActive,
}: {
  name: string;
  index: number;
  tools: string[];
  isActive: boolean;
}) {
  const className = [
    'sub-agent',
    isActive && 'sub-agent-active',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <span className="sub-agent-index">
          {isActive ? '⚡' : `${index + 1}.`}
        </span>
        <span className="sub-agent-name">{name}</span>
      </div>
      {tools.length > 0 && (
        <div className="mt-1 text-xs opacity-70">
          {tools.map((t) => getToolIcon(t)).join(' ')}
        </div>
      )}
    </div>
  );
}

/**
 * LoopNode displays a loop workflow with:
 * - Colored header bar (loop yellow/gold)
 * - Iteration counter badge
 * - List of sub-agents
 * - Active sub-agent highlighting
 * - Theme-aware styling
 * - Interrupted state for HITL (trigger-input-flow Requirement 3.3)
 */
export const LoopNode = memo(function LoopNode({ data, selected }: Props) {
  const isActive = data.isActive || false;
  const isInterrupted = data.isInterrupted || false;
  const subAgents = data.subAgents || [];
  const subAgentTools = data.subAgentTools || {};
  const activeSubAgent = data.activeSubAgent;
  const maxIterations = data.maxIterations || 3;
  const currentIteration = data.currentIteration || 0;
  const status = data.status || (isActive ? 'running' : 'idle');

  return (
    <BaseNode
      label={data.label}
      nodeType="loop"
      isActive={isActive}
      isSelected={selected}
      isInterrupted={isInterrupted}
      status={status}
    >
      {/* Iteration info */}
      <IterationBadge
        current={currentIteration}
        max={maxIterations}
        isActive={isActive}
      />

      {/* Sub-agents list */}
      {subAgents.length > 0 && (
        <div className="node-body-section space-y-1">
          {subAgents.map((sub, idx) => (
            <SubAgentItem
              key={sub}
              name={sub}
              index={idx}
              tools={subAgentTools[sub] || []}
              isActive={activeSubAgent === sub}
            />
          ))}
        </div>
      )}
    </BaseNode>
  );
});

LoopNode.displayName = 'LoopNode';

export default LoopNode;
