import { describe, expect, it } from 'vitest';
import { getWorkflowBootstrapState } from './workflowBootstrap';
import type { Project } from '../types/project';
import { createManualTrigger } from '../components/MenuBar/templates';

function createProject(overrides?: Partial<Project>): Project {
  return {
    id: 'project-1',
    version: '0.8.0',
    name: 'Test',
    description: '',
    settings: {
      default_model: 'gemini-3.1-flash-lite-preview',
      env_vars: {},
    },
    agents: {},
    tools: {},
    tool_configs: {},
    actionNodes: {},
    workflow: {
      type: 'single',
      edges: [],
      conditions: [],
    },
    created_at: '2026-03-21T00:00:00Z',
    updated_at: '2026-03-21T00:00:00Z',
    ...overrides,
  };
}

describe('getWorkflowBootstrapState', () => {
  it('requires bootstrap on an empty project', () => {
    expect(getWorkflowBootstrapState(createProject())).toEqual({
      needsBootstrap: true,
      hasTrigger: false,
      triggerId: null,
    });
  });

  it('still requires bootstrap when only a trigger exists', () => {
    const project = createProject({
      actionNodes: {
        manual_trigger: createManualTrigger(),
      },
    });

    expect(getWorkflowBootstrapState(project)).toEqual({
      needsBootstrap: true,
      hasTrigger: true,
      triggerId: 'manual_trigger',
    });
  });

  it('does not bootstrap again once a workflow node exists', () => {
    const project = createProject({
      agents: {
        chat_agent: {
          type: 'llm',
          model: 'gemini-3.1-flash-lite-preview',
          instruction: 'hi',
          tools: [],
          sub_agents: [],
          position: { x: 0, y: 0 },
        },
      },
      actionNodes: {
        manual_trigger: createManualTrigger(),
      },
    });

    expect(getWorkflowBootstrapState(project)).toEqual({
      needsBootstrap: false,
      hasTrigger: true,
      triggerId: 'manual_trigger',
    });
  });
});
