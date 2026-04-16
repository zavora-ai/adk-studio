/**
 * StateInspector Component for ADK Studio v2.0
 * 
 * Displays runtime state values during execution.
 * Shows input/output state as formatted JSON with syntax highlighting.
 * Supports state history display and changed keys highlighting.
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8
 */

import { memo, useCallback, useMemo, useState } from 'react';
import type { StateSnapshot } from '../../types/execution';
import '../../styles/state-inspector.css';

interface StateInspectorProps {
  /** Current state snapshot to display */
  snapshot: StateSnapshot | null;
  /** Previous snapshot for diff highlighting */
  previousSnapshot: StateSnapshot | null;
  /** All snapshots for history display */
  snapshots?: StateSnapshot[];
  /** Current snapshot index */
  currentIndex?: number;
  /** Callback when user selects a history item */
  onHistorySelect?: (index: number) => void;
  /** Callback to close the inspector */
  onClose?: () => void;
}

/**
 * StateInspector displays runtime state at each node during execution.
 * 
 * Features:
 * - Formatted JSON display with syntax highlighting
 * - Input/output state sections
 * - Changed keys highlighting between snapshots
 * - State history for selected node
 * - Collapsible nested objects
 * 
 * @see Requirements 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export const StateInspector = memo(function StateInspector({
  snapshot,
  previousSnapshot,
  snapshots = [],
  currentIndex = -1,
  onHistorySelect,
  onClose,
}: StateInspectorProps) {
  // Calculate changed keys between snapshots
  const changedKeys = useMemo(() => {
    if (!snapshot || !previousSnapshot) return new Set<string>();
    return getChangedKeys(previousSnapshot.outputState, snapshot.outputState);
  }, [snapshot, previousSnapshot]);

  // Filter history to show only snapshots for the current node
  const nodeHistory = useMemo(() => {
    if (!snapshot) return [];
    return snapshots
      .map((s, idx) => ({ snapshot: s, index: idx }))
      .filter(({ snapshot: s }) => s.nodeId === snapshot.nodeId);
  }, [snapshots, snapshot]);

  if (!snapshot) {
    return (
      <div className="state-inspector">
        <StateInspectorHeader onClose={onClose} />
        <div className="state-inspector-empty">
          <span className="state-inspector-empty-icon">🔍</span>
          <span className="state-inspector-empty-text">
            Run the workflow to inspect state at each node
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="state-inspector">
      <StateInspectorHeader onClose={onClose} />
      <div className="state-inspector-content">
        {/* Node Info */}
        <NodeInfoHeader snapshot={snapshot} />

        {/* Input State Section */}
        <StateSection
          title="Input State"
          data={snapshot.inputState}
          changedKeys={new Set()}
          emptyMessage="No input state"
        />

        {/* Output State Section */}
        <StateSection
          title="Output State"
          data={snapshot.outputState}
          changedKeys={changedKeys}
          emptyMessage="No output state"
        />

        {/* Meta Information */}
        <StateMeta snapshot={snapshot} />

        {/* State History for this node */}
        {nodeHistory.length > 1 && (
          <StateHistory
            history={nodeHistory}
            currentIndex={currentIndex}
            onSelect={onHistorySelect}
          />
        )}
      </div>
    </div>
  );
});

/**
 * Header component for the State Inspector
 */
interface StateInspectorHeaderProps {
  onClose?: () => void;
}

function StateInspectorHeader({ onClose }: StateInspectorHeaderProps) {
  return (
    <div className="state-inspector-header">
      <span className="state-inspector-title">
        <span className="state-inspector-title-icon">🔍</span>
        State Inspector
      </span>
      {onClose && (
        <button
          className="state-inspector-close"
          onClick={onClose}
          aria-label="Close state inspector"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

/**
 * Node info header showing current node details
 */
interface NodeInfoHeaderProps {
  snapshot: StateSnapshot;
}

function NodeInfoHeader({ snapshot }: NodeInfoHeaderProps) {
  const nodeIcon = getNodeIcon(snapshot.nodeId);
  
  return (
    <div className="state-node-info">
      <span className="state-node-icon">{nodeIcon}</span>
      <div className="state-node-details">
        <div className="state-node-name" title={snapshot.nodeLabel || snapshot.nodeId}>
          {snapshot.nodeLabel || snapshot.nodeId}
        </div>
        {snapshot.step !== undefined && (
          <div className="state-node-step">Step {snapshot.step}</div>
        )}
      </div>
    </div>
  );
}

/**
 * State section component for input/output state
 */
interface StateSectionProps {
  title: string;
  data: Record<string, unknown>;
  changedKeys: Set<string>;
  emptyMessage: string;
}

function StateSection({ title, data, changedKeys, emptyMessage }: StateSectionProps) {
  const keyCount = Object.keys(data).length;
  
  return (
    <div className="state-section">
      <div className="state-section-header">
        <span className="state-section-title">
          {title}
          {keyCount > 0 && (
            <span className="state-section-badge">{keyCount} keys</span>
          )}
        </span>
      </div>
      <JsonViewer data={data} changedKeys={changedKeys} emptyMessage={emptyMessage} />
    </div>
  );
}

/**
 * JSON Viewer with syntax highlighting and collapsible objects
 * 
 * @see Requirements 4.4, 4.7, 4.8
 */
interface JsonViewerProps {
  data: Record<string, unknown>;
  changedKeys?: Set<string>;
  emptyMessage?: string;
}

function JsonViewer({ data, changedKeys = new Set(), emptyMessage = 'Empty' }: JsonViewerProps) {
  if (Object.keys(data).length === 0) {
    return (
      <div className="json-viewer">
        <span className="json-viewer-empty">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="json-viewer">
      <JsonObject data={data} changedKeys={changedKeys} depth={0} />
    </div>
  );
}

/**
 * Recursive JSON object renderer with collapsible support
 */
interface JsonObjectProps {
  data: Record<string, unknown>;
  changedKeys: Set<string>;
  depth: number;
  parentKey?: string;
}

function JsonObject({ data, changedKeys, depth, parentKey = '' }: JsonObjectProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = useCallback((key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const entries = Object.entries(data);

  return (
    <>
      <span className="json-bracket">{'{'}</span>
      {entries.length > 0 && (
        <div className={depth > 0 ? 'json-nested' : ''}>
          {entries.map(([key, value], index) => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            const isChanged = changedKeys.has(key) || changedKeys.has(fullKey);
            const isLast = index === entries.length - 1;
            const isCollapsible = isObject(value) || Array.isArray(value);
            const isCollapsed = collapsed[key];

            return (
              <div key={key}>
                {isCollapsible ? (
                  <span
                    className="json-collapsible"
                    onClick={() => toggleCollapse(key)}
                  >
                    <span className="json-collapse-icon">
                      {isCollapsed ? '▶' : '▼'}
                    </span>
                    <span className={`json-key ${isChanged ? 'changed' : ''}`}>
                      "{key}"
                    </span>
                    <span className="json-colon">: </span>
                    {isCollapsed ? (
                      <span className="json-collapsed-preview">
                        {Array.isArray(value)
                          ? `[${value.length} items]`
                          : `{${Object.keys(value as object).length} keys}`}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <>
                    <span className={`json-key ${isChanged ? 'changed' : ''}`}>
                      "{key}"
                    </span>
                    <span className="json-colon">: </span>
                  </>
                )}
                {!isCollapsed && (
                  <span className={isChanged ? 'json-value changed' : ''}>
                    <JsonValue value={value} changedKeys={changedKeys} depth={depth} parentKey={fullKey} />
                  </span>
                )}
                {!isLast && <span className="json-comma">,</span>}
              </div>
            );
          })}
        </div>
      )}
      <span className="json-bracket">{'}'}</span>
    </>
  );
}

/**
 * JSON value renderer with type-specific styling
 */
interface JsonValueProps {
  value: unknown;
  changedKeys: Set<string>;
  depth: number;
  parentKey: string;
}

function JsonValue({ value, changedKeys, depth, parentKey }: JsonValueProps) {
  if (value === null) {
    return <span className="json-null">null</span>;
  }

  if (value === undefined) {
    return <span className="json-null">undefined</span>;
  }

  if (typeof value === 'string') {
    // Truncate long strings
    const displayValue = value.length > 100 ? value.slice(0, 100) + '...' : value;
    return <span className="json-string">"{escapeString(displayValue)}"</span>;
  }

  if (typeof value === 'number') {
    return <span className="json-number">{value}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="json-boolean">{value.toString()}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="json-bracket">[]</span>;
    }
    return (
      <>
        <span className="json-bracket">[</span>
        <div className="json-nested">
          {value.map((item, index) => (
            <div key={index}>
              <JsonValue
                value={item}
                changedKeys={changedKeys}
                depth={depth + 1}
                parentKey={`${parentKey}[${index}]`}
              />
              {index < value.length - 1 && <span className="json-comma">,</span>}
            </div>
          ))}
        </div>
        <span className="json-bracket">]</span>
      </>
    );
  }

  if (isObject(value)) {
    return (
      <JsonObject
        data={value as Record<string, unknown>}
        changedKeys={changedKeys}
        depth={depth + 1}
        parentKey={parentKey}
      />
    );
  }

  // Fallback for unknown types
  return <span className="json-string">{String(value)}</span>;
}

/**
 * Meta information display
 */
interface StateMetaProps {
  snapshot: StateSnapshot;
}

function StateMeta({ snapshot }: StateMetaProps) {
  return (
    <div className="state-meta">
      <div className="state-meta-item">
        <span className="state-meta-label">Duration:</span>
        <span className="state-meta-value">{formatDuration(snapshot.duration)}</span>
      </div>
      <div className="state-meta-item">
        <span className="state-meta-label">Status:</span>
        <span className={`state-meta-value ${snapshot.status}`}>
          {snapshot.status === 'success' ? '✓ Success' : 
           snapshot.status === 'error' ? '✗ Error' : 
           '⟳ Running'}
        </span>
      </div>
      {snapshot.iteration !== undefined && snapshot.iteration > 0 && (
        <div className="state-meta-item">
          <span className="state-meta-label">Iteration:</span>
          <span className="state-meta-value">{snapshot.iteration}</span>
        </div>
      )}
      {snapshot.error && (
        <div className="state-meta-item" style={{ width: '100%' }}>
          <span className="state-meta-label">Error:</span>
          <span className="state-meta-value error" title={snapshot.error}>
            {truncateString(snapshot.error, 50)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * State history list for the current node
 * 
 * @see Requirements 4.6
 */
interface StateHistoryProps {
  history: Array<{ snapshot: StateSnapshot; index: number }>;
  currentIndex: number;
  onSelect?: (index: number) => void;
}

function StateHistory({ history, currentIndex, onSelect }: StateHistoryProps) {
  return (
    <div className="state-history">
      <div className="state-history-header">
        <span className="state-history-title">History ({history.length})</span>
      </div>
      <div className="state-history-list">
        {history.map(({ snapshot, index }) => (
          <div
            key={`${snapshot.nodeId}-hist-${index}`}
            className={`state-history-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => onSelect?.(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect?.(index)}
          >
            <span className="state-history-step">
              {snapshot.step !== undefined ? `#${snapshot.step}` : `@${index}`}
            </span>
            <span className="state-history-node">
              {formatDuration(snapshot.duration)}
            </span>
            <span className={`state-history-status ${snapshot.status}`}>
              {snapshot.status === 'success' ? '✓' : 
               snapshot.status === 'error' ? '✗' : '⟳'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Close icon SVG
 */
function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get changed keys between two state objects
 * 
 * @see Requirements 4.8
 */
export function getChangedKeys(
  prev: Record<string, unknown> | undefined,
  curr: Record<string, unknown> | undefined
): Set<string> {
  const changed = new Set<string>();
  
  if (!prev || !curr) return changed;

  // Check for changed or new keys in current
  for (const key of Object.keys(curr)) {
    if (!(key in prev)) {
      changed.add(key);
    } else if (!deepEqual(prev[key], curr[key])) {
      changed.add(key);
    }
  }

  // Check for removed keys
  for (const key of Object.keys(prev)) {
    if (!(key in curr)) {
      changed.add(key);
    }
  }

  return changed;
}

/**
 * Deep equality check for JSON values
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => 
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }
  
  return false;
}

/**
 * Check if value is a plain object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Escape special characters in strings for JSON display
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Truncate string with ellipsis
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Get icon for node type based on node ID
 * 
 * Supports both LLM agent nodes and action nodes.
 * Action nodes are identified by their type prefix (e.g., trigger_, http_, etc.)
 * 
 * @see Requirements 12.3: Action node integration with state inspector
 */
function getNodeIcon(nodeId: string): string {
  const id = nodeId.toLowerCase();
  
  // Action node icons (identified by type prefix)
  // @see Requirements 12.1: Action node visual distinction
  if (id.startsWith('trigger')) return '🎯';
  if (id.startsWith('http')) return '🌐';
  if (id.startsWith('set')) return '📝';
  if (id.startsWith('transform')) return '⚙️';
  if (id.startsWith('switch')) return '🔀';
  if (id.startsWith('merge')) return '🔗';
  if (id.startsWith('wait')) return '⏱️';
  if (id.startsWith('code')) return '💻';
  if (id.startsWith('database')) return '🗄️';
  
  // LLM agent node icons
  if (id.includes('loop')) return '🔄';
  if (id.includes('parallel')) return '⚡';
  if (id.includes('sequential')) return '📋';
  if (id.includes('router')) return '🔀';
  if (id === 'start') return '▶️';
  if (id === 'end') return '⏹️';
  
  // Default to robot for LLM agents
  return '🤖';
}

export default StateInspector;
