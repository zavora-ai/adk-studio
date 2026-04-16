/**
 * Tooltip Component for ADK Studio
 * 
 * Provides contextual help and descriptions for UI elements.
 * Supports multiple positions and custom styling.
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import './Tooltip.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Content to display in the tooltip */
  content: ReactNode;
  /** Element that triggers the tooltip */
  children: ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Maximum width of the tooltip */
  maxWidth?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Tooltip component that displays contextual information on hover.
 * 
 * @example
 * <Tooltip content="This is a helpful tip">
 *   <button>Hover me</button>
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 250,
  disabled = false,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords(calculatePosition(rect, position));
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setCoords(calculatePosition(triggerRect, position, tooltipRect));
    }
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className={`tooltip-trigger ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position}`}
          style={{
            left: coords.x,
            top: coords.y,
            maxWidth,
          }}
          role="tooltip"
        >
          <div className="tooltip-content">{content}</div>
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
}

/**
 * Calculate tooltip position based on trigger element and desired position
 */
function calculatePosition(
  triggerRect: DOMRect,
  position: TooltipPosition,
  tooltipRect?: DOMRect
): { x: number; y: number } {
  const gap = 8; // Gap between trigger and tooltip
  const tooltipWidth = tooltipRect?.width || 0;
  const tooltipHeight = tooltipRect?.height || 0;

  switch (position) {
    case 'top':
      return {
        x: triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2,
        y: triggerRect.top - tooltipHeight - gap,
      };
    case 'bottom':
      return {
        x: triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2,
        y: triggerRect.bottom + gap,
      };
    case 'left':
      return {
        x: triggerRect.left - tooltipWidth - gap,
        y: triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2,
      };
    case 'right':
      return {
        x: triggerRect.right + gap,
        y: triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2,
      };
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Action node tooltip descriptions
 */
export const ACTION_NODE_TOOLTIPS = {
  // Node types
  trigger: 'Entry point for workflow execution. Supports manual, webhook, schedule, and event triggers.',
  http: 'Make HTTP requests to external APIs. Supports GET, POST, PUT, PATCH, DELETE methods with authentication.',
  set: 'Define and manipulate workflow state variables. Supports set, merge, and delete operations.',
  transform: 'Transform data using JSONPath, JMESPath, templates, or JavaScript expressions.',
  switch: 'Conditional branching based on field values or expressions. Routes to different output ports.',
  loop: 'Iterate over arrays (forEach), repeat while condition (while), or fixed times. Supports parallel execution.',
  merge: 'Combine multiple branches back into single flow. Wait for all, any, or N branches.',
  wait: 'Pause workflow execution for a duration, until a timestamp, or until a condition is met.',
  code: 'Execute custom JavaScript/TypeScript code in a secure sandbox environment.',
  database: 'Perform database operations on PostgreSQL, MySQL, SQLite, MongoDB, or Redis.',
  email: 'Monitor incoming emails via IMAP or send outgoing emails via SMTP.',
  notification: 'Send notifications to Slack, Discord, Microsoft Teams, or custom webhooks.',
  rss: 'Monitor RSS/Atom feeds for new entries. Supports filtering by keywords, date, and categories.',
  file: 'Read, write, delete, or list files from local storage or cloud providers (S3, GCS, Azure).',

  // Standard properties
  errorHandling: 'Configure how errors are handled: stop execution, continue, retry, or use fallback value.',
  tracing: 'Enable detailed execution traces and configure log level for debugging.',
  callbacks: 'Define functions to call at different lifecycle stages: onStart, onComplete, onError.',
  executionControl: 'Set timeout and skip conditions for node execution.',
  inputOutputMapping: 'Map state fields to node inputs and define where results are stored.',

  // HTTP specific
  httpMethod: 'HTTP method to use for the request.',
  httpUrl: 'URL to send the request to. Supports {{variable}} interpolation.',
  httpAuth: 'Authentication method: none, bearer token, basic auth, or API key.',
  httpHeaders: 'Custom HTTP headers to include in the request.',
  httpBody: 'Request body content. Supports JSON, form data, or raw text.',
  httpResponse: 'Configure response handling: type, status validation, and JSONPath extraction.',
  httpRateLimit: 'Limit request rate to avoid overwhelming the target API.',

  // Trigger specific
  triggerType: 'How the workflow is triggered: manually, via webhook, on schedule, or by event.',
  webhookPath: 'URL path for the webhook endpoint.',
  webhookMethod: 'HTTP method accepted by the webhook.',
  webhookAuth: 'Authentication required for webhook requests.',
  cronExpression: 'Cron expression defining the schedule (minute hour day month weekday).',
  timezone: 'Timezone for schedule evaluation.',

  // Set specific
  setMode: 'Operation mode: set (create/overwrite), merge (deep merge), or delete (remove).',
  variables: 'Variables to set in the workflow state.',
  envVars: 'Load environment variables from .env file.',

  // Transform specific
  transformType: 'Transformation method: JSONPath, JMESPath, template, or JavaScript.',
  expression: 'Transformation expression or code.',
  operations: 'Built-in operations: pick, omit, rename, flatten, sort, unique.',
  typeCoercion: 'Convert result to a specific type.',

  // Switch specific
  evaluationMode: 'first_match: stop at first match. all_match: evaluate all conditions.',
  conditions: 'Conditions to evaluate for routing.',
  defaultBranch: 'Output port to use when no conditions match.',
  expressionMode: 'Use JavaScript expression to determine branch.',

  // Loop specific
  loopType: 'Loop type: forEach (iterate array), while (condition), times (fixed count).',
  sourceArray: 'Path to array in state to iterate over.',
  itemVar: 'Variable name for current item in loop.',
  indexVar: 'Variable name for current index in loop.',
  parallel: 'Execute iterations in parallel for better performance.',
  batchSize: 'Number of items to process in parallel.',
  collectResults: 'Collect results from all iterations into an array.',

  // Merge specific
  mergeMode: 'wait_all: wait for all branches. wait_any: continue on first. wait_n: wait for N.',
  combineStrategy: 'How to combine branch outputs: array, object, first, or last.',
  branchTimeout: 'Maximum time to wait for branches to complete.',

  // Wait specific
  waitType: 'Wait type: fixed duration, until timestamp, webhook callback, or condition.',
  duration: 'How long to wait.',
  pollInterval: 'How often to check the condition.',
  maxWait: 'Maximum time to wait for condition.',

  // Code specific
  language: 'Programming language: JavaScript or TypeScript.',
  sandbox: 'Security settings for code execution.',
  networkAccess: 'Allow code to make network requests.',
  fileSystemAccess: 'Allow code to access the file system.',
  memoryLimit: 'Maximum memory the code can use.',
  timeLimit: 'Maximum execution time for the code.',

  // Database specific
  dbType: 'Database type: PostgreSQL, MySQL, SQLite, MongoDB, or Redis.',
  connectionString: 'Database connection string (stored securely).',
  sqlOperation: 'SQL operation: query, insert, update, delete, or upsert.',
  sqlQuery: 'SQL query with parameter placeholders.',
  mongoCollection: 'MongoDB collection name.',
  mongoOperation: 'MongoDB operation: find, findOne, insert, update, delete.',

  // RSS specific
  feedUrl: 'URL of the RSS or Atom feed to monitor.',
  rssPollInterval: 'How often to check the feed for new entries.',
  rssKeywords: 'Filter entries that contain any of these keywords in title or description.',
  rssCategories: 'Filter entries by category or tag.',
  rssDateFilter: 'Filter entries by publish date range.',
  seenTracking: 'Track seen items to prevent duplicate processing.',
  maxEntries: 'Maximum number of entries to return per poll.',
  includeContent: 'Include the full content of each entry, not just the summary.',
  parseMedia: 'Extract media attachments and enclosures from feed entries.',
};

export default Tooltip;
