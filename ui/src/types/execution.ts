export interface ToolCall {
  id: string;
  name: string;
  args: unknown;
  result?: unknown;
  status: 'pending' | 'running' | 'complete' | 'error';
}

/**
 * Data associated with a workflow interrupt (Human-in-the-Loop).
 * When a workflow emits an interrupt event, this data is captured
 * to display to the user and enable their response.
 * 
 * @see Requirements 3.1, 3.2: Interrupt detection and response
 */
export interface InterruptData {
  /** The node ID that triggered the interrupt */
  nodeId: string;
  /** Human-readable message explaining what input is needed */
  message: string;
  /** Additional context data from the interrupt */
  data: Record<string, unknown>;
}

/**
 * Node status for visual indicators.
 * @see Requirements 7.4, 7.5, 7.6, 7.7
 * @see trigger-input-flow Requirement 3.3: Interrupt visual indicator
 */
export type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'interrupted';

/**
 * State snapshot captured at each node during execution.
 * Used for timeline debugging and state inspection.
 * 
 * @see Requirements 5.8: State snapshot capture
 */
export interface StateSnapshot {
  /** The node/agent ID this snapshot belongs to */
  nodeId: string;
  /** Human-readable node label for display */
  nodeLabel?: string;
  /** Timestamp when the snapshot was captured */
  timestamp: number;
  /** Input state before node execution */
  inputState: Record<string, unknown>;
  /** Output state after node execution */
  outputState: Record<string, unknown>;
  /** Execution duration in milliseconds */
  duration: number;
  /** Execution status */
  status: 'running' | 'success' | 'error';
  /** Error message if status is 'error' */
  error?: string;
  /** Step number in the execution sequence */
  step?: number;
  /** Iteration number (for loop workflows) */
  iteration?: number;
}

/**
 * Timeline view state for managing the timeline UI.
 * @see Requirements 5.1, 5.2, 5.10
 */
export interface TimelineState {
  /** Whether the timeline is collapsed */
  isCollapsed: boolean;
  /** Current scrub position index */
  currentIndex: number;
  /** Whether timeline is in playback mode */
  isPlaying: boolean;
  /** Playback speed multiplier */
  playbackSpeed: number;
}

/**
 * SSE trace event payload for v2.0.
 * Enhanced with state snapshot support.
 */
export interface TraceEventPayload {
  type: 'node_start' | 'node_end' | 'state' | 'done';
  node?: string;
  step?: number;
  duration_ms?: number;
  total_steps?: number;
  /** v2.0: State snapshot for timeline/inspector */
  state_snapshot?: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
  /** v2.0: State keys for data flow overlays */
  state_keys?: string[];
  /** Legacy field for backward compatibility */
  state?: Record<string, unknown>;
}

/** Maximum number of snapshots to retain (best-effort) */
export const MAX_SNAPSHOTS = 100;

/**
 * Default timeline state.
 */
export const DEFAULT_TIMELINE_STATE: TimelineState = {
  isCollapsed: false,
  currentIndex: -1,
  isPlaying: false,
  playbackSpeed: 1,
};

export interface ExecutionState {
  isRunning: boolean;
  activeNode: string | null;
  activeSubAgent: string | null;
  thoughts: Record<string, string>;
  toolCalls: ToolCall[];
  iteration: number;
  startTime: number | null;
  /** v2.0: State snapshots for timeline debugging */
  snapshots: StateSnapshot[];
  /** v2.0: Current position in timeline (for scrubbing) */
  currentSnapshotIndex: number;
  /** v2.0: Timeline UI state */
  timeline: TimelineState;
}

/**
 * Initial execution state.
 */
export const INITIAL_EXECUTION_STATE: ExecutionState = {
  isRunning: false,
  activeNode: null,
  activeSubAgent: null,
  thoughts: {},
  toolCalls: [],
  iteration: 0,
  startTime: null,
  snapshots: [],
  currentSnapshotIndex: -1,
  timeline: DEFAULT_TIMELINE_STATE,
};
