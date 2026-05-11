import React from 'react';
import type { AgentSchema } from '../../types/project';
import { TOOL_TYPES } from './ToolPalette';

interface Props {
  nodeId: string;
  agent: AgentSchema;
  onUpdate: (id: string, updates: Partial<AgentSchema>) => void;
}

export function ResilienceSection({ nodeId, agent, onUpdate }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToolConfirmationToggle = (toolId: string, checked: boolean) => {
    const current = agent.tools_requiring_confirmation || [];
    const updated = checked
      ? [...current, toolId]
      : current.filter(t => t !== toolId);
    onUpdate(nodeId, { tools_requiring_confirmation: updated });
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-xs flex items-center gap-1"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>{isOpen ? '▼' : '▶'}</span> Resilience &amp; Execution
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3 pl-2 border-l" style={{ borderColor: 'var(--border-default)' }}>
          {/* Tool Execution Strategy */}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Tool Execution Strategy
            </label>
            <select
              className="w-full px-2 py-1 border rounded text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              value={agent.tool_execution_strategy || 'auto'}
              onChange={(e) =>
                onUpdate(nodeId, {
                  tool_execution_strategy: e.target.value as 'auto' | 'sequential' | 'parallel',
                })
              }
            >
              <option value="auto">Auto (concurrent read-only)</option>
              <option value="sequential">Sequential</option>
              <option value="parallel">Parallel</option>
            </select>
          </div>

          {/* Tool Timeout */}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Tool Timeout (seconds)
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 border rounded text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              value={agent.tool_timeout_secs ?? ''}
              onChange={(e) =>
                onUpdate(nodeId, {
                  tool_timeout_secs: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Default (300)"
              min="1"
              step="1"
            />
          </div>

          {/* Max LLM Iterations */}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Max LLM Iterations
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 border rounded text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              value={agent.max_llm_iterations ?? ''}
              onChange={(e) =>
                onUpdate(nodeId, {
                  max_llm_iterations: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Default (100)"
              min="1"
              step="1"
            />
          </div>

          {/* Tool Retry Budget */}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Tool Retry Budget
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 border rounded text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              value={agent.tool_retry_budget ?? ''}
              onChange={(e) =>
                onUpdate(nodeId, {
                  tool_retry_budget: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="None"
              min="1"
              max="5"
              step="1"
            />
          </div>

          {/* Circuit Breaker Threshold */}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Circuit Breaker Threshold
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 border rounded text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              value={agent.circuit_breaker_threshold ?? ''}
              onChange={(e) =>
                onUpdate(nodeId, {
                  circuit_breaker_threshold: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="None"
              min="1"
              step="1"
            />
          </div>

          {/* Tool Confirmation */}
          {agent.tools.length > 0 && (
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Tool Confirmation
                <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                  (require approval)
                </span>
              </label>
              <div className="space-y-1">
                {agent.tools.map((toolId) => {
                  const baseType = toolId.startsWith('function')
                    ? 'function'
                    : toolId.startsWith('mcp')
                    ? 'mcp'
                    : toolId;
                  const toolDef = TOOL_TYPES.find((tt) => tt.type === baseType);
                  const isChecked = (agent.tools_requiring_confirmation || []).includes(toolId);
                  return (
                    <label
                      key={toolId}
                      className="flex items-center gap-2 text-xs cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToolConfirmationToggle(toolId, e.target.checked)}
                      />
                      <span>
                        {toolDef?.icon} {toolDef?.label || toolId}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
