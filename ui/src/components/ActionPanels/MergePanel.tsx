/**
 * MergePanel Component for ADK Studio
 * 
 * Properties panel for configuring Merge action nodes.
 * Provides UI for merge mode selection, combine strategy,
 * branch keys configuration, and timeout handling.
 * 
 * Requirements: 8.1, 8.2, 8.3, 12.2
 */

import { useCallback } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  MergeNodeConfig, 
  MergeMode,
  CombineStrategy,
  TimeoutBehavior,
  MergeTimeout,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/mergePanel.css';

// ============================================
// Constants
// ============================================

const MERGE_MODES: readonly MergeMode[] = ['wait_all', 'wait_any', 'wait_n'];

const MERGE_MODE_CONFIG: Record<MergeMode, {
  label: string;
  description: string;
  icon: string;
}> = {
  wait_all: {
    label: 'Wait All',
    description: 'Wait for all incoming branches to complete',
    icon: '⏳',
  },
  wait_any: {
    label: 'Wait Any',
    description: 'Continue when first branch completes',
    icon: '⚡',
  },
  wait_n: {
    label: 'Wait N',
    description: 'Wait for N branches to complete',
    icon: '🔢',
  },
};

const COMBINE_STRATEGIES: readonly CombineStrategy[] = ['array', 'object', 'first', 'last'];

const COMBINE_STRATEGY_CONFIG: Record<CombineStrategy, {
  label: string;
  description: string;
  icon: string;
}> = {
  array: {
    label: 'Array',
    description: 'Collect outputs into an array',
    icon: '📋',
  },
  object: {
    label: 'Object',
    description: 'Merge into object with branch keys',
    icon: '📦',
  },
  first: {
    label: 'First',
    description: 'Use first completed branch output',
    icon: '1️⃣',
  },
  last: {
    label: 'Last',
    description: 'Use last completed branch output',
    icon: '🔚',
  },
};

const TIMEOUT_BEHAVIORS: readonly TimeoutBehavior[] = ['continue', 'error'];

const TIMEOUT_BEHAVIOR_LABELS: Record<TimeoutBehavior, string> = {
  continue: 'Continue with available results',
  error: 'Throw error on timeout',
};

// ============================================
// Main Component
// ============================================

export interface MergePanelProps {
  /** Current Merge node configuration */
  node: MergeNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: MergeNodeConfig) => void;
}

/**
 * MergePanel provides configuration UI for Merge action nodes.
 * 
 * Features:
 * - Merge mode selector (wait_all/wait_any/wait_n) (Requirement 8.1)
 * - Wait count configuration for wait_n mode (Requirement 8.1)
 * - Combine strategy selector (Requirement 8.2)
 * - Branch keys editor for object strategy (Requirement 8.2)
 * - Timeout configuration (Requirement 8.3)
 * - Standard properties panel integration
 * 
 * @see Requirements 8.1, 8.2, 8.3, 12.2
 */
export function MergePanel({ node, onChange }: MergePanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateMode = useCallback((mode: MergeMode) => {
    const updates: Partial<MergeNodeConfig> = { mode };
    
    // Initialize waitCount for wait_n mode
    if (mode === 'wait_n' && !node.waitCount) {
      updates.waitCount = 2;
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateWaitCount = useCallback((waitCount: number) => {
    onChange({ ...node, waitCount });
  }, [node, onChange]);
  
  const updateCombineStrategy = useCallback((combineStrategy: CombineStrategy) => {
    const updates: Partial<MergeNodeConfig> = { combineStrategy };
    
    // Initialize branchKeys for object strategy
    if (combineStrategy === 'object' && (!node.branchKeys || node.branchKeys.length === 0)) {
      updates.branchKeys = ['branch1', 'branch2'];
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateBranchKeys = useCallback((branchKeys: string[]) => {
    onChange({ ...node, branchKeys });
  }, [node, onChange]);
  
  const updateTimeout = useCallback((updates: Partial<MergeTimeout>) => {
    onChange({
      ...node,
      timeout: { ...node.timeout, ...updates },
    });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="merge-panel">
      {/* Merge Mode Section (Requirement 8.1) */}
      <CollapsibleSection title="Merge Mode" defaultOpen>
        <MergeModeSection
          mode={node.mode}
          waitCount={node.waitCount}
          onChange={updateMode}
          onWaitCountChange={updateWaitCount}
        />
      </CollapsibleSection>
      
      {/* Combine Strategy Section (Requirement 8.2) */}
      <CollapsibleSection title="Combine Strategy" defaultOpen>
        <CombineStrategySection
          strategy={node.combineStrategy}
          branchKeys={node.branchKeys}
          onChange={updateCombineStrategy}
          onBranchKeysChange={updateBranchKeys}
        />
      </CollapsibleSection>
      
      {/* Timeout Handling Section (Requirement 8.3) */}
      <CollapsibleSection title="Timeout Handling" defaultOpen={false}>
        <TimeoutSection
          timeout={node.timeout}
          onChange={updateTimeout}
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
// Merge Mode Section Component
// ============================================

interface MergeModeSectionProps {
  mode: MergeMode;
  waitCount?: number;
  onChange: (mode: MergeMode) => void;
  onWaitCountChange: (count: number) => void;
}

/**
 * Merge mode selector section.
 * @see Requirement 8.1
 */
function MergeModeSection({ mode, waitCount, onChange, onWaitCountChange }: MergeModeSectionProps) {
  return (
    <div className="merge-mode-section">
      <div className="merge-mode-selector">
        {MERGE_MODES.map((m) => {
          const config = MERGE_MODE_CONFIG[m];
          return (
            <button
              key={m}
              type="button"
              className={`merge-mode-option ${mode === m ? 'selected' : ''}`}
              onClick={() => onChange(m)}
            >
              <span className="merge-mode-icon">{config.icon}</span>
              <span className="merge-mode-label">{config.label}</span>
              <span className="merge-mode-description">{config.description}</span>
            </button>
          );
        })}
      </div>
      
      {/* Wait Count for wait_n mode */}
      {mode === 'wait_n' && (
        <div className="merge-wait-count">
          <Field label="Wait Count" required hint="number of branches">
            <input
              type="number"
              className="merge-panel-input"
              value={waitCount ?? 2}
              onChange={(e) => onWaitCountChange(parseInt(e.target.value, 10) || 2)}
              min={1}
              max={100}
            />
            <div className="merge-panel-field-help">
              Number of branches that must complete before continuing.
            </div>
          </Field>
        </div>
      )}
      
      {/* Mode-specific info */}
      <div className="merge-panel-info">
        <span className="merge-panel-info-icon">ℹ️</span>
        <span className="merge-panel-info-text">
          {mode === 'wait_all' && 'All incoming branches must complete before the workflow continues.'}
          {mode === 'wait_any' && 'The workflow continues as soon as any branch completes. Other branches may still be running.'}
          {mode === 'wait_n' && `The workflow continues after ${waitCount || 2} branches complete.`}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Combine Strategy Section Component
// ============================================

interface CombineStrategySectionProps {
  strategy: CombineStrategy;
  branchKeys?: string[];
  onChange: (strategy: CombineStrategy) => void;
  onBranchKeysChange: (keys: string[]) => void;
}

/**
 * Combine strategy selector section.
 * @see Requirement 8.2
 */
function CombineStrategySection({ 
  strategy, 
  branchKeys, 
  onChange, 
  onBranchKeysChange 
}: CombineStrategySectionProps) {
  return (
    <div className="merge-strategy-section">
      <div className="merge-strategy-selector">
        {COMBINE_STRATEGIES.map((s) => {
          const config = COMBINE_STRATEGY_CONFIG[s];
          return (
            <button
              key={s}
              type="button"
              className={`merge-strategy-option ${strategy === s ? 'selected' : ''}`}
              onClick={() => onChange(s)}
            >
              <span className="merge-strategy-icon">{config.icon}</span>
              <span className="merge-strategy-label">{config.label}</span>
              <span className="merge-strategy-description">{config.description}</span>
            </button>
          );
        })}
      </div>
      
      {/* Branch Keys for object strategy */}
      {strategy === 'object' && (
        <div className="merge-branch-keys">
          <Field label="Branch Keys" hint="keys for merged object">
            <BranchKeysEditor
              keys={branchKeys || []}
              onChange={onBranchKeysChange}
            />
          </Field>
          <div className="merge-panel-field-help">
            Each branch output will be stored under its corresponding key in the merged object.
          </div>
        </div>
      )}
      
      {/* Strategy-specific info */}
      <div className="merge-panel-info">
        <span className="merge-panel-info-icon">📤</span>
        <span className="merge-panel-info-text">
          {strategy === 'array' && 'Branch outputs are collected into an array in completion order.'}
          {strategy === 'object' && 'Branch outputs are merged into an object using the specified keys.'}
          {strategy === 'first' && 'Only the first completed branch output is used.'}
          {strategy === 'last' && 'Only the last completed branch output is used.'}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Branch Keys Editor Component
// ============================================

interface BranchKeysEditorProps {
  keys: string[];
  onChange: (keys: string[]) => void;
}

/**
 * Editor for branch keys used in object combine strategy.
 */
function BranchKeysEditor({ keys, onChange }: BranchKeysEditorProps) {
  const handleAdd = () => {
    onChange([...keys, `branch${keys.length + 1}`]);
  };
  
  const handleRemove = (index: number) => {
    const newKeys = [...keys];
    newKeys.splice(index, 1);
    onChange(newKeys);
  };
  
  const handleUpdate = (index: number, value: string) => {
    const newKeys = [...keys];
    newKeys[index] = value;
    onChange(newKeys);
  };
  
  return (
    <div className="merge-branch-keys-editor">
      {keys.length === 0 ? (
        <div className="merge-panel-empty">
          <span className="merge-panel-empty-text">No branch keys defined</span>
        </div>
      ) : (
        <div className="merge-branch-keys-list">
          {keys.map((key, index) => (
            <div key={index} className="merge-branch-key-row">
              <span className="merge-branch-key-index">#{index + 1}</span>
              <input
                type="text"
                className="merge-panel-input merge-panel-input-mono"
                value={key}
                onChange={(e) => handleUpdate(index, e.target.value)}
                placeholder={`branch${index + 1}`}
              />
              <button
                type="button"
                className="merge-branch-key-remove"
                onClick={() => handleRemove(index)}
                title="Remove key"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button
        type="button"
        className="merge-branch-key-add"
        onClick={handleAdd}
      >
        + Add Branch Key
      </button>
    </div>
  );
}

// ============================================
// Timeout Section Component
// ============================================

interface TimeoutSectionProps {
  timeout: MergeTimeout;
  onChange: (updates: Partial<MergeTimeout>) => void;
}

/**
 * Timeout handling configuration section.
 * @see Requirement 8.3
 */
function TimeoutSection({ timeout, onChange }: TimeoutSectionProps) {
  return (
    <div className="merge-timeout-section">
      <Field label="Enable Timeout">
        <label className="merge-panel-toggle">
          <input
            type="checkbox"
            checked={timeout.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <span className="merge-panel-toggle-slider" />
          <span className="merge-panel-toggle-label">
            {timeout.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Field>
      
      {timeout.enabled && (
        <>
          <Field label="Timeout Duration" required hint="milliseconds">
            <input
              type="number"
              className="merge-panel-input"
              value={timeout.ms}
              onChange={(e) => onChange({ ms: parseInt(e.target.value, 10) || 30000 })}
              min={0}
              step={1000}
              placeholder="30000"
            />
            <div className="merge-panel-field-help">
              Maximum time to wait for branches to complete.
            </div>
          </Field>
          
          <Field label="Timeout Behavior" required>
            <select
              className="merge-panel-select"
              value={timeout.behavior}
              onChange={(e) => onChange({ behavior: e.target.value as TimeoutBehavior })}
            >
              {TIMEOUT_BEHAVIORS.map((b) => (
                <option key={b} value={b}>
                  {TIMEOUT_BEHAVIOR_LABELS[b]}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
      
      <div className="merge-panel-info merge-panel-info-warning">
        <span className="merge-panel-info-icon">⚠️</span>
        <span className="merge-panel-info-text">
          {timeout.enabled 
            ? timeout.behavior === 'continue'
              ? 'If timeout occurs, the merge will continue with whatever results are available.'
              : 'If timeout occurs, the workflow will fail with a timeout error.'
            : 'Without a timeout, the merge will wait indefinitely for all required branches.'}
        </span>
      </div>
    </div>
  );
}

export default MergePanel;
