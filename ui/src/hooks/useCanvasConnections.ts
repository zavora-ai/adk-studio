import { useCallback } from 'react';
import type { Node, Edge, Connection } from '@xyflow/react';
import type { Project, AgentSchema, ToolConfig } from '../types/project';
import { useStore } from '../store';
import { validateConnection } from '../utils/connectionValidation';
import type { AutobuildTriggerType } from './useBuild';

/**
 * Hook that manages ReactFlow connection and node event handlers for the Canvas.
 * Extracts onConnect, onEdgesDelete, onNodesDelete, onEdgeDoubleClick,
 * onNodeClick, onPaneClick, and agent/tool update helpers.
 *
 * @see Requirements 2.5, 2.6: Canvas delegates event handlers
 */
export function useCanvasConnections(deps: {
  currentProject: Project | null;
  removeAgentWithUndo: (nodeId: string) => void;
  removeActionNode: (nodeId: string) => void;
  invalidateBuild: (reason?: AutobuildTriggerType) => void;
  applyLayout: () => void;
  debouncedSave: () => void;
}) {
  const {
    currentProject,
    removeAgentWithUndo,
    removeActionNode,
    invalidateBuild,
    applyLayout,
    debouncedSave,
  } = deps;

  const {
    selectNode,
    selectActionNode,
    addEdge: addProjectEdge,
    removeEdge: removeProjectEdge,
    updateAgent: storeUpdateAgent,
    updateToolConfig: storeUpdateToolConfig,
    addToolToAgent,
    selectTool,
  } = useStore();

  // Connection handler
  // @see Requirement 12.3: Edge connections between action nodes and agents
  const onConnect = useCallback((p: Connection) => {
    if (p.source && p.target && currentProject) {
      const validation = validateConnection(
        p.source,
        p.target,
        currentProject.agents,
        currentProject.actionNodes || {},
        currentProject.workflow.edges
      );

      if (!validation.valid) {
        console.warn('Invalid connection:', validation.reason);
        return;
      }

      // Pass source/target handle IDs as port info for multi-port nodes (Switch, Merge)
      const fromPort = p.sourceHandle || undefined;
      const toPort = p.targetHandle || undefined;
      addProjectEdge(p.source, p.target, fromPort, toPort);
      invalidateBuild('onEdgeAdd');
    }
  }, [addProjectEdge, invalidateBuild, currentProject]);

  const onEdgesDelete = useCallback((eds: Edge[]) => {
    eds.forEach(e => removeProjectEdge(e.source, e.target));
    if (eds.length > 0) invalidateBuild('onEdgeDelete');
  }, [removeProjectEdge, invalidateBuild]);

  const onNodesDelete = useCallback((nds: Node[]) => {
    let hasActionNodeDeletion = false;
    let hasAgentDeletion = false;

    nds.forEach(n => {
      if (n.id === 'START' || n.id === 'END') return;

      if (n.type?.startsWith('action_')) {
        removeActionNode(n.id);
        hasActionNodeDeletion = true;
      } else {
        removeAgentWithUndo(n.id);
        hasAgentDeletion = true;
      }
    });

    // Only apply layout for action node deletions if no agent was deleted
    // (agent deletion already triggers applyLayout via removeAgentWithUndo)
    if (hasActionNodeDeletion && !hasAgentDeletion && useStore.getState().layoutMode === 'fixed') {
      invalidateBuild('onAgentDelete');
      setTimeout(() => applyLayout(), 100);
    }
  }, [removeAgentWithUndo, removeActionNode, invalidateBuild, applyLayout]);

  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, e: Edge) => {
    removeProjectEdge(e.source, e.target);
    invalidateBuild('onEdgeDelete');
  }, [removeProjectEdge, invalidateBuild]);

  const onNodeClick = useCallback((_: React.MouseEvent, n: Node) => {
    if (n.id === 'START' || n.id === 'END') {
      selectNode(null);
      selectActionNode(null);
      return;
    }

    if (n.type?.startsWith('action_')) {
      selectActionNode(n.id);
      selectNode(null);
    } else {
      selectNode(n.id);
      selectActionNode(null);
    }
  }, [selectNode, selectActionNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectActionNode(null);
  }, [selectNode, selectActionNode]);

  // Agent update with save and build invalidation
  const updateAgent = useCallback((id: string, updates: Partial<AgentSchema>) => {
    storeUpdateAgent(id, updates);
    invalidateBuild('onAgentUpdate');
    debouncedSave();
  }, [storeUpdateAgent, invalidateBuild, debouncedSave]);

  // Tool config update with save and build invalidation
  const updateToolConfig = useCallback((toolId: string, config: ToolConfig) => {
    storeUpdateToolConfig(toolId, config);
    invalidateBuild('onToolUpdate');
    debouncedSave();
  }, [storeUpdateToolConfig, invalidateBuild, debouncedSave]);

  // Tool add handler
  const handleAddTool = useCallback((type: string) => {
    const selectedNodeId = useStore.getState().selectedNodeId;
    if (!selectedNodeId) return;
    addToolToAgent(selectedNodeId, type);
    const tools = currentProject?.agents[selectedNodeId]?.tools || [];
    const isMulti = type === 'function' || type === 'mcp';
    const newId = isMulti
      ? `${selectedNodeId}_${type}_${tools.filter(t => t.startsWith(type)).length + 1}`
      : `${selectedNodeId}_${type}`;
    setTimeout(() => selectTool(newId), 0);
  }, [currentProject, addToolToAgent, selectTool]);

  return {
    onConnect,
    onEdgesDelete,
    onNodesDelete,
    onEdgeDoubleClick,
    onNodeClick,
    onPaneClick,
    updateAgent,
    updateToolConfig,
    handleAddTool,
  };
}
