/**
 * LoopPanel Component for ADK Studio
 * 
 * Properties panel for configuring Loop action nodes.
 * Provides UI for loop type selection, forEach/while/times configuration,
 * parallel execution settings, and result aggregation.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  LoopNodeConfig, 
  LoopType,
  ForEachConfig,
  WhileConfig,
  TimesConfig,
  ParallelConfig,
  ResultsConfig,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/loopPanel.css';

// ============================================
// Constants
// ============================================

const LOOP_TYPES: readonly LoopType[] = ['forEach', 'while', 'times'];

const LOOP_TYPE_CONFIG: Record<LoopType, {
  label: string;
  description: string;
  icon: string;
}> = {
  forEach: {
    label: 'For Each',
    description: 'Iterate over each item in an array',
    icon: '📋',
  },
  while: {
    label: 'While',
    description: 'Loop while a condition is true',
    icon: '🔁',
  },
  times: {
    label: 'Times',
    description: 'Repeat a fixed number of times',
    icon: '🔢',
  },
};

// ============================================
// Main Component
// ============================================

export interface LoopPanelProps {
  /** Current Loop node configuration */
  node: LoopNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: LoopNodeConfig) => void;
}

/**
 * LoopPanel provides configuration UI for Loop action nodes.
 * 
 * Features:
 * - Loop type selector (forEach/while/times) (Requirement 7.1)
 * - forEach configuration: source array, item/index variables (Requirement 7.2)
 * - while configuration: condition expression
 * - times configuration: iteration count
 * - Parallel execution settings (Requirement 7.3)
 * - Result aggregation settings (Requirement 7.4)
 * - Standard properties panel integration
 * 
 * @see Requirements 7.1, 7.2, 7.3, 7.4, 12.2
 */
export function LoopPanel({ node, onChange }: LoopPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateLoopType = useCallback((loopType: LoopType) => {
    // Reset type-specific config when changing loop type
    const updates: Partial<LoopNodeConfig> = { loopType };
    
    // Initialize default config for the new type
    if (loopType === 'forEach' && !node.forEach) {
      updates.forEach = {
        sourceArray: '',
        itemVar: 'item',
        indexVar: 'index',
      };
    } else if (loopType === 'while' && !node.while) {
      updates.while = {
        condition: '',
      };
    } else if (loopType === 'times' && !node.times) {
      updates.times = {
        count: 10,
      };
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateForEach = useCallback((updates: Partial<ForEachConfig>) => {
    onChange({
      ...node,
      forEach: { ...node.forEach!, ...updates },
    });
  }, [node, onChange]);
  
  const updateWhile = useCallback((updates: Partial<WhileConfig>) => {
    onChange({
      ...node,
      while: { ...node.while!, ...updates },
    });
  }, [node, onChange]);
  
  const updateTimes = useCallback((updates: Partial<TimesConfig>) => {
    onChange({
      ...node,
      times: { ...node.times!, ...updates },
    });
  }, [node, onChange]);
  
  const updateParallel = useCallback((updates: Partial<ParallelConfig>) => {
    onChange({
      ...node,
      parallel: { ...node.parallel, ...updates },
    });
  }, [node, onChange]);
  
  const updateResults = useCallback((updates: Partial<ResultsConfig>) => {
    onChange({
      ...node,
      results: { ...node.results, ...updates },
    });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="loop-panel">
      {/* Loop Type Section (Requirement 7.1) */}
      <CollapsibleSection title="Loop Type" defaultOpen>
        <LoopTypeSection
          loopType={node.loopType}
          onChange={updateLoopType}
        />
      </CollapsibleSection>
      
      {/* ForEach Configuration (Requirement 7.2) */}
      {node.loopType === 'forEach' && (
        <CollapsibleSection title="ForEach Configuration" defaultOpen>
          <ForEachSection
            config={node.forEach || { sourceArray: '', itemVar: 'item', indexVar: 'index' }}
            onChange={updateForEach}
          />
        </CollapsibleSection>
      )}
      
      {/* While Configuration */}
      {node.loopType === 'while' && (
        <CollapsibleSection title="While Configuration" defaultOpen>
          <WhileSection
            config={node.while || { condition: '' }}
            onChange={updateWhile}
          />
        </CollapsibleSection>
      )}
      
      {/* Times Configuration */}
      {node.loopType === 'times' && (
        <CollapsibleSection title="Times Configuration" defaultOpen>
          <TimesSection
            config={node.times || { count: 10 }}
            onChange={updateTimes}
          />
        </CollapsibleSection>
      )}
      
      {/* Parallel Execution (Requirement 7.3) */}
      <CollapsibleSection title="Parallel Execution" defaultOpen={false}>
        <ParallelSection
          config={node.parallel}
          onChange={updateParallel}
        />
      </CollapsibleSection>
      
      {/* Result Aggregation (Requirement 7.4) */}
      <CollapsibleSection title="Result Aggregation" defaultOpen={false}>
        <ResultsSection
          config={node.results}
          onChange={updateResults}
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
// Loop Type Section Component
// ============================================

interface LoopTypeSectionProps {
  loopType: LoopType;
  onChange: (loopType: LoopType) => void;
}

/**
 * Loop type selector section.
 * @see Requirement 7.1
 */
function LoopTypeSection({ loopType, onChange }: LoopTypeSectionProps) {
  return (
    <div className="loop-type-selector">
      {LOOP_TYPES.map((type) => {
        const config = LOOP_TYPE_CONFIG[type];
        return (
          <button
            key={type}
            type="button"
            className={`loop-type-option ${loopType === type ? 'selected' : ''}`}
            onClick={() => onChange(type)}
          >
            <span className="loop-type-icon">{config.icon}</span>
            <span className="loop-type-label">{config.label}</span>
            <span className="loop-type-description">{config.description}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// ForEach Section Component
// ============================================

interface ForEachSectionProps {
  config: ForEachConfig;
  onChange: (updates: Partial<ForEachConfig>) => void;
}

/**
 * ForEach loop configuration section.
 * @see Requirement 7.2
 */
function ForEachSection({ config, onChange }: ForEachSectionProps) {
  return (
    <div className="loop-foreach-section">
      <Field label="Source Array" required hint="state path to array">
        <input
          type="text"
          className="loop-panel-input loop-panel-input-mono"
          value={config.sourceArray}
          onChange={(e) => onChange({ sourceArray: e.target.value })}
          placeholder="state.items"
        />
        <div className="loop-panel-field-help">
          Path to the array in workflow state to iterate over.
        </div>
      </Field>
      
      <div className="loop-foreach-vars">
        <Field label="Item Variable" hint="default: item">
          <input
            type="text"
            className="loop-panel-input loop-panel-input-mono"
            value={config.itemVar}
            onChange={(e) => onChange({ itemVar: e.target.value || 'item' })}
            placeholder="item"
          />
        </Field>
        
        <Field label="Index Variable" hint="default: index">
          <input
            type="text"
            className="loop-panel-input loop-panel-input-mono"
            value={config.indexVar}
            onChange={(e) => onChange({ indexVar: e.target.value || 'index' })}
            placeholder="index"
          />
        </Field>
      </div>
      
      <div className="loop-panel-info">
        <span className="loop-panel-info-icon">ℹ️</span>
        <span className="loop-panel-info-text">
          Inside the loop body, access the current item as <code>{config.itemVar || 'item'}</code> and 
          the current index as <code>{config.indexVar || 'index'}</code>.
        </span>
      </div>
    </div>
  );
}

// ============================================
// While Section Component
// ============================================

interface WhileSectionProps {
  config: WhileConfig;
  onChange: (updates: Partial<WhileConfig>) => void;
}

/**
 * While loop configuration section.
 */
function WhileSection({ config, onChange }: WhileSectionProps) {
  return (
    <div className="loop-while-section">
      <Field label="Condition" required hint="JavaScript expression">
        <textarea
          className="loop-panel-expression"
          value={config.condition}
          onChange={(e) => onChange({ condition: e.target.value })}
          placeholder={`// Loop while this expression is true
// Available: state (workflow state)

state.counter < 10`}
          rows={6}
          spellCheck={false}
        />
      </Field>
      
      <div className="loop-panel-info loop-panel-info-warning">
        <span className="loop-panel-info-icon">⚠️</span>
        <span className="loop-panel-info-text">
          Ensure your condition eventually becomes false to avoid infinite loops.
          Consider using a maximum iteration limit in the execution control settings.
        </span>
      </div>
    </div>
  );
}

// ============================================
// Times Section Component
// ============================================

interface TimesSectionProps {
  config: TimesConfig;
  onChange: (updates: Partial<TimesConfig>) => void;
}

/**
 * Times loop configuration section.
 */
function TimesSection({ config, onChange }: TimesSectionProps) {
  const isExpression = typeof config.count === 'string';
  const [useExpression, setUseExpression] = useState(isExpression);
  
  const handleToggleExpression = (enabled: boolean) => {
    setUseExpression(enabled);
    if (enabled) {
      onChange({ count: String(config.count) });
    } else {
      const num = typeof config.count === 'string' 
        ? parseInt(config.count, 10) || 10 
        : config.count;
      onChange({ count: num });
    }
  };
  
  return (
    <div className="loop-times-section">
      <Field label="Use Expression">
        <label className="loop-panel-toggle">
          <input
            type="checkbox"
            checked={useExpression}
            onChange={(e) => handleToggleExpression(e.target.checked)}
          />
          <span className="loop-panel-toggle-slider" />
          <span className="loop-panel-toggle-label">
            {useExpression ? 'Dynamic count from expression' : 'Fixed count'}
          </span>
        </label>
      </Field>
      
      {useExpression ? (
        <Field label="Count Expression" required hint="returns number">
          <input
            type="text"
            className="loop-panel-input loop-panel-input-mono"
            value={String(config.count)}
            onChange={(e) => onChange({ count: e.target.value })}
            placeholder="state.repeatCount"
          />
          <div className="loop-panel-field-help">
            Expression that evaluates to the number of iterations.
          </div>
        </Field>
      ) : (
        <Field label="Iteration Count" required>
          <input
            type="number"
            className="loop-panel-input"
            value={typeof config.count === 'number' ? config.count : 10}
            onChange={(e) => onChange({ count: parseInt(e.target.value, 10) || 1 })}
            min={1}
            max={10000}
          />
          <div className="loop-panel-field-help">
            Number of times to repeat the loop body.
          </div>
        </Field>
      )}
    </div>
  );
}

// ============================================
// Parallel Section Component
// ============================================

interface ParallelSectionProps {
  config: ParallelConfig;
  onChange: (updates: Partial<ParallelConfig>) => void;
}

/**
 * Parallel execution configuration section.
 * @see Requirement 7.3
 */
function ParallelSection({ config, onChange }: ParallelSectionProps) {
  return (
    <div className="loop-parallel-section">
      <Field label="Enable Parallel Execution">
        <label className="loop-panel-toggle">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <span className="loop-panel-toggle-slider" />
          <span className="loop-panel-toggle-label">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Field>
      
      {config.enabled && (
        <>
          <Field label="Batch Size" hint="items per batch">
            <input
              type="number"
              className="loop-panel-input"
              value={config.batchSize ?? 10}
              onChange={(e) => onChange({ batchSize: parseInt(e.target.value, 10) || undefined })}
              min={1}
              max={100}
              placeholder="10"
            />
            <div className="loop-panel-field-help">
              Number of items to process in parallel. Leave empty for unlimited.
            </div>
          </Field>
          
          <Field label="Delay Between Batches" hint="milliseconds">
            <input
              type="number"
              className="loop-panel-input"
              value={config.delayBetween ?? 0}
              onChange={(e) => onChange({ delayBetween: parseInt(e.target.value, 10) || undefined })}
              min={0}
              step={100}
              placeholder="0"
            />
            <div className="loop-panel-field-help">
              Delay in milliseconds between processing batches.
            </div>
          </Field>
        </>
      )}
      
      <div className="loop-panel-info">
        <span className="loop-panel-info-icon">⚡</span>
        <span className="loop-panel-info-text">
          Parallel execution processes multiple items simultaneously, 
          improving performance for I/O-bound operations.
        </span>
      </div>
    </div>
  );
}

// ============================================
// Results Section Component
// ============================================

interface ResultsSectionProps {
  config: ResultsConfig;
  onChange: (updates: Partial<ResultsConfig>) => void;
}

/**
 * Result aggregation configuration section.
 * @see Requirement 7.4
 */
function ResultsSection({ config, onChange }: ResultsSectionProps) {
  return (
    <div className="loop-results-section">
      <Field label="Collect Results">
        <label className="loop-panel-toggle">
          <input
            type="checkbox"
            checked={config.collect}
            onChange={(e) => onChange({ collect: e.target.checked })}
          />
          <span className="loop-panel-toggle-slider" />
          <span className="loop-panel-toggle-label">
            {config.collect ? 'Collect into array' : 'Discard results'}
          </span>
        </label>
      </Field>
      
      {config.collect && (
        <Field label="Aggregation Key" hint="state key for results">
          <input
            type="text"
            className="loop-panel-input loop-panel-input-mono"
            value={config.aggregationKey ?? ''}
            onChange={(e) => onChange({ aggregationKey: e.target.value || undefined })}
            placeholder="loopResults"
          />
          <div className="loop-panel-field-help">
            State key where the array of results will be stored.
            If empty, uses the node's output key.
          </div>
        </Field>
      )}
      
      <div className="loop-panel-info">
        <span className="loop-panel-info-icon">📥</span>
        <span className="loop-panel-info-text">
          When collecting results, each iteration's output is gathered into an array
          that can be used by subsequent nodes.
        </span>
      </div>
    </div>
  );
}

export default LoopPanel;
