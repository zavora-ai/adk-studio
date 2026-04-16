/**
 * LlmAgentNode Component for ADK Studio v2.0
 * 
 * Displays LLM agent nodes with tool badges, model info, and theme-aware styling.
 * 
 * Requirements: 7.8, 7.10
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
  database: '🗄️',
  api: '🔗',
  email: '📧',
  calendar: '📅',
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

/**
 * Truncate tool name for display in badge
 */
function truncateToolName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 1) + '…';
}

interface LlmNodeData {
  /** Display label for the node */
  label: string;
  /** Model identifier (e.g., 'gemini-3.1-flash-lite-preview') */
  model?: string;
  /** List of tool names configured for this agent */
  tools?: string[];
  /** Whether the node is currently executing */
  isActive?: boolean;
  /** Whether the node is interrupted (HITL waiting for input) */
  isInterrupted?: boolean;
  /** Current thought/reasoning text (for thought bubble) */
  thought?: string;
  /** Execution status */
  status?: NodeStatus;
}

interface Props {
  data: LlmNodeData;
  selected?: boolean;
}

/**
 * ToolBadge displays a single tool as a compact badge chip
 * Requirement 7.8: THE Node components SHALL display configured tools as compact badges/chips
 */
function ToolBadge({ name }: { name: string }) {
  const icon = getToolIcon(name);
  const displayName = truncateToolName(name);
  
  return (
    <span className="tool-badge" title={name}>
      <span className="tool-badge-icon">{icon}</span>
      <span className="tool-badge-name">{displayName}</span>
    </span>
  );
}

/**
 * ToolBadges displays all tools as compact badge chips
 */
function ToolBadges({ tools }: { tools: string[] }) {
  if (!tools || tools.length === 0) return null;
  
  return (
    <div className="tool-badges">
      {tools.map((tool) => (
        <ToolBadge key={tool} name={tool} />
      ))}
    </div>
  );
}

/**
 * ModelInfo displays the configured model
 */
function ModelInfo({ model }: { model: string }) {
  return (
    <div className="model-info">
      <span className="model-icon">🧠</span>
      <span className="model-name">{model}</span>
    </div>
  );
}

/**
 * LlmAgentNode displays an LLM agent with:
 * - Colored header bar (agent blue)
 * - Model information
 * - Tool badges as compact chips (Requirement 7.8)
 * - Theme-aware styling (Requirement 7.10)
 * - Thought indicator when thinking
 * - Interrupted state for HITL (trigger-input-flow Requirement 3.3)
 */
export const LlmAgentNode = memo(function LlmAgentNode({ data, selected }: Props) {
  const isActive = data.isActive || false;
  const isInterrupted = data.isInterrupted || false;
  const hasThought = !!data.thought;
  const model = data.model || 'gemini-3.1-flash-lite-preview';
  const tools = data.tools || [];
  const status = data.status || (isActive ? 'running' : 'idle');

  // Custom icon with thought indicator or interrupted indicator
  const icon = isInterrupted ? '🤖⏸️' : (hasThought ? '🤖💭' : '🤖');

  return (
    <BaseNode
      label={data.label}
      icon={icon}
      nodeType="agent"
      isActive={isActive}
      isSelected={selected}
      isInterrupted={isInterrupted}
      status={status}
    >
      {/* Model info section */}
      <ModelInfo model={model} />
      
      {/* Tools section - Requirement 7.8 */}
      {tools.length > 0 && (
        <div className="node-body-section">
          <ToolBadges tools={tools} />
        </div>
      )}
    </BaseNode>
  );
});

LlmAgentNode.displayName = 'LlmAgentNode';

export default LlmAgentNode;
