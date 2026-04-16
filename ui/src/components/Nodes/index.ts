/**
 * Node type registration for ReactFlow.
 * 
 * This module exports all custom node components and the nodeTypes
 * object used by ReactFlow to render different node types.
 * 
 * To add a new node type:
 * 1. Create the component in this directory
 * 2. Import it here
 * 3. Add it to the nodeTypes object with a unique key
 * 4. Update the NodeType type in types/nodes.ts
 * 
 * Node type keys must match the 'type' field used when creating nodes.
 */

import { LlmAgentNode } from './LlmAgentNode';
import { SequentialNode } from './SequentialNode';
import { LoopNode } from './LoopNode';
import { ParallelNode } from './ParallelNode';
import { RouterNode } from './RouterNode';
import { StartNode, EndNode } from './StartEndNodes';
import { actionNodeTypes } from '../ActionNodes';

/**
 * Node types registry for ReactFlow.
 * Keys must match the NodeType type in types/nodes.ts.
 * 
 * Includes both agent node types and action node types.
 */
export const nodeTypes = {
  // Agent node types
  llm: LlmAgentNode,
  sequential: SequentialNode,
  loop: LoopNode,
  parallel: ParallelNode,
  router: RouterNode,
  start: StartNode,
  end: EndNode,
  // Action node types (prefixed with 'action_' to avoid conflicts)
  ...actionNodeTypes,
} as const;

/**
 * Type-safe node type keys.
 */
export type NodeTypeKey = keyof typeof nodeTypes;

// Re-export individual components for direct imports
export { LlmAgentNode } from './LlmAgentNode';
export { SequentialNode } from './SequentialNode';
export { LoopNode } from './LoopNode';
export { ParallelNode } from './ParallelNode';
export { RouterNode } from './RouterNode';
export { StartNode, EndNode } from './StartEndNodes';

// Re-export BaseNode for creating new node components
export { BaseNode } from './BaseNode';
export type { NodeType } from './BaseNode';
