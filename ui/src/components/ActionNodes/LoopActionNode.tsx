/**
 * LoopActionNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Loop action nodes.
 * Named LoopActionNode to avoid conflict with existing LoopNode (agent type).
 * Displays loop type and iteration indicator.
 * 
 * Features:
 * - Visual display of loop type (forEach, while, times)
 * - Iteration configuration preview
 * - Parallel execution indicator
 * - Result aggregation indicator
 * - Source array path preview for forEach
 * - Condition preview for while loops
 * - Count preview for times loops
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { LoopNodeConfig, LoopType } from '../../types/actionNodes';

interface LoopActionNodeData extends LoopNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: LoopActionNodeData;
  selected?: boolean;
}

/**
 * Loop type display configuration
 */
const LOOP_TYPE_CONFIG: Record<LoopType, {
  label: string;
  icon: string;
  description: string;
}> = {
  forEach: {
    label: 'For Each',
    icon: '📋',
    description: 'Iterate over array items',
  },
  while: {
    label: 'While',
    icon: '🔁',
    description: 'Loop while condition is true',
  },
  times: {
    label: 'Times',
    icon: '🔢',
    description: 'Repeat N times',
  },
};

/**
 * Get a preview of the loop configuration based on type
 */
function getLoopPreview(data: LoopActionNodeData): string | null {
  switch (data.loopType) {
    case 'forEach':
      if (data.forEach?.sourceArray) {
        const source = data.forEach.sourceArray;
        return source.length > 25 ? source.slice(0, 23) + '…' : source;
      }
      return null;
    case 'while':
      if (data.while?.condition) {
        const cond = data.while.condition;
        return cond.length > 25 ? cond.slice(0, 23) + '…' : cond;
      }
      return null;
    case 'times':
      if (data.times?.count !== undefined) {
        const count = data.times.count;
        return typeof count === 'number' ? `${count}×` : `${count}`;
      }
      return null;
    default:
      return null;
  }
}

/**
 * Get variable names for forEach loop
 */
function getForEachVars(data: LoopActionNodeData): string | null {
  if (data.loopType !== 'forEach' || !data.forEach) return null;
  const itemVar = data.forEach.itemVar || 'item';
  const indexVar = data.forEach.indexVar || 'index';
  return `${itemVar}, ${indexVar}`;
}

/**
 * LoopActionNode displays iteration over arrays or conditions.
 * 
 * The node shows:
 * - Loop type badge with icon (forEach, while, times)
 * - Parallel execution indicator when enabled
 * - Result aggregation indicator when collecting results
 * - Configuration preview based on loop type:
 *   - forEach: source array path and variable names
 *   - while: condition expression
 *   - times: iteration count
 * 
 * @see Requirements 7.1, 7.2, 7.3, 7.4, 12.1, 12.3
 */
export const LoopActionNode = memo(function LoopActionNode({ data, selected }: Props) {
  const typeConfig = LOOP_TYPE_CONFIG[data.loopType] || LOOP_TYPE_CONFIG.forEach;
  const preview = getLoopPreview(data);
  const forEachVars = getForEachVars(data);
  const isParallel = data.parallel?.enabled;
  const isCollecting = data.results?.collect;

  return (
    <ActionNodeBase
      type="loop"
      label={data.name || 'Loop'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="loop-node-content">
        {/* Loop Type Header Row */}
        <div className="loop-node-header-row">
          <span className="loop-node-type-badge">
            <span className="loop-node-type-icon">{typeConfig.icon}</span>
            <span className="loop-node-type-label">{typeConfig.label}</span>
          </span>
          
          {/* Parallel indicator */}
          {isParallel && (
            <span className="loop-node-parallel-badge" title="Parallel execution enabled">
              <span className="loop-node-parallel-icon">⚡</span>
              <span className="loop-node-parallel-label">Parallel</span>
            </span>
          )}
        </div>
        
        {/* Loop Configuration Preview */}
        {preview && (
          <div className="loop-node-preview">
            {data.loopType === 'forEach' && (
              <span className="loop-node-preview-label">Source:</span>
            )}
            {data.loopType === 'while' && (
              <span className="loop-node-preview-label">While:</span>
            )}
            {data.loopType === 'times' && (
              <span className="loop-node-preview-label">Count:</span>
            )}
            <code className="loop-node-preview-value">{preview}</code>
          </div>
        )}
        
        {/* ForEach Variable Names */}
        {forEachVars && (
          <div className="loop-node-vars">
            <span className="loop-node-vars-label">Variables:</span>
            <code className="loop-node-vars-value">{forEachVars}</code>
          </div>
        )}
        
        {/* Indicators Row */}
        <div className="loop-node-indicators">
          {/* Batch size indicator for parallel */}
          {isParallel && data.parallel?.batchSize && (
            <span className="loop-node-indicator" title="Batch size">
              <span className="loop-node-indicator-icon">📦</span>
              <span className="loop-node-indicator-text">
                Batch: {data.parallel.batchSize}
              </span>
            </span>
          )}
          
          {/* Delay indicator for parallel */}
          {isParallel && data.parallel?.delayBetween && (
            <span className="loop-node-indicator" title="Delay between batches">
              <span className="loop-node-indicator-icon">⏱️</span>
              <span className="loop-node-indicator-text">
                {data.parallel.delayBetween}ms
              </span>
            </span>
          )}
          
          {/* Result aggregation indicator */}
          {isCollecting && (
            <span className="loop-node-collect-badge" title="Collecting results">
              <span className="loop-node-collect-icon">📥</span>
              <span className="loop-node-collect-label">
                {data.results?.aggregationKey 
                  ? `→ ${data.results.aggregationKey}` 
                  : 'Collect'}
              </span>
            </span>
          )}
        </div>
        
        {/* Empty state */}
        {!preview && data.loopType === 'forEach' && (
          <div className="loop-node-empty">
            Configure source array
          </div>
        )}
        {!preview && data.loopType === 'while' && (
          <div className="loop-node-empty">
            Configure condition
          </div>
        )}
        {!preview && data.loopType === 'times' && (
          <div className="loop-node-empty">
            Configure iteration count
          </div>
        )}
      </div>
    </ActionNodeBase>
  );
});

export default LoopActionNode;
