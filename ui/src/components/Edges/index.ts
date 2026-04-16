/**
 * Edge type registration for ReactFlow.
 * 
 * This module exports all custom edge components and the edgeTypes
 * object used by ReactFlow to render different edge types.
 * 
 * To add a new edge type:
 * 1. Create the component in this directory
 * 2. Import it here
 * 3. Add it to the edgeTypes object with a unique key
 * 4. Update the EdgeType type in types/nodes.ts
 * 
 * Edge type keys must match the 'type' field used when creating edges.
 */

import { AnimatedEdge } from './AnimatedEdge';
import { DataFlowEdge } from './DataFlowEdge';

/**
 * Edge types registry for ReactFlow.
 * Keys must match the EdgeType type in types/nodes.ts.
 */
export const edgeTypes = {
  animated: AnimatedEdge,
  dataflow: DataFlowEdge,
} as const;

/**
 * Type-safe edge type keys.
 */
export type EdgeTypeKey = keyof typeof edgeTypes;

// Re-export individual components for direct imports
export { AnimatedEdge } from './AnimatedEdge';
export type { AnimatedEdgeData } from './AnimatedEdge';
export { DataFlowEdge } from './DataFlowEdge';
export type { DataFlowEdgeData } from './DataFlowEdge';
