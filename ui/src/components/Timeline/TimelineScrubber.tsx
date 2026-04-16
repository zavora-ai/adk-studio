/**
 * TimelineScrubber Component for ADK Studio v2.0
 * 
 * Provides a scrub control for timeline navigation.
 * Highlights corresponding node on canvas when scrubbing.
 * 
 * Requirements: 5.3, 5.7
 */

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import type { StateSnapshot } from '../../types/execution';
import '../../styles/timeline.css';

interface TimelineScrubberProps {
  /** Array of state snapshots */
  snapshots: StateSnapshot[];
  /** Current position in the timeline (0-based index) */
  currentIndex: number;
  /** Callback when user scrubs to a new position */
  onScrub: (index: number) => void;
  /** Optional callback when scrubbing starts (for highlighting) */
  onScrubStart?: () => void;
  /** Optional callback when scrubbing ends */
  onScrubEnd?: () => void;
}

/**
 * TimelineScrubber provides a slider control for navigating through execution history.
 * 
 * Features:
 * - Drag to scrub through timeline
 * - Click to jump to position
 * - Shows current position and total steps
 * - Highlights corresponding node on canvas during scrubbing
 * 
 * @see Requirements 5.3, 5.7
 */
export const TimelineScrubber = memo(function TimelineScrubber({
  snapshots,
  currentIndex,
  onScrub,
  onScrubStart,
  onScrubEnd,
}: TimelineScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter out internal nodes for display
  const visibleSnapshots = snapshots.filter(s => !s.nodeId.startsWith('__'));
  const maxIndex = Math.max(0, visibleSnapshots.length - 1);
  
  // Calculate the visible index from the actual index
  const visibleIndex = snapshots[currentIndex] 
    ? visibleSnapshots.findIndex(s => s === snapshots[currentIndex])
    : -1;
  
  const displayIndex = Math.max(0, visibleIndex);
  const progress = maxIndex > 0 ? (displayIndex / maxIndex) * 100 : 0;

  /**
   * Calculate index from mouse/touch position
   */
  const getIndexFromPosition = useCallback((clientX: number): number => {
    if (!trackRef.current || maxIndex === 0) return 0;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(percentage * maxIndex);
  }, [maxIndex]);

  /**
   * Convert visible index back to actual snapshot index
   */
  const visibleToActualIndex = useCallback((visibleIdx: number): number => {
    if (visibleIdx < 0 || visibleIdx >= visibleSnapshots.length) return -1;
    const snapshot = visibleSnapshots[visibleIdx];
    return snapshots.findIndex(s => s === snapshot);
  }, [visibleSnapshots, snapshots]);

  /**
   * Handle mouse down on track
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onScrubStart?.();
    
    const visibleIdx = getIndexFromPosition(e.clientX);
    const actualIdx = visibleToActualIndex(visibleIdx);
    if (actualIdx >= 0) {
      onScrub(actualIdx);
    }
  }, [getIndexFromPosition, visibleToActualIndex, onScrub, onScrubStart]);

  /**
   * Handle mouse move during drag
   */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const visibleIdx = getIndexFromPosition(e.clientX);
      const actualIdx = visibleToActualIndex(visibleIdx);
      if (actualIdx >= 0) {
        onScrub(actualIdx);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onScrubEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, getIndexFromPosition, visibleToActualIndex, onScrub, onScrubEnd]);

  /**
   * Handle click on track (jump to position)
   * Requirement 5.7: Support clicking on a node to jump to that point
   */
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    const visibleIdx = getIndexFromPosition(e.clientX);
    const actualIdx = visibleToActualIndex(visibleIdx);
    if (actualIdx >= 0) {
      onScrub(actualIdx);
    }
  }, [getIndexFromPosition, visibleToActualIndex, onScrub]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newVisibleIndex = displayIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newVisibleIndex = Math.max(0, displayIndex - 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newVisibleIndex = Math.min(maxIndex, displayIndex + 1);
        break;
      case 'Home':
        newVisibleIndex = 0;
        break;
      case 'End':
        newVisibleIndex = maxIndex;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    const actualIdx = visibleToActualIndex(newVisibleIndex);
    if (actualIdx >= 0) {
      onScrub(actualIdx);
    }
  }, [displayIndex, maxIndex, visibleToActualIndex, onScrub]);

  // Don't render if no snapshots
  if (visibleSnapshots.length === 0) {
    return null;
  }

  const currentSnapshot = visibleSnapshots[displayIndex];
  const currentLabel = currentSnapshot?.nodeLabel || currentSnapshot?.nodeId || 'Unknown';

  return (
    <div className="timeline-scrubber">
      <div
        ref={trackRef}
        className="timeline-scrubber-track"
        onMouseDown={handleMouseDown}
        onClick={handleTrackClick}
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={maxIndex}
        aria-valuenow={displayIndex}
        aria-valuetext={`Step ${displayIndex + 1} of ${visibleSnapshots.length}: ${currentLabel}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div 
          className="timeline-scrubber-progress" 
          style={{ width: `${progress}%` }}
        />
        <div 
          className="timeline-scrubber-thumb"
          style={{ left: `${progress}%` }}
        />
      </div>
      <div className="timeline-scrubber-labels">
        <span>Step {displayIndex + 1} / {visibleSnapshots.length}</span>
        <span title={currentLabel}>{truncateLabel(currentLabel, 30)}</span>
      </div>
    </div>
  );
});

/**
 * Truncate label to max length with ellipsis
 */
function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return label.slice(0, maxLength - 3) + '...';
}

export default TimelineScrubber;
