/**
 * WaitPanel Component for ADK Studio
 * 
 * Properties panel for configuring Wait action nodes.
 * Provides UI for selecting wait type and configuring type-specific options.
 * 
 * Requirements: 9.1, 9.2, 9.3, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  WaitNodeConfig, 
  WaitType, 
  TimeUnit,
  FixedDuration,
  UntilConfig,
  WebhookWaitConfig,
  ConditionPolling,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/waitPanel.css';

// ============================================
// Constants
// ============================================

const WAIT_TYPES: readonly WaitType[] = ['fixed', 'until', 'webhook', 'condition'];

const WAIT_TYPE_CONFIG: Record<WaitType, {
  label: string;
  description: string;
  icon: string;
}> = {
  fixed: {
    label: 'Fixed Duration',
    description: 'Wait for a specific amount of time',
    icon: '⏱️',
  },
  until: {
    label: 'Until Timestamp',
    description: 'Wait until a specific date/time',
    icon: '📅',
  },
  webhook: {
    label: 'Webhook Callback',
    description: 'Wait for an external webhook call',
    icon: '🔗',
  },
  condition: {
    label: 'Condition Polling',
    description: 'Poll until a condition becomes true',
    icon: '🔄',
  },
};

const TIME_UNITS: readonly TimeUnit[] = ['ms', 's', 'm', 'h'];

const TIME_UNIT_LABELS: Record<TimeUnit, string> = {
  ms: 'Milliseconds',
  s: 'Seconds',
  m: 'Minutes',
  h: 'Hours',
};

// ============================================
// Main Component
// ============================================

export interface WaitPanelProps {
  /** Current Wait node configuration */
  node: WaitNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: WaitNodeConfig) => void;
}

/**
 * WaitPanel provides configuration UI for Wait action nodes.
 * 
 * Features:
 * - Wait type selector with descriptions (Requirement 9.1)
 * - Fixed duration configuration with unit selector (Requirement 9.2)
 * - Until timestamp configuration
 * - Webhook callback configuration
 * - Condition polling configuration (Requirement 9.3)
 * - Standard properties panel integration
 * 
 * @see Requirements 9.1, 9.2, 9.3, 12.2
 */
export function WaitPanel({ node, onChange }: WaitPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateWaitType = useCallback((waitType: WaitType) => {
    const updates: Partial<WaitNodeConfig> = { waitType };
    
    // Initialize type-specific config if not present
    if (waitType === 'fixed' && !node.fixed) {
      updates.fixed = {
        duration: 5,
        unit: 's',
      };
    } else if (waitType === 'until' && !node.until) {
      updates.until = {
        timestamp: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };
    } else if (waitType === 'webhook' && !node.webhook) {
      updates.webhook = {
        path: '/api/webhook/wait-callback',
        timeout: 300000, // 5 minutes
      };
    } else if (waitType === 'condition' && !node.condition) {
      updates.condition = {
        expression: 'state.isReady === true',
        pollInterval: 5000, // 5 seconds
        maxWait: 300000, // 5 minutes
      };
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateFixed = useCallback((updates: Partial<FixedDuration>) => {
    onChange({
      ...node,
      fixed: { ...node.fixed!, ...updates },
    });
  }, [node, onChange]);
  
  const updateUntil = useCallback((updates: Partial<UntilConfig>) => {
    onChange({
      ...node,
      until: { ...node.until!, ...updates },
    });
  }, [node, onChange]);
  
  const updateWebhook = useCallback((updates: Partial<WebhookWaitConfig>) => {
    onChange({
      ...node,
      webhook: { ...node.webhook!, ...updates },
    });
  }, [node, onChange]);
  
  const updateCondition = useCallback((updates: Partial<ConditionPolling>) => {
    onChange({
      ...node,
      condition: { ...node.condition!, ...updates },
    });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="wait-panel">
      {/* Wait Type Selection (Requirement 9.1) */}
      <CollapsibleSection title="Wait Type" defaultOpen>
        <WaitTypeSection
          waitType={node.waitType}
          onChange={updateWaitType}
        />
      </CollapsibleSection>
      
      {/* Fixed Duration Configuration (Requirement 9.2) */}
      {node.waitType === 'fixed' && node.fixed && (
        <CollapsibleSection title="Duration Configuration" defaultOpen>
          <FixedDurationSection
            fixed={node.fixed}
            onChange={updateFixed}
          />
        </CollapsibleSection>
      )}
      
      {/* Until Timestamp Configuration */}
      {node.waitType === 'until' && node.until && (
        <CollapsibleSection title="Timestamp Configuration" defaultOpen>
          <UntilSection
            until={node.until}
            onChange={updateUntil}
          />
        </CollapsibleSection>
      )}
      
      {/* Webhook Configuration */}
      {node.waitType === 'webhook' && node.webhook && (
        <CollapsibleSection title="Webhook Configuration" defaultOpen>
          <WebhookSection
            webhook={node.webhook}
            onChange={updateWebhook}
          />
        </CollapsibleSection>
      )}
      
      {/* Condition Polling Configuration (Requirement 9.3) */}
      {node.waitType === 'condition' && node.condition && (
        <CollapsibleSection title="Condition Configuration" defaultOpen>
          <ConditionSection
            condition={node.condition}
            onChange={updateCondition}
          />
        </CollapsibleSection>
      )}
      
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
// Wait Type Section Component
// ============================================

interface WaitTypeSectionProps {
  waitType: WaitType;
  onChange: (waitType: WaitType) => void;
}

/**
 * Wait type selector section.
 * @see Requirement 9.1
 */
function WaitTypeSection({ waitType, onChange }: WaitTypeSectionProps) {
  return (
    <div className="wait-type-section">
      <div className="wait-type-selector">
        {WAIT_TYPES.map((type) => {
          const config = WAIT_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              type="button"
              className={`wait-type-option ${waitType === type ? 'selected' : ''}`}
              onClick={() => onChange(type)}
            >
              <span className="wait-type-icon">{config.icon}</span>
              <span className="wait-type-label">{config.label}</span>
              <span className="wait-type-description">{config.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Fixed Duration Section Component
// ============================================

interface FixedDurationSectionProps {
  fixed: FixedDuration;
  onChange: (updates: Partial<FixedDuration>) => void;
}

/**
 * Fixed duration configuration section.
 * @see Requirement 9.2
 */
function FixedDurationSection({ fixed, onChange }: FixedDurationSectionProps) {
  // Calculate human-readable duration
  const getHumanReadable = (): string => {
    const { duration, unit } = fixed;
    let totalMs = duration;
    
    switch (unit) {
      case 's': totalMs = duration * 1000; break;
      case 'm': totalMs = duration * 60000; break;
      case 'h': totalMs = duration * 3600000; break;
    }
    
    if (totalMs < 1000) return `${totalMs} milliseconds`;
    if (totalMs < 60000) return `${totalMs / 1000} seconds`;
    if (totalMs < 3600000) return `${(totalMs / 60000).toFixed(1)} minutes`;
    return `${(totalMs / 3600000).toFixed(2)} hours`;
  };
  
  return (
    <div className="wait-fixed-section">
      <div className="wait-duration-row">
        <Field label="Duration" required>
          <input
            type="number"
            className="wait-panel-input wait-duration-input"
            value={fixed.duration}
            onChange={(e) => onChange({ duration: parseInt(e.target.value, 10) || 0 })}
            min={0}
            step={1}
          />
        </Field>
        
        <Field label="Unit" required>
          <select
            className="wait-panel-select wait-unit-select"
            value={fixed.unit}
            onChange={(e) => onChange({ unit: e.target.value as TimeUnit })}
          >
            {TIME_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {TIME_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      
      {/* Duration presets */}
      <div className="wait-panel-presets">
        <span className="wait-panel-presets-label">Presets:</span>
        <div className="wait-panel-presets-buttons">
          <button type="button" onClick={() => onChange({ duration: 1, unit: 's' })}>1s</button>
          <button type="button" onClick={() => onChange({ duration: 5, unit: 's' })}>5s</button>
          <button type="button" onClick={() => onChange({ duration: 30, unit: 's' })}>30s</button>
          <button type="button" onClick={() => onChange({ duration: 1, unit: 'm' })}>1m</button>
          <button type="button" onClick={() => onChange({ duration: 5, unit: 'm' })}>5m</button>
          <button type="button" onClick={() => onChange({ duration: 1, unit: 'h' })}>1h</button>
        </div>
      </div>
      
      {/* Human-readable preview */}
      <div className="wait-panel-preview">
        <span className="wait-panel-preview-label">Wait for:</span>
        <span className="wait-panel-preview-value">{getHumanReadable()}</span>
      </div>
    </div>
  );
}

// ============================================
// Until Section Component
// ============================================

interface UntilSectionProps {
  until: UntilConfig;
  onChange: (updates: Partial<UntilConfig>) => void;
}

/**
 * Until timestamp configuration section.
 */
function UntilSection({ until, onChange }: UntilSectionProps) {
  const [isExpression, setIsExpression] = useState(
    until.timestamp.startsWith('{{') || until.timestamp.includes('state.')
  );
  
  return (
    <div className="wait-until-section">
      <div className="wait-panel-toggle-row">
        <label className="wait-panel-toggle">
          <input
            type="checkbox"
            checked={isExpression}
            onChange={(e) => setIsExpression(e.target.checked)}
          />
          <span className="wait-panel-toggle-slider" />
          <span className="wait-panel-toggle-label">Use expression</span>
        </label>
      </div>
      
      {isExpression ? (
        <Field label="Timestamp Expression" required hint="returns ISO string">
          <input
            type="text"
            className="wait-panel-input wait-panel-input-mono"
            value={until.timestamp}
            onChange={(e) => onChange({ timestamp: e.target.value })}
            placeholder="{{state.targetTime}}"
          />
          <div className="wait-panel-field-help">
            Expression should return an ISO 8601 timestamp string.
          </div>
        </Field>
      ) : (
        <Field label="Target Date/Time" required>
          <input
            type="datetime-local"
            className="wait-panel-input"
            value={until.timestamp.slice(0, 16)}
            onChange={(e) => onChange({ timestamp: new Date(e.target.value).toISOString() })}
          />
        </Field>
      )}
      
      <div className="wait-panel-info">
        <span className="wait-panel-info-icon">ℹ️</span>
        <span className="wait-panel-info-text">
          The workflow will pause until the specified timestamp is reached.
          If the timestamp is in the past, the wait will complete immediately.
        </span>
      </div>
    </div>
  );
}

// ============================================
// Webhook Section Component
// ============================================

interface WebhookSectionProps {
  webhook: WebhookWaitConfig;
  onChange: (updates: Partial<WebhookWaitConfig>) => void;
}

/**
 * Webhook callback configuration section.
 */
function WebhookSection({ webhook, onChange }: WebhookSectionProps) {
  return (
    <div className="wait-webhook-section">
      <Field label="Callback Path" required hint="webhook endpoint">
        <input
          type="text"
          className="wait-panel-input wait-panel-input-mono"
          value={webhook.path}
          onChange={(e) => onChange({ path: e.target.value })}
          placeholder="/api/webhook/callback"
        />
      </Field>
      
      <Field label="Timeout" required hint="milliseconds">
        <input
          type="number"
          className="wait-panel-input"
          value={webhook.timeout}
          onChange={(e) => onChange({ timeout: parseInt(e.target.value, 10) || 300000 })}
          min={0}
          step={1000}
        />
        <div className="wait-panel-field-help">
          Maximum time to wait for the webhook callback ({(webhook.timeout / 60000).toFixed(1)} minutes).
        </div>
      </Field>
      
      {/* Timeout presets */}
      <div className="wait-panel-presets">
        <span className="wait-panel-presets-label">Timeout presets:</span>
        <div className="wait-panel-presets-buttons">
          <button type="button" onClick={() => onChange({ timeout: 60000 })}>1m</button>
          <button type="button" onClick={() => onChange({ timeout: 300000 })}>5m</button>
          <button type="button" onClick={() => onChange({ timeout: 900000 })}>15m</button>
          <button type="button" onClick={() => onChange({ timeout: 3600000 })}>1h</button>
        </div>
      </div>
      
      <div className="wait-panel-info">
        <span className="wait-panel-info-icon">🔗</span>
        <span className="wait-panel-info-text">
          The workflow will pause until an HTTP request is received at the callback path.
          The request body will be available in the workflow state.
        </span>
      </div>
    </div>
  );
}

// ============================================
// Condition Section Component
// ============================================

interface ConditionSectionProps {
  condition: ConditionPolling;
  onChange: (updates: Partial<ConditionPolling>) => void;
}

/**
 * Condition polling configuration section.
 * @see Requirement 9.3
 */
function ConditionSection({ condition, onChange }: ConditionSectionProps) {
  return (
    <div className="wait-condition-section">
      <Field label="Condition Expression" required hint="JavaScript expression">
        <textarea
          className="wait-panel-textarea wait-panel-input-mono"
          value={condition.expression}
          onChange={(e) => onChange({ expression: e.target.value })}
          placeholder="state.isReady === true"
          rows={3}
        />
        <div className="wait-panel-field-help">
          Expression is evaluated against the workflow state. Wait completes when it returns true.
        </div>
      </Field>
      
      <Field label="Poll Interval" required hint="milliseconds">
        <input
          type="number"
          className="wait-panel-input"
          value={condition.pollInterval}
          onChange={(e) => onChange({ pollInterval: parseInt(e.target.value, 10) || 5000 })}
          min={100}
          step={1000}
        />
        <div className="wait-panel-field-help">
          How often to check the condition ({(condition.pollInterval / 1000).toFixed(1)} seconds).
        </div>
      </Field>
      
      <Field label="Maximum Wait" required hint="milliseconds">
        <input
          type="number"
          className="wait-panel-input"
          value={condition.maxWait}
          onChange={(e) => onChange({ maxWait: parseInt(e.target.value, 10) || 300000 })}
          min={0}
          step={1000}
        />
        <div className="wait-panel-field-help">
          Maximum time to wait before timing out ({(condition.maxWait / 60000).toFixed(1)} minutes).
        </div>
      </Field>
      
      {/* Interval presets */}
      <div className="wait-panel-presets">
        <span className="wait-panel-presets-label">Poll interval presets:</span>
        <div className="wait-panel-presets-buttons">
          <button type="button" onClick={() => onChange({ pollInterval: 1000 })}>1s</button>
          <button type="button" onClick={() => onChange({ pollInterval: 5000 })}>5s</button>
          <button type="button" onClick={() => onChange({ pollInterval: 10000 })}>10s</button>
          <button type="button" onClick={() => onChange({ pollInterval: 30000 })}>30s</button>
        </div>
      </div>
      
      <div className="wait-panel-info wait-panel-info-warning">
        <span className="wait-panel-info-icon">⚠️</span>
        <span className="wait-panel-info-text">
          Frequent polling may impact performance. Use longer intervals when possible.
          If the condition is never met, the wait will timeout after {(condition.maxWait / 60000).toFixed(1)} minutes.
        </span>
      </div>
    </div>
  );
}

export default WaitPanel;
