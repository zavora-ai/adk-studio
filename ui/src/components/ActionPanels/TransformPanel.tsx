/**
 * TransformPanel Component for ADK Studio
 * 
 * Simplified properties panel for configuring Transform action nodes.
 * Provides a streamlined UI with clear guidance for each transform type.
 * 
 * Requirements: 5.1, 5.2, 5.3, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import type { 
  TransformNodeConfig, 
  TransformType,
  TypeCoercion,
  CoercionTargetType,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/transformPanel.css';

// ============================================
// Constants
// ============================================

const TRANSFORM_OPTIONS: Array<{
  type: TransformType;
  label: string;
  description: string;
  icon: string;
  example: string;
  placeholder: string;
  help: string[];
}> = [
  {
    type: 'template',
    label: 'Template',
    description: 'Simple variable substitution',
    icon: '📝',
    example: 'Hello {{name}}, your order #{{orderId}} is ready!',
    placeholder: 'Enter template with {{variable}} placeholders...',
    help: [
      '{{variable}} - Insert value from state',
      '{{response}} - Previous agent response',
      '{{message}} - Original user message',
    ],
  },
  {
    type: 'jsonpath',
    label: 'JSONPath',
    description: 'Extract data from JSON',
    icon: '🔍',
    example: '$.data.items[0].name',
    placeholder: 'Enter JSONPath expression (e.g., $.data.items[*].name)',
    help: [
      '$ - Root object',
      '$.field - Access field',
      '$[0] - Array index',
      '$[*] - All array elements',
    ],
  },
  {
    type: 'jmespath',
    label: 'JMESPath',
    description: 'Query and transform JSON',
    icon: '🔎',
    example: 'data.items[*].{name: name, price: price}',
    placeholder: 'Enter JMESPath expression...',
    help: [
      'field.nested - Nested access',
      '[*].name - Project from array',
      '{a: x, b: y} - Reshape object',
    ],
  },
  {
    type: 'javascript',
    label: 'JavaScript',
    description: 'Custom code transformation',
    icon: '💻',
    example: 'return input.items.map(i => i.name).join(", ");',
    placeholder: 'return input.field; // Transform and return result',
    help: [
      'input - The input data object',
      'return value; - Return result',
      'Sandboxed execution',
    ],
  },
];

const COERCION_TYPES: readonly CoercionTargetType[] = [
  'string', 'number', 'boolean', 'array', 'object'
];

// ============================================
// Main Component
// ============================================

export interface TransformPanelProps {
  node: TransformNodeConfig;
  onChange: (node: TransformNodeConfig) => void;
}

/**
 * Simplified TransformPanel with clear guidance for each transform type.
 */
export function TransformPanel({ node, onChange }: TransformPanelProps) {
  const selectedOption = TRANSFORM_OPTIONS.find(o => o.type === node.transformType) || TRANSFORM_OPTIONS[0];
  
  const updateTransformType = useCallback((transformType: TransformType) => {
    const option = TRANSFORM_OPTIONS.find(o => o.type === transformType);
    onChange({ 
      ...node, 
      transformType,
      expression: option?.example || '',
    });
  }, [node, onChange]);
  
  const updateExpression = useCallback((expression: string) => {
    onChange({ ...node, expression });
  }, [node, onChange]);
  
  const updateTypeCoercion = useCallback((typeCoercion: TypeCoercion | undefined) => {
    if (typeCoercion === undefined) {
      const { typeCoercion: _, ...rest } = node;
      onChange(rest as TransformNodeConfig);
    } else {
      onChange({ ...node, typeCoercion });
    }
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  return (
    <div className="transform-panel">
      {/* Step 1: Choose Transform Type */}
      <div className="transform-panel-step">
        <div className="transform-panel-step-header">
          <span className="transform-panel-step-number">1</span>
          <span className="transform-panel-step-title">Choose Transform Type</span>
        </div>
        
        <div className="transform-type-grid">
          {TRANSFORM_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              className={`transform-type-card ${node.transformType === option.type ? 'selected' : ''}`}
              onClick={() => updateTransformType(option.type)}
            >
              <span className="transform-type-card-icon">{option.icon}</span>
              <span className="transform-type-card-label">{option.label}</span>
              <span className="transform-type-card-desc">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Step 2: Write Expression */}
      <div className="transform-panel-step">
        <div className="transform-panel-step-header">
          <span className="transform-panel-step-number">2</span>
          <span className="transform-panel-step-title">Write Your {selectedOption.label}</span>
        </div>
        
        {/* Quick Reference */}
        <div className="transform-quick-ref">
          <div className="transform-quick-ref-title">Quick Reference:</div>
          <div className="transform-quick-ref-items">
            {selectedOption.help.map((hint, i) => (
              <code key={i} className="transform-quick-ref-item">{hint}</code>
            ))}
          </div>
        </div>
        
        {/* Expression Input */}
        <div className="transform-expression-container">
          <textarea
            className="transform-expression-input"
            value={node.expression}
            onChange={(e) => updateExpression(e.target.value)}
            placeholder={selectedOption.placeholder}
            rows={selectedOption.type === 'javascript' ? 8 : 4}
            spellCheck={false}
          />
          
          {/* Example Button */}
          {node.expression !== selectedOption.example && (
            <button
              type="button"
              className="transform-example-btn"
              onClick={() => updateExpression(selectedOption.example)}
              title="Load example"
            >
              📋 Load Example
            </button>
          )}
        </div>
        
        {/* Input/Output Preview */}
        <div className="transform-preview">
          <div className="transform-preview-label">
            <span className="transform-preview-icon">💡</span>
            <span>Result will be stored in: <code>{node.mapping?.outputKey || 'result'}</code></span>
          </div>
        </div>
      </div>
      
      {/* Optional: Type Coercion */}
      <CollapsibleSection title="Advanced: Type Coercion" defaultOpen={false}>
        <TypeCoercionSection
          typeCoercion={node.typeCoercion}
          onChange={updateTypeCoercion}
        />
      </CollapsibleSection>
      
      {/* Standard Properties */}
      <StandardPropertiesPanel
        properties={node}
        onChange={updateStandardProperties}
        showIdentity
      />
    </div>
  );
}

// ============================================
// Type Coercion Section
// ============================================

interface TypeCoercionSectionProps {
  typeCoercion?: TypeCoercion;
  onChange: (typeCoercion: TypeCoercion | undefined) => void;
}

function TypeCoercionSection({ typeCoercion, onChange }: TypeCoercionSectionProps) {
  const [enabled, setEnabled] = useState(!!typeCoercion);
  
  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled) {
      onChange({ targetType: 'string' });
    } else {
      onChange(undefined);
    }
  };
  
  return (
    <div className="transform-coercion">
      <label className="transform-coercion-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
        />
        <span>Convert result to specific type</span>
      </label>
      
      {enabled && typeCoercion && (
        <select
          className="transform-coercion-select"
          value={typeCoercion.targetType}
          onChange={(e) => onChange({ targetType: e.target.value as CoercionTargetType })}
        >
          {COERCION_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default TransformPanel;
