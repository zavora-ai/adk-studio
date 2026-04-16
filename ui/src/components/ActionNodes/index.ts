/**
 * Action Node Components for ADK Studio
 * 
 * This module exports all action node components and the actionNodeTypes
 * object used by ReactFlow to render different action node types.
 * 
 * Action nodes are non-LLM programmatic nodes for deterministic operations:
 * - Trigger: Workflow entry points (manual, webhook, schedule, event)
 * - HTTP: API calls and HTTP requests
 * - Set: Variable definition and manipulation
 * - Transform: Data transformation and mapping
 * - Switch: Conditional branching
 * - Loop: Iteration over arrays or conditions
 * - Merge: Combining multiple branches
 * - Wait: Delays and timing
 * - Code: Custom JavaScript/TypeScript execution
 * - Database: SQL/NoSQL operations
 * - Email: Email monitoring and sending
 * - Notification: Slack, Discord, Teams, and webhook notifications
 * - RSS: RSS/Atom feed monitoring
 * 
 * @see Requirements 2-11, 14, 15, 17, 12.1, 12.3
 */

// Re-export ActionNodeBase for creating new action node components
export { 
  ActionNodeBase, 
  ACTION_NODE_COLORS, 
  ACTION_NODE_ICONS,
  ACTION_NODE_LABELS,
} from './ActionNodeBase';

// Export individual action node components
export { TriggerNode } from './TriggerNode';
export { HttpNode } from './HttpNode';
export { SetNode } from './SetNode';
export { TransformNode } from './TransformNode';
export { SwitchNode } from './SwitchNode';
export { LoopActionNode } from './LoopActionNode';
export { MergeNode } from './MergeNode';
export { WaitNode } from './WaitNode';
export { CodeNode } from './CodeNode';
export { DatabaseNode } from './DatabaseNode';
export { EmailNode } from './EmailNode';
export { NotificationNode } from './NotificationNode';
export { RssNode } from './RssNode';
export { FileNode } from './FileNode';

/**
 * Action node types registry for ReactFlow.
 * Keys match the ActionNodeType type in types/actionNodes.ts.
 * 
 * Note: 'action_loop' is used instead of 'loop' to avoid conflict
 * with the existing agent LoopNode type.
 */
import { TriggerNode } from './TriggerNode';
import { HttpNode } from './HttpNode';
import { SetNode } from './SetNode';
import { TransformNode } from './TransformNode';
import { SwitchNode } from './SwitchNode';
import { LoopActionNode } from './LoopActionNode';
import { MergeNode } from './MergeNode';
import { WaitNode } from './WaitNode';
import { CodeNode } from './CodeNode';
import { DatabaseNode } from './DatabaseNode';
import { EmailNode } from './EmailNode';
import { NotificationNode } from './NotificationNode';
import { RssNode } from './RssNode';
import { FileNode } from './FileNode';

export const actionNodeTypes = {
  action_trigger: TriggerNode,
  action_http: HttpNode,
  action_set: SetNode,
  action_transform: TransformNode,
  action_switch: SwitchNode,
  action_loop: LoopActionNode,
  action_merge: MergeNode,
  action_wait: WaitNode,
  action_code: CodeNode,
  action_database: DatabaseNode,
  action_email: EmailNode,
  action_notification: NotificationNode,
  action_rss: RssNode,
  action_file: FileNode,
} as const;

/**
 * Type-safe action node type keys.
 */
export type ActionNodeTypeKey = keyof typeof actionNodeTypes;

// Export types
export type { ActionNodeType } from '../../types/actionNodes';
