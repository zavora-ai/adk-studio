/**
 * MergeNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Merge action nodes.
 * Displays mode, combine strategy, and multiple input handles.
 * 
 * Features:
 * - Visual display of merge mode (wait_all/wait_any/wait_n)
 * - Multiple input handles for incoming branches
 * - Combine strategy indicator
 * - Timeout status indicator
 * - Branch key labels when using object strategy
 * 
 * Requirements: 8.1, 8.2, 8.3, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { MergeNodeConfig, MergeMode, CombineStrategy } from '../../types/actionNodes';
import '../../styles/mergeNode.css';

interface MergeNodeData extends MergeNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: MergeNodeData;
  selected?: boolean;
}

/**
 * Mode display configuration
 */
const MODE_CONFIG: Record<MergeMode, { label: string; icon: string; description: string }> = {
  wait_all: {
    label: 'Wait All',
    icon: '⏳',
    description: 'Wait for all branches',
  },
  wait_any: {
    label: 'Wait Any',
    icon: '⚡',
    description: 'Continue on first completion',
  },
  wait_n: {
    label: 'Wait N',
    icon: '🔢',
    description: 'Wait for N branches',
  },
};

/**
 * Strategy display configuration
 */
const STRATEGY_CONFIG: Record<CombineStrategy, { label: string; icon: string }> = {
  array: { label: 'Array', icon: '📋' },
  object: { label: 'Object', icon: '📦' },
  first: { label: 'First', icon: '1️⃣' },
  last: { label: 'Last', icon: '🔚' },
};

/**
 * MergeNode displays branch combination with multiple inputs.
 * 
 * The node shows:
 * - Merge mode badge (wait_all, wait_any, wait_n)
 * - Wait count for wait_n mode
 * - Combine strategy indicator
 * - Timeout indicator when enabled
 * - Branch key labels for object strategy
 * 
 * @see Requirements 8.1, 8.2, 8.3, 12.1, 12.3
 */
export const MergeNode = memo(function MergeNode({ data, selected }: Props) {
  const modeConfig = MODE_CONFIG[data.mode];
  const strategyConfig = STRATEGY_CONFIG[data.combineStrategy];
  
  // Merge nodes typically have multiple inputs (at least 2)
  // Use branchKeys length if available, otherwise default to 2
  const inputPorts = Math.max(2, data.branchKeys?.length || 2);
  
  // Generate input port IDs based on branch keys or default
  const inputPortIds = data.branchKeys && data.branchKeys.length > 0
    ? data.branchKeys
    : Array.from({ length: inputPorts }, (_, i) => `input-${i}`);

  return (
    <ActionNodeBase
      type="merge"
      label={data.name || 'Merge'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
      inputPorts={inputPorts}
      inputPortIds={inputPortIds}
    >
      <div className="merge-node-content">
        {/* Mode Badge */}
        <div className="merge-node-header-row">
          <span className={`merge-node-mode-badge ${data.mode}`}>
            <span className="merge-node-mode-icon">{modeConfig.icon}</span>
            <span className="merge-node-mode-label">
              {data.mode === 'wait_n' 
                ? `Wait ${data.waitCount || 'N'}` 
                : modeConfig.label}
            </span>
          </span>
          
          {/* Input count badge */}
          <span className="merge-node-count-badge">
            {inputPorts} input{inputPorts !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Combine Strategy */}
        <div className="merge-node-strategy">
          <span className="merge-node-strategy-icon">{strategyConfig.icon}</span>
          <span className="merge-node-strategy-label">{strategyConfig.label}</span>
        </div>
        
        {/* Branch Keys (for object strategy) */}
        {data.combineStrategy === 'object' && data.branchKeys && data.branchKeys.length > 0 && (
          <div className="merge-node-branches">
            {data.branchKeys.slice(0, 3).map((key, i) => (
              <div key={i} className="merge-branch-indicator">
                <span className="merge-branch-index">#{i + 1}</span>
                <span className="merge-branch-key">{key}</span>
              </div>
            ))}
            {data.branchKeys.length > 3 && (
              <div className="merge-branch-indicator merge-branch-more">
                +{data.branchKeys.length - 3} more
              </div>
            )}
          </div>
        )}
        
        {/* Timeout Indicator */}
        {data.timeout?.enabled && (
          <div className="merge-node-timeout">
            <span className="merge-node-timeout-icon">⏱️</span>
            <span className="merge-node-timeout-label">
              {data.timeout.ms}ms ({data.timeout.behavior})
            </span>
          </div>
        )}
      </div>
    </ActionNodeBase>
  );
});

export default MergeNode;
