/**
 * SetPanel Component for ADK Studio
 * 
 * Properties panel for configuring Set action nodes.
 * Provides UI for variable definition, mode selection, and environment variable loading.
 * 
 * Requirements: 4.1, 4.2, 4.3, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  SetNodeConfig, 
  SetMode,
  Variable,
  VariableValueType,
  EnvVarsConfig,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/setPanel.css';

// ============================================
// Constants
// ============================================

const SET_MODES: readonly SetMode[] = ['set', 'merge', 'delete'];

const SET_MODE_CONFIG: Record<SetMode, { label: string; description: string; icon: string }> = {
  set: { 
    label: 'Set', 
    description: 'Create or overwrite variables',
    icon: '✏️',
  },
  merge: { 
    label: 'Merge', 
    description: 'Deep merge with existing values',
    icon: '🔀',
  },
  delete: { 
    label: 'Delete', 
    description: 'Remove variables from state',
    icon: '🗑️',
  },
};

const VALUE_TYPES: readonly VariableValueType[] = ['string', 'number', 'boolean', 'json', 'expression'];

const VALUE_TYPE_LABELS: Record<VariableValueType, string> = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  json: 'JSON',
  expression: 'Expression',
};

const VALUE_TYPE_PLACEHOLDERS: Record<VariableValueType, string> = {
  string: 'Enter text value',
  number: '0',
  boolean: 'true or false',
  json: '{"key": "value"}',
  expression: '{{input.field}}',
};

// ============================================
// Main Component
// ============================================

export interface SetPanelProps {
  /** Current Set node configuration */
  node: SetNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: SetNodeConfig) => void;
}

/**
 * SetPanel provides configuration UI for Set action nodes.
 * 
 * Features:
 * - Mode selector (set/merge/delete) (Requirement 4.2)
 * - Variable list editor with key-value pairs (Requirement 4.1)
 * - Value type selection (string, number, boolean, JSON, expression)
 * - Secret variable toggle (masked in logs)
 * - Environment variable loading configuration (Requirement 4.3)
 * - Standard properties panel integration
 * 
 * @see Requirements 4.1, 4.2, 4.3, 12.2
 */
export function SetPanel({ node, onChange }: SetPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateMode = useCallback((mode: SetMode) => {
    onChange({ ...node, mode });
  }, [node, onChange]);
  
  const updateVariables = useCallback((variables: Variable[]) => {
    onChange({ ...node, variables });
  }, [node, onChange]);
  
  const updateEnvVars = useCallback((updates: Partial<EnvVarsConfig> | null) => {
    if (updates === null) {
      const { envVars: _, ...rest } = node;
      onChange(rest as SetNodeConfig);
    } else {
      onChange({
        ...node,
        envVars: { ...node.envVars, ...updates } as EnvVarsConfig,
      });
    }
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="set-panel">
      {/* Mode Selection (Requirement 4.2) */}
      <CollapsibleSection title="Operation Mode" defaultOpen>
        <div className="set-mode-selector">
          {SET_MODES.map((mode) => {
            const config = SET_MODE_CONFIG[mode];
            return (
              <button
                key={mode}
                type="button"
                className={`set-mode-option ${node.mode === mode ? 'selected' : ''}`}
                onClick={() => updateMode(mode)}
              >
                <span className="set-mode-icon">{config.icon}</span>
                <span className="set-mode-label">{config.label}</span>
                <span className="set-mode-description">{config.description}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
      
      {/* Variables Section (Requirement 4.1) */}
      <CollapsibleSection title="Variables" defaultOpen>
        <VariableListEditor 
          variables={node.variables || []} 
          onChange={updateVariables}
          mode={node.mode}
        />
      </CollapsibleSection>
      
      {/* Environment Variables Section (Requirement 4.3) */}
      <EnvVarsSection 
        envVars={node.envVars} 
        onChange={updateEnvVars} 
      />
      
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
// Variable List Editor Component
// ============================================

interface VariableListEditorProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
  mode: SetMode;
}

/**
 * Variable list editor with add/remove/edit functionality.
 * @see Requirement 4.1
 */
function VariableListEditor({ variables, onChange, mode }: VariableListEditorProps) {
  
  const handleAdd = () => {
    const newVar: Variable = {
      key: '',
      value: '',
      valueType: 'string',
      isSecret: false,
    };
    onChange([...variables, newVar]);
  };
  
  const handleRemove = (index: number) => {
    const newVars = [...variables];
    newVars.splice(index, 1);
    onChange(newVars);
  };
  
  const handleUpdate = (index: number, updates: Partial<Variable>) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], ...updates };
    onChange(newVars);
  };
  
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newVars = [...variables];
    [newVars[index - 1], newVars[index]] = [newVars[index], newVars[index - 1]];
    onChange(newVars);
  };
  
  const handleMoveDown = (index: number) => {
    if (index === variables.length - 1) return;
    const newVars = [...variables];
    [newVars[index], newVars[index + 1]] = [newVars[index + 1], newVars[index]];
    onChange(newVars);
  };
  
  return (
    <div className="set-panel-var-editor">
      {variables.length === 0 ? (
        <div className="set-panel-empty">
          <span className="set-panel-empty-icon">📝</span>
          <span className="set-panel-empty-text">No variables defined</span>
          <span className="set-panel-empty-hint">Click "Add Variable" to create one</span>
        </div>
      ) : (
        <div className="set-panel-var-list">
          {variables.map((variable, index) => (
            <VariableRow
              key={index}
              variable={variable}
              index={index}
              total={variables.length}
              mode={mode}
              onUpdate={(updates) => handleUpdate(index, updates)}
              onRemove={() => handleRemove(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}
        </div>
      )}
      
      <button
        type="button"
        className="set-panel-var-add"
        onClick={handleAdd}
      >
        + Add Variable
      </button>
    </div>
  );
}

// ============================================
// Variable Row Component
// ============================================

interface VariableRowProps {
  variable: Variable;
  index: number;
  total: number;
  mode: SetMode;
  onUpdate: (updates: Partial<Variable>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * Single variable row with key, value, type, and secret toggle.
 */
function VariableRow({ 
  variable, 
  index, 
  total, 
  mode, 
  onUpdate, 
  onRemove,
  onMoveUp,
  onMoveDown,
}: VariableRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  const handleValueChange = (value: string) => {
    // Validate JSON if type is json
    if (variable.valueType === 'json') {
      try {
        if (value.trim()) {
          JSON.parse(value);
        }
        setJsonError(null);
      } catch {
        setJsonError('Invalid JSON');
      }
    }
    onUpdate({ value });
  };
  
  const handleTypeChange = (valueType: VariableValueType) => {
    // Convert value when type changes
    let newValue: string | number | boolean | object = variable.value;
    
    if (valueType === 'number') {
      newValue = Number(variable.value) || 0;
    } else if (valueType === 'boolean') {
      newValue = variable.value === 'true' || variable.value === true;
    } else if (valueType === 'json') {
      try {
        newValue = typeof variable.value === 'string' 
          ? JSON.parse(variable.value) 
          : variable.value;
      } catch {
        newValue = {};
      }
    } else {
      newValue = String(variable.value);
    }
    
    onUpdate({ valueType, value: newValue });
    setJsonError(null);
  };
  
  // For delete mode, only show key
  const showValue = mode !== 'delete';
  
  return (
    <div className={`set-panel-var-row ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="set-panel-var-header">
        <button
          type="button"
          className="set-panel-var-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        
        <input
          type="text"
          className="set-panel-var-key"
          value={variable.key}
          onChange={(e) => onUpdate({ key: e.target.value })}
          placeholder="Variable name"
        />
        
        {variable.isSecret && (
          <span className="set-panel-var-secret-badge" title="Secret variable">
            🔒
          </span>
        )}
        
        <div className="set-panel-var-actions">
          <button
            type="button"
            className="set-panel-var-action"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="set-panel-var-action"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            className="set-panel-var-remove"
            onClick={onRemove}
            title="Remove variable"
          >
            ×
          </button>
        </div>
      </div>
      
      {isExpanded && showValue && (
        <div className="set-panel-var-body">
          <div className="set-panel-var-type-row">
            <label className="set-panel-var-type-label">Type:</label>
            <select
              className="set-panel-var-type-select"
              value={variable.valueType}
              onChange={(e) => handleTypeChange(e.target.value as VariableValueType)}
            >
              {VALUE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {VALUE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            
            <label className="set-panel-var-secret-toggle">
              <input
                type="checkbox"
                checked={variable.isSecret}
                onChange={(e) => onUpdate({ isSecret: e.target.checked })}
              />
              <span className="set-panel-var-secret-label">Secret</span>
            </label>
          </div>
          
          <div className="set-panel-var-value-row">
            {variable.valueType === 'boolean' ? (
              <select
                className="set-panel-var-value-select"
                value={String(variable.value)}
                onChange={(e) => onUpdate({ value: e.target.value === 'true' })}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : variable.valueType === 'json' ? (
              <div className="set-panel-var-json-wrapper">
                <textarea
                  className={`set-panel-var-value-textarea ${jsonError ? 'error' : ''}`}
                  value={typeof variable.value === 'object' 
                    ? JSON.stringify(variable.value, null, 2) 
                    : String(variable.value)}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder={VALUE_TYPE_PLACEHOLDERS[variable.valueType]}
                  rows={4}
                />
                {jsonError && (
                  <span className="set-panel-var-error">{jsonError}</span>
                )}
              </div>
            ) : (
              <input
                type={variable.valueType === 'number' ? 'number' : 'text'}
                className="set-panel-var-value-input"
                value={String(variable.value)}
                onChange={(e) => handleValueChange(
                  variable.valueType === 'number' 
                    ? e.target.value 
                    : e.target.value
                )}
                placeholder={VALUE_TYPE_PLACEHOLDERS[variable.valueType]}
              />
            )}
          </div>
          
          {variable.valueType === 'expression' && (
            <div className="set-panel-var-hint">
              Use <code>{'{{variable}}'}</code> syntax to reference state values
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Environment Variables Section Component
// ============================================

interface EnvVarsSectionProps {
  envVars?: EnvVarsConfig;
  onChange: (updates: Partial<EnvVarsConfig> | null) => void;
}

/**
 * Environment variable loading configuration section.
 * @see Requirement 4.3
 */
function EnvVarsSection({ envVars, onChange }: EnvVarsSectionProps) {
  const [enabled, setEnabled] = useState(envVars?.loadFromEnv ?? false);
  
  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled) {
      onChange({ loadFromEnv: true });
    } else {
      onChange(null);
    }
  };
  
  return (
    <CollapsibleSection title="Environment Variables" defaultOpen={false}>
      <Field label="Load from .env">
        <label className="set-panel-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <span className="set-panel-toggle-slider" />
          <span className="set-panel-toggle-label">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Field>
      
      {enabled && (
        <>
          <Field label="Prefix Filter" hint="optional">
            <input
              type="text"
              className="set-panel-input"
              value={envVars?.prefix || ''}
              onChange={(e) => onChange({ prefix: e.target.value || undefined })}
              placeholder="e.g., APP_, API_"
            />
            <div className="set-panel-field-help">
              Only load environment variables starting with this prefix.
              Leave empty to load all variables.
            </div>
          </Field>
          
          <div className="set-panel-info">
            <span className="set-panel-info-icon">ℹ️</span>
            <span className="set-panel-info-text">
              Environment variables will be loaded at runtime from the .env file.
              They will be available in the workflow state under their original names.
            </span>
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}

export default SetPanel;
