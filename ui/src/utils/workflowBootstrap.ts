import { createManualTrigger } from '../components/MenuBar/templates';
import type { TriggerNodeConfig } from '../types/actionNodes';
import type { Project } from '../types/project';

export interface WorkflowBootstrapState {
  needsBootstrap: boolean;
  hasTrigger: boolean;
  triggerId: string | null;
}

export function getWorkflowBootstrapState(project: Project | null): WorkflowBootstrapState {
  if (!project) {
    return { needsBootstrap: false, hasTrigger: false, triggerId: null };
  }

  const actionNodes = Object.values(project.actionNodes || {});
  const triggerNode = actionNodes.find((node) => node.type === 'trigger') || null;
  const hasWorkflowNodes = Object.keys(project.agents).length > 0
    || actionNodes.some((node) => node.type !== 'trigger');

  return {
    needsBootstrap: !hasWorkflowNodes,
    hasTrigger: triggerNode !== null,
    triggerId: triggerNode?.id ?? null,
  };
}

export function createBootstrapTrigger(project: Project | null): { id: string; node: TriggerNodeConfig } {
  const existingTrigger = Object.values(project?.actionNodes || {}).find((node) => node.type === 'trigger');
  if (existingTrigger && existingTrigger.type === 'trigger') {
    return { id: existingTrigger.id, node: existingTrigger };
  }

  const triggerId = project?.actionNodes?.manual_trigger ? `manual_trigger_${Date.now()}` : 'manual_trigger';
  return {
    id: triggerId,
    node: createManualTrigger(triggerId),
  };
}
