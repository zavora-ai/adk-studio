import type { StateCreator } from 'zustand';
import type { Project, AgentSchema, ToolConfig, Edge, Position } from '../../types/project';
import { reconnectEdgesOnRemoval } from '../utils/edgeReconnection';

/**
 * Full store state type.
 * Defined here so the slice can access cross-slice state via get().
 * When slices are composed in the main store, this will be replaced
 * by the actual composed StudioState type.
 */
export interface StudioState {
  // Canvas slice state
  selectedNodeId: string | null;
  selectedToolId: string | null;

  // Cross-slice state accessed by canvas actions
  currentProject: Project | null;

  // Cross-slice actions accessed by canvas actions
  saveProject: () => Promise<void>;
}

export interface CanvasSlice {
  // State
  selectedNodeId: string | null;
  selectedToolId: string | null;

  // Actions
  selectNode: (id: string | null) => void;
  updateAgent: (id: string, updates: Partial<AgentSchema>) => void;
  renameAgent: (oldId: string, newId: string) => void;
  addAgent: (id: string, agent: AgentSchema) => void;
  removeAgent: (id: string) => void;
  addEdge: (from: string, to: string, fromPort?: string, toPort?: string) => void;
  removeEdge: (from: string, to: string) => void;
  setEdges: (edges: Edge[]) => void;
  addToolToAgent: (agentId: string, toolType: string) => void;
  removeToolFromAgent: (agentId: string, toolType: string) => void;
  addSubAgentToContainer: (containerId: string) => void;
  selectTool: (toolId: string | null) => void;
  updateToolConfig: (toolId: string, config: ToolConfig) => void;
  updateNodePositions: (positions: Record<string, Position>) => void;
}

export const createCanvasSlice: StateCreator<StudioState, [], [], CanvasSlice> = (set, get) => ({
  // State
  selectedNodeId: null,
  selectedToolId: null,

  // Actions
  selectNode: (id) => set({ selectedNodeId: id }),

  updateAgent: (id, updates) =>
    set((s) => {
      if (!s.currentProject) return s;
      return {
        currentProject: {
          ...s.currentProject,
          agents: {
            ...s.currentProject.agents,
            [id]: { ...s.currentProject.agents[id], ...updates },
          },
        },
      };
    }),

  renameAgent: (oldId, newId) => {
    if (oldId === newId) return;
    set((s) => {
      if (!s.currentProject || !s.currentProject.agents[oldId]) return s;

      // Clone agents, add new key, remove old
      const agents = { ...s.currentProject.agents };
      agents[newId] = agents[oldId];
      delete agents[oldId];

      // Update sub_agents references in containers
      Object.keys(agents).forEach((id) => {
        if (agents[id].sub_agents?.includes(oldId)) {
          agents[id] = {
            ...agents[id],
            sub_agents: agents[id].sub_agents.map((s) => (s === oldId ? newId : s)),
          };
        }
      });

      // Update edges
      const edges = s.currentProject.workflow.edges.map((e) => ({
        ...e,
        from: e.from === oldId ? newId : e.from,
        to: e.to === oldId ? newId : e.to,
      }));

      // Update tool configs
      const toolConfigs = { ...s.currentProject.tool_configs };
      Object.keys(toolConfigs).forEach((key) => {
        if (key.startsWith(`${oldId}_`)) {
          const newKey = key.replace(`${oldId}_`, `${newId}_`);
          toolConfigs[newKey] = toolConfigs[key];
          delete toolConfigs[key];
        }
      });

      return {
        currentProject: {
          ...s.currentProject,
          agents,
          tool_configs: toolConfigs,
          workflow: { ...s.currentProject.workflow, edges },
        },
        selectedNodeId: s.selectedNodeId === oldId ? newId : s.selectedNodeId,
      };
    });
    get().saveProject();
  },

  addAgent: (id, agent) => {
    set((s) => {
      if (!s.currentProject) return s;
      return {
        currentProject: {
          ...s.currentProject,
          agents: { ...s.currentProject.agents, [id]: agent },
        },
      };
    });
    // Auto-save after state update
    setTimeout(() => get().saveProject(), 0);
  },

  removeAgent: (id) => {
    set((s) => {
      if (!s.currentProject) return s;
      const agent = s.currentProject.agents[id];

      // Collect all agents to remove (including sub-agents for containers)
      const agentsToRemove = [id];
      if (agent?.sub_agents) {
        agentsToRemove.push(...agent.sub_agents);
      }

      // Remove all agents
      const agents = { ...s.currentProject.agents };
      agentsToRemove.forEach((agentId) => delete agents[agentId]);

      // Remove tool configs for all removed agents
      const toolConfigs = { ...s.currentProject.tool_configs };
      Object.keys(toolConfigs).forEach((key) => {
        if (agentsToRemove.some((agentId) => key.startsWith(`${agentId}_`))) {
          delete toolConfigs[key];
        }
      });

      // Get all action nodes
      const actionNodes = s.currentProject.actionNodes || {};

      // Reconnect edges using shared utility
      const remainingAgentIds = Object.keys(agents);
      const actionNodeIds = Object.keys(actionNodes);
      const allNodeIds = [...remainingAgentIds, ...actionNodeIds];

      const finalEdges = reconnectEdgesOnRemoval({
        removedIds: agentsToRemove,
        currentEdges: s.currentProject.workflow.edges,
        remainingNodeIds: allNodeIds,
      });

      return {
        currentProject: {
          ...s.currentProject,
          agents,
          tool_configs: toolConfigs,
          workflow: {
            ...s.currentProject.workflow,
            edges: finalEdges,
          },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  addEdge: (from, to, fromPort, toPort) => {
    set((s) => {
      if (!s.currentProject) return s;
      const edge: Edge = { from, to };
      if (fromPort) edge.fromPort = fromPort;
      if (toPort) edge.toPort = toPort;
      return {
        currentProject: {
          ...s.currentProject,
          workflow: {
            ...s.currentProject.workflow,
            edges: [...s.currentProject.workflow.edges, edge],
          },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  removeEdge: (from, to) => {
    set((s) => {
      if (!s.currentProject) return s;
      return {
        currentProject: {
          ...s.currentProject,
          workflow: {
            ...s.currentProject.workflow,
            edges: s.currentProject.workflow.edges.filter(
              (e) => !(e.from === from && e.to === to)
            ),
          },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  setEdges: (edges) => {
    set((s) => {
      if (!s.currentProject) return s;
      return {
        currentProject: {
          ...s.currentProject,
          workflow: {
            ...s.currentProject.workflow,
            edges,
          },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  addToolToAgent: (agentId, toolType) => {
    set((s) => {
      if (!s.currentProject) return s;
      const agent = s.currentProject.agents[agentId];
      if (!agent) return s;

      // For function and mcp tools, generate unique ID to allow multiple
      let toolId = toolType;
      if (toolType === 'function' || toolType === 'mcp') {
        const existing = agent.tools.filter((t) => t.startsWith(toolType));
        toolId = `${toolType}_${existing.length + 1}`;
      } else if (agent.tools.includes(toolType)) {
        return s; // Other tools can only be added once
      }

      return {
        currentProject: {
          ...s.currentProject,
          agents: {
            ...s.currentProject.agents,
            [agentId]: { ...agent, tools: [...agent.tools, toolId] },
          },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  removeToolFromAgent: (agentId, toolType) => {
    set((s) => {
      if (!s.currentProject) return s;
      const agent = s.currentProject.agents[agentId];
      if (!agent) return s;
      const toolConfigId = `${agentId}_${toolType}`;
      const { [toolConfigId]: _, ...remainingConfigs } = s.currentProject.tool_configs;
      return {
        currentProject: {
          ...s.currentProject,
          agents: {
            ...s.currentProject.agents,
            [agentId]: { ...agent, tools: agent.tools.filter((t) => t !== toolType) },
          },
          tool_configs: remainingConfigs,
        },
        selectedToolId: s.selectedToolId === toolConfigId ? null : s.selectedToolId,
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  addSubAgentToContainer: (containerId) => {
    const { currentProject, saveProject } = get();
    if (!currentProject) return;
    const container = currentProject.agents[containerId];
    if (!container) return;
    const subCount = container.sub_agents.length + 1;
    const newId = `${containerId}_agent_${subCount}`;

    // Use set directly to add the sub-agent and update the container atomically
    set((s) => {
      if (!s.currentProject) return s;
      const newAgent: AgentSchema = {
        type: 'llm',
        model: 'gemini-3.1-flash-lite-preview',
        instruction: `You are agent ${subCount}.`,
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      };
      return {
        currentProject: {
          ...s.currentProject,
          agents: {
            ...s.currentProject.agents,
            [newId]: newAgent,
            [containerId]: {
              ...s.currentProject.agents[containerId],
              sub_agents: [...s.currentProject.agents[containerId].sub_agents, newId],
            },
          },
        },
      };
    });
    setTimeout(() => saveProject(), 0);
  },

  selectTool: (toolId) => set({ selectedToolId: toolId }),

  updateToolConfig: (toolId, config) => {
    set((s) => {
      if (!s.currentProject) return s;
      return {
        currentProject: {
          ...s.currentProject,
          tool_configs: { ...s.currentProject.tool_configs, [toolId]: config },
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },

  updateNodePositions: (positions) => {
    set((s) => {
      if (!s.currentProject || Object.keys(positions).length === 0) return s;

      const agents = { ...s.currentProject.agents };
      const actionNodes = { ...(s.currentProject.actionNodes || {}) };
      let changed = false;

      for (const [id, position] of Object.entries(positions)) {
        if (id === 'START' || id === 'END') continue;

        if (agents[id]) {
          const current = agents[id].position;
          if (current.x !== position.x || current.y !== position.y) {
            agents[id] = { ...agents[id], position };
            changed = true;
          }
          continue;
        }

        if (actionNodes[id]) {
          const current = actionNodes[id].position;
          if (!current || current.x !== position.x || current.y !== position.y) {
            actionNodes[id] = { ...actionNodes[id], position };
            changed = true;
          }
        }
      }

      if (!changed) return s;

      return {
        currentProject: {
          ...s.currentProject,
          agents,
          actionNodes,
        },
      };
    });
    setTimeout(() => get().saveProject(), 0);
  },
});
