/**
 * SetNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Set action nodes.
 * Displays variable count badge, mode indicator, and variable preview.
 * 
 * Requirements: 4.1, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { SetNodeConfig, SetMode } from '../../types/actionNodes';

interface SetNodeData extends SetNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: SetNodeData;
  selected?: boolean;
}

/**
 * Mode display labels and icons
 * @see Requirement 4.2
 */
const MODE_CONFIG: Record<SetMode, { label: string; icon: string; color: string }> = {
  set: { label: 'Set', icon: '✏️', color: '#8B5CF6' },
  merge: { label: 'Merge', icon: '🔀', color: '#10B981' },
  delete: { label: 'Delete', icon: '🗑️', color: '#EF4444' },
};

/**
 * Truncates a value for display
 */
function truncateValue(value: unknown, maxLength: number = 20): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  const str = typeof value === 'object' 
    ? JSON.stringify(value) 
    : String(value);
  
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * SetNode displays variable definition and manipulation.
 * 
 * Features:
 * - Variable count badge (Requirement 4.1)
 * - Mode indicator (set/merge/delete) (Requirement 4.2)
 * - Secret variable indicator
 * - Environment variable loading indicator (Requirement 4.3)
 * - Preview of first few variables
 * 
 * @see Requirements 4.1, 4.2, 4.3, 12.1, 12.3
 */
export const SetNode = memo(function SetNode({ data, selected }: Props) {
  const modeConfig = MODE_CONFIG[data.mode] || MODE_CONFIG.set;
  const varCount = data.variables?.length || 0;
  const secretCount = data.variables?.filter(v => v.isSecret).length || 0;
  const hasEnvVars = data.envVars?.loadFromEnv;
  
  // Get first 2 variables for preview
  const previewVars = data.variables?.slice(0, 2) || [];

  return (
    <ActionNodeBase
      type="set"
      label={data.name || 'Set Variables'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="set-node-content">
        {/* Mode and count row */}
        <div className="set-node-header-row">
          <span 
            className="set-node-mode-badge"
            style={{ backgroundColor: modeConfig.color }}
          >
            <span className="set-node-mode-icon">{modeConfig.icon}</span>
            <span className="set-node-mode-label">{modeConfig.label}</span>
          </span>
          <span className="set-node-count-badge">
            {varCount} var{varCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Variable preview */}
        {previewVars.length > 0 && (
          <div className="set-node-vars-preview">
            {previewVars.map((variable, idx) => (
              <div key={idx} className="set-node-var-row">
                <span className="set-node-var-key">
                  {variable.isSecret && <span className="set-node-secret-icon" title="Secret">🔒</span>}
                  {variable.key}
                </span>
                <span className="set-node-var-separator">=</span>
                <span className="set-node-var-value" title={String(variable.value)}>
                  {variable.isSecret ? '••••••' : truncateValue(variable.value, 15)}
                </span>
              </div>
            ))}
            {varCount > 2 && (
              <div className="set-node-more">
                +{varCount - 2} more
              </div>
            )}
          </div>
        )}
        
        {/* Indicators row */}
        <div className="set-node-indicators">
          {secretCount > 0 && (
            <span className="set-node-indicator" title={`${secretCount} secret variable${secretCount !== 1 ? 's' : ''}`}>
              🔒 {secretCount}
            </span>
          )}
          {hasEnvVars && (
            <span className="set-node-indicator set-node-env-indicator" title="Loading from .env">
              📁 .env
              {data.envVars?.prefix && (
                <span className="set-node-env-prefix">({data.envVars.prefix}*)</span>
              )}
            </span>
          )}
        </div>
      </div>
    </ActionNodeBase>
  );
});

export default SetNode;
