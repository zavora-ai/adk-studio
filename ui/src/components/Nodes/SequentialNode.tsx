/**
 * SequentialNode Component for ADK Studio v2.0
 * 
 * Displays sequential workflow nodes with sub-agents and theme-aware styling.
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

interface SequentialNodeData {
  /** Display label for the node */
  label: string;
  /** List of sub-agent names in execution order */
  subAgents?: string[];
  /** Tools configured for each sub-agent */
  subAgentTools?: Record<string, string[]>;
  /** Currently active sub-agent name */
  activeSubAgent?: string;
  /** Whether the node is currently executing */
  isActive?: boolean;
  /** Whether the node is interrupted (HITL waiting for input) */
  isInterrupted?: boolean;
  /** Execution status */
  status?: NodeStatus;
}

interface Props {
  data: SequentialNodeData;
  selected?: boolean;
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
 * SequentialNode displays a sequential workflow with:
 * - Colored header bar (sequential purple)
 * - Ordered list of sub-agents
 * - Active sub-agent highlighting
 * - Theme-aware styling
 * - Interrupted state for HITL (trigger-input-flow Requirement 3.3)
 */
export const SequentialNode = memo(function SequentialNode({ data, selected }: Props) {
  const isActive = data.isActive || false;
  const isInterrupted = data.isInterrupted || false;
  const subAgents = data.subAgents || [];
  const subAgentTools = data.subAgentTools || {};
  const activeSubAgent = data.activeSubAgent;
  const status = data.status || (isActive ? 'running' : 'idle');

  return (
    <BaseNode
      label={data.label}
      nodeType="sequential"
      isActive={isActive}
      isSelected={selected}
      isInterrupted={isInterrupted}
      status={status}
    >
      {subAgents.length > 0 && (
        <div className="space-y-1">
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

SequentialNode.displayName = 'SequentialNode';

export default SequentialNode;
