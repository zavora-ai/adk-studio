/**
 * StatusIndicator Component for ADK Studio v2.0
 * 
 * Displays node execution status with visual indicators:
 * - idle: No indicator (hidden)
 * - running: Animated spinner
 * - success: Green checkmark
 * - error: Red X icon
 * - interrupted: Pulsing pause icon (HITL waiting for input)
 * 
 * Requirements: 7.4, 7.5, 7.6, 7.7
 * @see trigger-input-flow Requirement 3.3: Interrupt visual indicator
 */

import { memo } from 'react';

/**
 * Node execution status types
 * @see trigger-input-flow Requirement 3.3: 'interrupted' status for HITL
 */
export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'interrupted';

interface StatusIndicatorProps {
  /** Current status of the node */
  status: NodeStatus;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Size configurations for the indicator
 */
const sizeConfig = {
  sm: { container: 14, icon: 10 },
  md: { container: 18, icon: 12 },
  lg: { container: 22, icon: 14 },
};

/**
 * StatusIndicator displays the current execution state of a node.
 * 
 * - idle: Hidden (no visual indicator)
 * - running: Animated spinner indicating active processing
 * - success: Green checkmark indicating successful completion
 * - error: Red X indicating an error occurred
 * - interrupted: Pulsing pause icon indicating HITL waiting for input
 */
export const StatusIndicator = memo(function StatusIndicator({
  status,
  size = 'md',
  className = '',
}: StatusIndicatorProps) {
  // Don't render anything for idle state
  if (status === 'idle') {
    return null;
  }

  const { container, icon } = sizeConfig[size];

  return (
    <div
      className={`status-indicator status-${status} ${className}`}
      style={{
        width: container,
        height: container,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        flexShrink: 0,
      }}
      role="status"
      aria-label={getAriaLabel(status)}
    >
      {status === 'running' && <SpinnerIcon size={icon} />}
      {status === 'success' && <CheckmarkIcon size={icon} />}
      {status === 'error' && <ErrorIcon size={icon} />}
      {status === 'interrupted' && <InterruptedIcon size={icon} />}
    </div>
  );
});

/**
 * Get accessible label for the status
 */
function getAriaLabel(status: NodeStatus): string {
  switch (status) {
    case 'running':
      return 'Running';
    case 'success':
      return 'Completed successfully';
    case 'error':
      return 'Error occurred';
    case 'interrupted':
      return 'Waiting for human input';
    default:
      return 'Idle';
  }
}

/**
 * Animated spinner icon for running state
 * Requirement 7.5: WHEN a node is running, THE Status_Indicator SHALL show an animated spinner
 */
function SpinnerIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="status-spinner"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        style={{ opacity: 0.3 }}
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="23.55"
      />
    </svg>
  );
}

/**
 * Checkmark icon for success state
 * Requirement 7.6: WHEN a node completes successfully, THE Status_Indicator SHALL show a green checkmark
 */
function CheckmarkIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="status-success-icon"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * X icon for error state
 * Requirement 7.7: WHEN a node encounters an error, THE Status_Indicator SHALL show a red error icon
 */
function ErrorIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="status-error-icon"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Pause/hand icon for interrupted state (HITL waiting for input)
 * @see trigger-input-flow Requirement 3.3: Interrupt visual indicator
 */
function InterruptedIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="status-interrupted-icon"
    >
      {/* Hand/stop icon to indicate waiting for human input */}
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export default StatusIndicator;
