/**
 * Connection Validation Utilities for ADK Studio
 * 
 * Validates edge connections between action nodes and agents.
 * Ensures connection compatibility based on node types and port configurations.
 * 
 * @see Requirement 12.3: Edge connections to/from LLM agents
 */

import type { ActionNodeConfig } from '../types/actionNodes';
import type { AgentSchema } from '../types/project';

/**
 * Node type categories for connection validation.
 */
export type NodeCategory = 'start' | 'end' | 'agent' | 'action';

/**
 * Connection validation result.
 */
export interface ConnectionValidationResult {
  /** Whether the connection is valid */
  valid: boolean;
  /** Reason for invalid connection (if any) */
  reason?: string;
}

/**
 * Gets the category of a node based on its ID and type.
 */
export function getNodeCategory(
  nodeId: string,
  agents: Record<string, AgentSchema>,
  actionNodes: Record<string, ActionNodeConfig>
): NodeCategory {
  if (nodeId === 'START') return 'start';
  if (nodeId === 'END') return 'end';
  if (agents[nodeId]) return 'agent';
  if (actionNodes[nodeId]) return 'action';
  return 'agent'; // Default to agent for unknown nodes
}

/**
 * Checks if a node can have incoming connections (inputs).
 * 
 * @param nodeId - The node ID to check
 * @param actionNodes - Map of action node configurations
 * @returns true if the node can receive incoming connections
 */
export function canHaveInputs(
  nodeId: string,
  actionNodes: Record<string, ActionNodeConfig>
): boolean {
  // START node cannot have inputs
  if (nodeId === 'START') return false;
  
  // Check if it's a trigger action node (no inputs)
  const actionNode = actionNodes[nodeId];
  if (actionNode && actionNode.type === 'trigger') {
    return false;
  }
  
  // All other nodes can have inputs
  return true;
}

/**
 * Checks if a node can have outgoing connections (outputs).
 * 
 * @param nodeId - The node ID to check
 * @returns true if the node can have outgoing connections
 */
export function canHaveOutputs(nodeId: string): boolean {
  // END node cannot have outputs
  if (nodeId === 'END') return false;
  
  // All other nodes can have outputs
  return true;
}

/**
 * Gets the maximum number of input connections for a node.
 * 
 * @param nodeId - The node ID to check
 * @param actionNodes - Map of action node configurations
 * @returns Maximum number of inputs (Infinity for unlimited)
 */
export function getMaxInputs(
  nodeId: string,
  actionNodes: Record<string, ActionNodeConfig>
): number {
  // START and trigger nodes have no inputs
  if (nodeId === 'START') return 0;
  
  const actionNode = actionNodes[nodeId];
  if (actionNode) {
    // Trigger nodes have no inputs
    if (actionNode.type === 'trigger') return 0;
    
    // Merge nodes can have multiple inputs
    if (actionNode.type === 'merge') return Infinity;
  }
  
  // Default: single input
  return 1;
}

/**
 * Gets the maximum number of output connections for a node.
 * 
 * @param nodeId - The node ID to check
 * @param actionNodes - Map of action node configurations
 * @returns Maximum number of outputs (Infinity for unlimited)
 */
export function getMaxOutputs(
  nodeId: string,
  actionNodes: Record<string, ActionNodeConfig>
): number {
  // END node has no outputs
  if (nodeId === 'END') return 0;
  
  const actionNode = actionNodes[nodeId];
  if (actionNode) {
    // Switch nodes can have multiple outputs (one per condition + default)
    if (actionNode.type === 'switch') {
      const conditions = actionNode.conditions?.length || 0;
      const hasDefault = actionNode.defaultBranch ? 1 : 0;
      return Math.max(1, conditions + hasDefault);
    }
  }
  
  // Default: unlimited outputs (can connect to multiple targets)
  return Infinity;
}

/**
 * Validates a connection between two nodes.
 * 
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param _agents - Map of agent schemas (unused but kept for API consistency)
 * @param actionNodes - Map of action node configurations
 * @param existingEdges - Existing edges in the workflow
 * @returns Validation result with reason if invalid
 */
export function validateConnection(
  sourceId: string,
  targetId: string,
  _agents: Record<string, AgentSchema>,
  actionNodes: Record<string, ActionNodeConfig>,
  existingEdges: Array<{ from: string; to: string }>
): ConnectionValidationResult {
  // Cannot connect to self
  if (sourceId === targetId) {
    return { valid: false, reason: 'Cannot connect a node to itself' };
  }
  
  // Check if source can have outputs
  if (!canHaveOutputs(sourceId)) {
    return { valid: false, reason: 'Source node cannot have outgoing connections' };
  }
  
  // Check if target can have inputs
  if (!canHaveInputs(targetId, actionNodes)) {
    const actionNode = actionNodes[targetId];
    if (actionNode?.type === 'trigger') {
      return { valid: false, reason: 'Trigger nodes are entry points and cannot have incoming connections' };
    }
    return { valid: false, reason: 'Target node cannot have incoming connections' };
  }
  
  // Check for duplicate connections
  const isDuplicate = existingEdges.some(
    e => e.from === sourceId && e.to === targetId
  );
  if (isDuplicate) {
    return { valid: false, reason: 'Connection already exists' };
  }
  
  // Check max inputs for target
  const maxInputs = getMaxInputs(targetId, actionNodes);
  if (maxInputs !== Infinity) {
    const currentInputs = existingEdges.filter(e => e.to === targetId).length;
    if (currentInputs >= maxInputs) {
      return { valid: false, reason: `Target node already has maximum inputs (${maxInputs})` };
    }
  }
  
  // All validations passed
  return { valid: true };
}

/**
 * Checks if a connection would create a cycle in the workflow.
 * This is a simple check that prevents direct back-edges.
 * Full cycle detection would require graph traversal.
 * 
 * @param sourceId - Source node ID
 * @param targetId - Target node ID
 * @param existingEdges - Existing edges in the workflow
 * @returns true if the connection would create a direct cycle
 */
export function wouldCreateDirectCycle(
  sourceId: string,
  targetId: string,
  existingEdges: Array<{ from: string; to: string }>
): boolean {
  // Check if there's already an edge from target to source
  return existingEdges.some(e => e.from === targetId && e.to === sourceId);
}

/**
 * Gets the output port ID for a connection from a switch node.
 * 
 * @param sourceId - Source node ID
 * @param actionNodes - Map of action node configurations
 * @param sourceHandle - The source handle ID from ReactFlow
 * @returns The output port ID or undefined
 */
export function getOutputPortId(
  sourceId: string,
  actionNodes: Record<string, ActionNodeConfig>,
  sourceHandle?: string | null
): string | undefined {
  const actionNode = actionNodes[sourceId];
  if (!actionNode || actionNode.type !== 'switch') {
    return undefined;
  }
  
  // If a specific handle was used, return it
  if (sourceHandle) {
    return sourceHandle;
  }
  
  // Default to first condition's output port or default branch
  if (actionNode.conditions?.length > 0) {
    return actionNode.conditions[0].outputPort;
  }
  
  return actionNode.defaultBranch;
}

/**
 * Gets the input port ID for a connection to a merge node.
 * 
 * @param targetId - Target node ID
 * @param actionNodes - Map of action node configurations
 * @param targetHandle - The target handle ID from ReactFlow
 * @returns The input port ID or undefined
 */
export function getInputPortId(
  targetId: string,
  actionNodes: Record<string, ActionNodeConfig>,
  targetHandle?: string | null
): string | undefined {
  const actionNode = actionNodes[targetId];
  if (!actionNode || actionNode.type !== 'merge') {
    return undefined;
  }
  
  // If a specific handle was used, return it
  if (targetHandle) {
    return targetHandle;
  }
  
  // Default to first branch key or input-0
  if (actionNode.branchKeys && actionNode.branchKeys.length > 0) {
    return actionNode.branchKeys[0];
  }
  
  return 'input-0';
}
