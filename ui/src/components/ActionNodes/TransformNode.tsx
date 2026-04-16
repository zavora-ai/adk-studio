/**
 * TransformNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Transform action nodes.
 * Displays transform type badge, operations count, and type coercion indicator.
 * 
 * Requirements: 5.1, 5.2, 5.3, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { TransformNodeConfig, TransformType, BuiltinOperationType } from '../../types/actionNodes';

interface TransformNodeData extends TransformNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: TransformNodeData;
  selected?: boolean;
}

/**
 * Transform type display labels.
 * @see Requirement 5.1
 */
const TRANSFORM_TYPE_LABELS: Record<TransformType, string> = {
  jsonpath: 'JSONPath',
  jmespath: 'JMESPath',
  template: 'Template',
  javascript: 'JavaScript',
};

/**
 * Transform type icons for visual distinction.
 */
const TRANSFORM_TYPE_ICONS: Record<TransformType, string> = {
  jsonpath: '🔍',
  jmespath: '🔎',
  template: '📄',
  javascript: '📜',
};

/**
 * Built-in operation labels.
 * @see Requirement 5.2
 */
const OPERATION_LABELS: Record<BuiltinOperationType, string> = {
  pick: 'Pick',
  omit: 'Omit',
  rename: 'Rename',
  flatten: 'Flatten',
  sort: 'Sort',
  unique: 'Unique',
};

/**
 * TransformNode displays data transformation and mapping.
 * 
 * Features:
 * - Transform type badge with icon (Requirement 5.1)
 * - Operations count indicator (Requirement 5.2)
 * - Type coercion indicator (Requirement 5.3)
 * - Expression preview
 * 
 * @see Requirements 5.1, 5.2, 5.3, 12.1, 12.3
 */
export const TransformNode = memo(function TransformNode({ data, selected }: Props) {
  const typeLabel = TRANSFORM_TYPE_LABELS[data.transformType] || data.transformType;
  const typeIcon = TRANSFORM_TYPE_ICONS[data.transformType] || '⚙️';
  
  // Count operations if using built-in operations mode
  const operationsCount = data.operations?.length || 0;
  const hasOperations = operationsCount > 0;
  
  // Check for type coercion
  const hasTypeCoercion = !!data.typeCoercion?.targetType;
  
  // Get operation summary for display
  const getOperationsSummary = () => {
    if (!data.operations || data.operations.length === 0) return null;
    
    if (data.operations.length === 1) {
      return OPERATION_LABELS[data.operations[0].type] || data.operations[0].type;
    }
    
    return `${data.operations.length} operations`;
  };
  
  // Truncate expression for preview
  const getExpressionPreview = () => {
    if (!data.expression) return null;
    const maxLength = 30;
    if (data.expression.length <= maxLength) return data.expression;
    return data.expression.substring(0, maxLength) + '...';
  };

  return (
    <ActionNodeBase
      type="transform"
      label={data.name || 'Transform'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      {/* Transform type badge with icon */}
      <div className="transform-node-type">
        <span className="transform-node-type-icon">{typeIcon}</span>
        <span className="transform-node-type-label">{typeLabel}</span>
      </div>
      
      {/* Operations indicator (for built-in operations mode) */}
      {hasOperations && (
        <div className="transform-node-operations">
          <span className="transform-node-operations-icon">🔧</span>
          <span className="transform-node-operations-text">{getOperationsSummary()}</span>
        </div>
      )}
      
      {/* Expression preview (for expression mode) */}
      {!hasOperations && data.expression && (
        <div className="transform-node-expression">
          <code className="transform-node-expression-code">{getExpressionPreview()}</code>
        </div>
      )}
      
      {/* Type coercion indicator */}
      {hasTypeCoercion && (
        <div className="transform-node-coercion">
          <span className="transform-node-coercion-icon">→</span>
          <span className="transform-node-coercion-type">{data.typeCoercion!.targetType}</span>
        </div>
      )}
    </ActionNodeBase>
  );
});

export default TransformNode;
