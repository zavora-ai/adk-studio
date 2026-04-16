/**
 * StandardPropertiesPanel Component for ADK Studio
 * 
 * Provides a reusable panel for configuring standard properties shared by all action nodes.
 * Implements collapsible sections for:
 * - Error Handling (Requirement 1.2)
 * - Tracing & Observability (Requirement 1.3)
 * - Callbacks (Requirement 1.4)
 * - Execution Control (Requirement 1.5)
 * - Input/Output Mapping (Requirement 1.6)
 * 
 * @see Requirements 12.2: Properties panel for action node configuration
 */

import { useCallback } from 'react';
import { ACTION_NODE_TOOLTIPS } from '../Overlays/Tooltip';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  StandardProperties, 
  ErrorMode, 
  LogLevel,
  ErrorHandling,
  Tracing,
  Callbacks,
  ExecutionControl,
  InputOutputMapping,
} from '../../types/standardProperties';

// ============================================
// Helper Components
// ============================================

interface SelectProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  labels?: Record<T, string>;
}

/**
 * Generic select component
 */
function Select<T extends string>({ value, options, onChange, labels }: SelectProps<T>) {
  return (
    <select
      className="standard-props-select"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {labels?.[opt] ?? opt}
        </option>
      ))}
    </select>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/**
 * Number input component
 */
function NumberInput({ value, onChange, min, max, step = 1, placeholder }: NumberInputProps) {
  return (
    <input
      type="number"
      className="standard-props-input"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
    />
  );
}

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Text input component (single line or multiline)
 */
function TextInput({ value, onChange, placeholder, multiline = false }: TextInputProps) {
  if (multiline) {
    return (
      <textarea
        className="standard-props-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
    );
  }
  
  return (
    <input
      type="text"
      className="standard-props-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

/**
 * Toggle switch component
 */
function Toggle({ value, onChange, label }: ToggleProps) {
  return (
    <label className="standard-props-toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="standard-props-toggle-slider" />
      {label && <span className="standard-props-toggle-label">{label}</span>}
    </label>
  );
}

interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/**
 * Key-value pair editor for input mapping
 */
function KeyValueEditor({ 
  value, 
  onChange, 
  keyPlaceholder = 'State key',
  valuePlaceholder = 'Node input',
}: KeyValueEditorProps) {
  const entries = Object.entries(value);
  
  const handleAdd = () => {
    onChange({ ...value, '': '' });
  };
  
  const handleRemove = (key: string) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
  };
  
  const handleKeyChange = (oldKey: string, newKey: string) => {
    const newValue: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === oldKey) {
        newValue[newKey] = v;
      } else {
        newValue[k] = v;
      }
    }
    onChange(newValue);
  };
  
  const handleValueChange = (key: string, newVal: string) => {
    onChange({ ...value, [key]: newVal });
  };
  
  return (
    <div className="standard-props-kv-editor">
      {entries.map(([k, v], idx) => (
        <div key={idx} className="standard-props-kv-row">
          <input
            type="text"
            className="standard-props-kv-key"
            value={k}
            onChange={(e) => handleKeyChange(k, e.target.value)}
            placeholder={keyPlaceholder}
          />
          <span className="standard-props-kv-arrow">→</span>
          <input
            type="text"
            className="standard-props-kv-value"
            value={v}
            onChange={(e) => handleValueChange(k, e.target.value)}
            placeholder={valuePlaceholder}
          />
          <button
            type="button"
            className="standard-props-kv-remove"
            onClick={() => handleRemove(k)}
            title="Remove mapping"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="standard-props-kv-add"
        onClick={handleAdd}
      >
        + Add Mapping
      </button>
    </div>
  );
}

// ============================================
// Constants
// ============================================

const ERROR_MODES: readonly ErrorMode[] = ['stop', 'continue', 'retry', 'fallback'];
const ERROR_MODE_LABELS: Record<ErrorMode, string> = {
  stop: 'Stop on Error',
  continue: 'Continue on Error',
  retry: 'Retry on Error',
  fallback: 'Use Fallback Value',
};

const LOG_LEVELS: readonly LogLevel[] = ['none', 'error', 'info', 'debug'];
const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  none: 'None',
  error: 'Error Only',
  info: 'Info',
  debug: 'Debug (Verbose)',
};

// ============================================
// Main Component
// ============================================

export interface StandardPropertiesPanelProps {
  /** Current standard properties */
  properties: StandardProperties;
  /** Callback when properties change */
  onChange: (properties: StandardProperties) => void;
  /** Whether to show identity section (id, name, description) */
  showIdentity?: boolean;
}

/**
 * StandardPropertiesPanel provides a unified interface for configuring
 * standard properties shared by all action nodes.
 * 
 * @see Requirements 12.2: Properties panel for action node configuration
 */
export function StandardPropertiesPanel({ 
  properties, 
  onChange,
  showIdentity = false,
}: StandardPropertiesPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateErrorHandling = useCallback((updates: Partial<ErrorHandling>) => {
    onChange({
      ...properties,
      errorHandling: { ...properties.errorHandling, ...updates },
    });
  }, [properties, onChange]);
  
  const updateTracing = useCallback((updates: Partial<Tracing>) => {
    onChange({
      ...properties,
      tracing: { ...properties.tracing, ...updates },
    });
  }, [properties, onChange]);
  
  const updateCallbacks = useCallback((updates: Partial<Callbacks>) => {
    onChange({
      ...properties,
      callbacks: { ...properties.callbacks, ...updates },
    });
  }, [properties, onChange]);
  
  const updateExecution = useCallback((updates: Partial<ExecutionControl>) => {
    onChange({
      ...properties,
      execution: { ...properties.execution, ...updates },
    });
  }, [properties, onChange]);
  
  const updateMapping = useCallback((updates: Partial<InputOutputMapping>) => {
    onChange({
      ...properties,
      mapping: { ...properties.mapping, ...updates },
    });
  }, [properties, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="standard-properties-panel">
      {/* Identity Section (optional) */}
      {showIdentity && (
        <CollapsibleSection title="Identity" defaultOpen>
          <Field label="Name">
            <TextInput
              value={properties.name}
              onChange={(name) => onChange({ ...properties, name })}
              placeholder="Node name"
            />
          </Field>
          <Field label="Description" hint="optional">
            <TextInput
              value={properties.description || ''}
              onChange={(description) => onChange({ ...properties, description: description || undefined })}
              placeholder="What this node does"
              multiline
            />
          </Field>
        </CollapsibleSection>
      )}
      
      {/* Error Handling Section (Requirement 1.2) */}
      <CollapsibleSection title="Error Handling" defaultOpen={false}>
        <Field label="Error Mode" tooltip={ACTION_NODE_TOOLTIPS.errorHandling}>
          <Select
            value={properties.errorHandling.mode}
            options={ERROR_MODES}
            labels={ERROR_MODE_LABELS}
            onChange={(mode) => updateErrorHandling({ mode })}
          />
        </Field>
        
        {/* Retry-specific fields */}
        {properties.errorHandling.mode === 'retry' && (
          <>
            <Field label="Retry Count" hint="1-10">
              <NumberInput
                value={properties.errorHandling.retryCount ?? 3}
                onChange={(retryCount) => updateErrorHandling({ retryCount })}
                min={1}
                max={10}
              />
            </Field>
            <Field label="Retry Delay" hint="ms">
              <NumberInput
                value={properties.errorHandling.retryDelay ?? 1000}
                onChange={(retryDelay) => updateErrorHandling({ retryDelay })}
                min={0}
                step={100}
              />
            </Field>
          </>
        )}
        
        {/* Fallback-specific fields */}
        {properties.errorHandling.mode === 'fallback' && (
          <Field label="Fallback Value" hint="JSON">
            <TextInput
              value={
                properties.errorHandling.fallbackValue !== undefined
                  ? JSON.stringify(properties.errorHandling.fallbackValue)
                  : ''
              }
              onChange={(val) => {
                try {
                  const parsed = val ? JSON.parse(val) : undefined;
                  updateErrorHandling({ fallbackValue: parsed });
                } catch {
                  // Keep as string if not valid JSON
                  updateErrorHandling({ fallbackValue: val || undefined });
                }
              }}
              placeholder='{"default": "value"}'
              multiline
            />
          </Field>
        )}
      </CollapsibleSection>
      
      {/* Tracing Section (Requirement 1.3) */}
      <CollapsibleSection title="Tracing & Logging" defaultOpen={false}>
        <Field label="Enable Tracing" tooltip={ACTION_NODE_TOOLTIPS.tracing}>
          <Toggle
            value={properties.tracing.enabled}
            onChange={(enabled) => updateTracing({ enabled })}
          />
        </Field>
        <Field label="Log Level">
          <Select
            value={properties.tracing.logLevel}
            options={LOG_LEVELS}
            labels={LOG_LEVEL_LABELS}
            onChange={(logLevel) => updateTracing({ logLevel })}
          />
        </Field>
      </CollapsibleSection>
      
      {/* Callbacks Section (Requirement 1.4) */}
      <CollapsibleSection title="Callbacks" defaultOpen={false}>
        <Field label="onStart" hint="function name or code" tooltip={ACTION_NODE_TOOLTIPS.callbacks}>
          <TextInput
            value={properties.callbacks.onStart || ''}
            onChange={(onStart) => updateCallbacks({ onStart: onStart || undefined })}
            placeholder="handleStart"
          />
        </Field>
        <Field label="onComplete" hint="function name or code">
          <TextInput
            value={properties.callbacks.onComplete || ''}
            onChange={(onComplete) => updateCallbacks({ onComplete: onComplete || undefined })}
            placeholder="handleComplete"
          />
        </Field>
        <Field label="onError" hint="function name or code">
          <TextInput
            value={properties.callbacks.onError || ''}
            onChange={(onError) => updateCallbacks({ onError: onError || undefined })}
            placeholder="handleError"
          />
        </Field>
      </CollapsibleSection>
      
      {/* Execution Control Section (Requirement 1.5) */}
      <CollapsibleSection title="Execution Control" defaultOpen={false}>
        <Field label="Timeout" hint="ms" tooltip={ACTION_NODE_TOOLTIPS.executionControl}>
          <NumberInput
            value={properties.execution.timeout}
            onChange={(timeout) => updateExecution({ timeout })}
            min={0}
            step={1000}
          />
        </Field>
        <Field label="Skip Condition" hint="expression">
          <TextInput
            value={properties.execution.condition || ''}
            onChange={(condition) => updateExecution({ condition: condition || undefined })}
            placeholder="state.shouldRun === true"
          />
        </Field>
      </CollapsibleSection>
      
      {/* Input/Output Mapping Section (Requirement 1.6) */}
      <CollapsibleSection title="Input/Output Mapping" defaultOpen>
        <Field label="Input Mapping" hint="state → node" tooltip={ACTION_NODE_TOOLTIPS.inputOutputMapping}>
          <KeyValueEditor
            value={properties.mapping.inputMapping || {}}
            onChange={(inputMapping) => updateMapping({ inputMapping })}
            keyPlaceholder="state.field"
            valuePlaceholder="nodeInput"
          />
        </Field>
        <Field label="Output Key" hint="where to store result">
          <TextInput
            value={properties.mapping.outputKey}
            onChange={(outputKey) => updateMapping({ outputKey })}
            placeholder="result"
          />
        </Field>
      </CollapsibleSection>
    </div>
  );
}

export default StandardPropertiesPanel;
