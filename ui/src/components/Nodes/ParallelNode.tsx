/**
 * ParallelNode Component for ADK Studio v2.0
 * 
 * Displays parallel workflow nodes with concurrent sub-agents and theme-aware styling.
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

interface ParallelNodeData {
  /** Display label for the node */
  label: string;
  /** List of sub-agent names that run in parallel */
  subAgents?: string[];
  /** Tools configured for each sub-agent */
  subAgentTools?: Record<string, string[]>;
  /** Currently active sub-agent name (can be multiple in parallel) */
  activeSubAgent?: string;
  /** Whether the node is currently executing */
  isActive?: boolean;
  /** Whether the node is interrupted (HITL waiting for input) */
  isInterrupted?: boolean;
  /** Execution status */
  status?: NodeStatus;
}

interface Props {
  data: ParallelNodeData;
  selected?: boolean;
}

/**
 * ParallelSubAgentItem displays a single parallel sub-agent with its tools
 */
function ParallelSubAgentItem({
  name,
  tools,
  isActive,
}: {
  name: string;
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
        <span className="sub-agent-index">∥</span>
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
 * ParallelNode displays a parallel workflow with:
 * - Colored header bar (parallel green)
 * - List of concurrent sub-agents (marked with ∥)
 * - Active sub-agent highlighting
 * - Theme-aware styling
 * - Interrupted state for HITL (trigger-input-flow Requirement 3.3)
 */
export const ParallelNode = memo(function ParallelNode({ data, selected }: Props) {
  const isActive = data.isActive || false;
  const isInterrupted = data.isInterrupted || false;
  const subAgents = data.subAgents || [];
  const subAgentTools = data.subAgentTools || {};
  const activeSubAgent = data.activeSubAgent;
  const status = data.status || (isActive ? 'running' : 'idle');

  return (
    <BaseNode
      label={data.label}
      nodeType="parallel"
      isActive={isActive}
      isSelected={selected}
      isInterrupted={isInterrupted}
      status={status}
    >
      {subAgents.length > 0 && (
        <div className="space-y-1">
          {subAgents.map((sub) => (
            <ParallelSubAgentItem
              key={sub}
              name={sub}
              tools={subAgentTools[sub] || []}
              isActive={activeSubAgent === sub}
            />
          ))}
        </div>
      )}
    </BaseNode>
  );
});

ParallelNode.displayName = 'ParallelNode';

export default ParallelNode;
