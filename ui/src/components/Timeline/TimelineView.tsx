/**
 * TimelineView Component for ADK Studio v2.0
 * 
 * Displays a horizontal timeline of executed nodes for debugging.
 * Shows duration and status for each node, supports collapsing.
 * 
 * Requirements: 5.1, 5.2, 5.5, 5.6, 5.10
 */

import { memo, useCallback, useMemo } from 'react';
import type { StateSnapshot } from '../../types/execution';
import { StatusIndicator } from '../Overlays/StatusIndicator';
import '../../styles/timeline.css';

interface TimelineViewProps {
  /** Array of state snapshots from execution */
  snapshots: StateSnapshot[];
  /** Current position in the timeline */
  currentIndex: number;
  /** Callback when user scrubs to a position */
  onScrub: (index: number) => void;
  /** Whether the timeline is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapsed state */
  onToggleCollapse: () => void;
}

/**
 * TimelineView displays a horizontal timeline of executed nodes.
 * 
 * Features:
 * - Horizontal scrollable timeline of node executions
 * - Duration and status display for each node
 * - Click to jump to specific execution point
 * - Collapsible to maximize canvas space
 * 
 * @see Requirements 5.1, 5.2, 5.5, 5.6, 5.10
 */
export const TimelineView = memo(function TimelineView({
  snapshots,
  currentIndex,
  onScrub,
  isCollapsed,
  onToggleCollapse,
}: TimelineViewProps) {
  // Filter out internal nodes (like __done__)
  const visibleSnapshots = useMemo(() => 
    snapshots.filter(s => !s.nodeId.startsWith('__')),
    [snapshots]
  );

  const handleNodeClick = useCallback((index: number) => {
    // Find the actual index in the original snapshots array
    const snapshot = visibleSnapshots[index];
    const actualIndex = snapshots.findIndex(s => s === snapshot);
    if (actualIndex >= 0) {
      onScrub(actualIndex);
    }
  }, [visibleSnapshots, snapshots, onScrub]);

  // Calculate which visible index is currently active
  const activeVisibleIndex = useMemo(() => {
    if (currentIndex < 0) return -1;
    const currentSnapshot = snapshots[currentIndex];
    return visibleSnapshots.findIndex(s => s === currentSnapshot);
  }, [currentIndex, snapshots, visibleSnapshots]);

  return (
    <div className={`timeline-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      {/* Header - always visible */}
      <div className="timeline-header" onClick={onToggleCollapse}>
        <div className="timeline-header-left">
          <span className="timeline-title">Execution Timeline</span>
          {visibleSnapshots.length > 0 && (
            <span className="timeline-count">{visibleSnapshots.length} steps</span>
          )}
        </div>
        <ChevronIcon className={`timeline-toggle-icon ${isCollapsed ? 'collapsed' : ''}`} />
      </div>

      {/* Timeline content - hidden when collapsed */}
      {!isCollapsed && (
        <>
          {visibleSnapshots.length === 0 ? (
            <TimelineEmpty />
          ) : (
            <div className="timeline-track">
              {visibleSnapshots.map((snapshot, index) => (
                <TimelineNodeEntry
                  key={`${snapshot.nodeId}-step${snapshot.step ?? index}-${index}`}
                  snapshot={snapshot}
                  index={index}
                  isActive={index === activeVisibleIndex}
                  onClick={() => handleNodeClick(index)}
                  showConnector={index < visibleSnapshots.length - 1}
                  isConnectorActive={index < activeVisibleIndex}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

/**
 * Individual timeline node entry
 */
interface TimelineNodeEntryProps {
  snapshot: StateSnapshot;
  index: number;
  isActive: boolean;
  onClick: () => void;
  showConnector: boolean;
  isConnectorActive: boolean;
}

const TimelineNodeEntry = memo(function TimelineNodeEntry({
  snapshot,
  index,
  isActive,
  onClick,
  showConnector,
  isConnectorActive,
}: TimelineNodeEntryProps) {
  const statusClass = `status-${snapshot.status}`;
  const isError = snapshot.status === 'error';
  
  return (
    <>
      <div
        className={`timeline-node ${statusClass} ${isActive ? 'active' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        aria-label={`Step ${index + 1}: ${snapshot.nodeLabel || snapshot.nodeId}, ${snapshot.status}${isError && snapshot.error ? `: ${snapshot.error}` : ''}, ${formatDuration(snapshot.duration)}`}
        title={isError && snapshot.error ? `Error: ${snapshot.error}` : undefined}
      >
        <div className="timeline-node-status">
          <StatusIndicator status={snapshot.status === 'running' ? 'running' : snapshot.status} size="sm" />
        </div>
        <span className="timeline-node-label" title={snapshot.nodeLabel || snapshot.nodeId}>
          {snapshot.nodeLabel || snapshot.nodeId}
        </span>
        <span className="timeline-node-duration">
          {formatDuration(snapshot.duration)}
        </span>
        {snapshot.step !== undefined && (
          <span className="timeline-node-step">Step {snapshot.step}</span>
        )}
        {/* Show error indicator for error nodes - Requirement 5.9 */}
        {isError && (
          <span className="timeline-node-error-badge" title={snapshot.error}>
            ⚠️
          </span>
        )}
      </div>
      {showConnector && (
        <div className={`timeline-connector ${isConnectorActive ? 'active' : ''}`}>
          <div className="timeline-connector-line" />
        </div>
      )}
    </>
  );
});

/**
 * Empty state when no execution has occurred
 */
function TimelineEmpty() {
  return (
    <div className="timeline-empty">
      <span className="timeline-empty-icon">⏱️</span>
      <span className="timeline-empty-text">
        Run the workflow to see execution timeline
      </span>
    </div>
  );
}

/**
 * Chevron icon for collapse/expand toggle
 */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
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

export default TimelineView;
