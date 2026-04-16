/**
 * Template walkthrough hook for ADK Studio v2.0
 * 
 * Manages template-specific walkthrough state when users load a template.
 * Guides users through configuring and using the template step by step.
 * 
 * Requirements: Task 35 - n8n-Inspired Workflow Templates
 */

import { create } from 'zustand';
import type { Template } from '../components/Templates/templates';

/**
 * Template walkthrough step definition
 */
export interface TemplateWalkthroughStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  tips: string[];
  /** Optional: highlight specific node IDs */
  highlightNodes?: string[];
  /** Optional: action button */
  action?: {
    label: string;
    type: 'open-env' | 'open-docs' | 'highlight-node' | 'run-workflow';
  };
}

/**
 * Generate walkthrough steps for a template
 */
export function generateTemplateWalkthroughSteps(template: Template): TemplateWalkthroughStep[] {
  const steps: TemplateWalkthroughStep[] = [];
  
  // Step 1: Welcome/Overview
  steps.push({
    id: 'overview',
    title: `Welcome to ${template.name}`,
    description: template.useCase || template.description,
    icon: template.icon,
    tips: [
      `This template includes ${Object.keys(template.agents).length} AI agent(s)`,
      ...(template.actionNodes ? [`${Object.keys(template.actionNodes).length} action node(s) for automation`] : []),
      `${template.edges.length} connections between nodes`,
    ],
  });
  
  // Step 2: Environment Variables (if any)
  if (template.envVars && template.envVars.length > 0) {
    const requiredVars = template.envVars.filter(v => v.required);
    const optionalVars = template.envVars.filter(v => !v.required);
    
    steps.push({
      id: 'env-vars',
      title: 'Configure Environment Variables',
      description: 'This template requires some configuration before it can run. Set up the following environment variables:',
      icon: '🔑',
      tips: [
        ...requiredVars.map(v => `${v.name} (required): ${v.description}`),
        ...(optionalVars.length > 0 ? [`Plus ${optionalVars.length} optional variable(s)`] : []),
      ],
      action: {
        label: 'Open Settings',
        type: 'open-env',
      },
    });
  }
  
  // Step 3: AI Agents Overview
  const agentEntries = Object.entries(template.agents);
  if (agentEntries.length > 0) {
    const agentTips = agentEntries.slice(0, 4).map(([id, agent]) => {
      const typeLabel = agent.type === 'llm' ? 'LLM Agent' : 
                       agent.type === 'sequential' ? 'Sequential' :
                       agent.type === 'parallel' ? 'Parallel' :
                       agent.type === 'loop' ? 'Loop' :
                       agent.type === 'router' ? 'Router' : agent.type;
      return `${id}: ${typeLabel}${agent.tools?.length ? ` with ${agent.tools.length} tool(s)` : ''}`;
    });
    
    if (agentEntries.length > 4) {
      agentTips.push(`...and ${agentEntries.length - 4} more agent(s)`);
    }
    
    steps.push({
      id: 'agents',
      title: 'AI Agents in This Workflow',
      description: 'This template uses AI agents to process and analyze data. Click on any agent to customize its instructions.',
      icon: '🤖',
      tips: agentTips,
      highlightNodes: agentEntries.slice(0, 3).map(([id]) => id),
    });
  }
  
  // Step 4: Action Nodes Overview (if any)
  if (template.actionNodes && Object.keys(template.actionNodes).length > 0) {
    const actionEntries = Object.entries(template.actionNodes);
    const nodeTypes = [...new Set(actionEntries.map(([, node]) => node.type))];
    
    const nodeTypeLabels: Record<string, string> = {
      trigger: '🎯 Trigger - Starts the workflow',
      http: '🌐 HTTP - API calls and webhooks',
      database: '🗄️ Database - Data storage',
      email: '📧 Email - Send/receive emails',
      transform: '⚙️ Transform - Data manipulation',
      switch: '🔀 Switch - Conditional routing',
      loop: '🔄 Loop - Iterate over items',
      wait: '⏱️ Wait - Delays and scheduling',
      notification: '🔔 Notification - Alerts',
      set: '📝 Set - Variables',
    };
    
    steps.push({
      id: 'action-nodes',
      title: 'Action Nodes for Automation',
      description: 'Action nodes handle the non-AI parts of your workflow like API calls, database operations, and notifications.',
      icon: '⚡',
      tips: nodeTypes.slice(0, 5).map(type => nodeTypeLabels[type] || `${type} node`),
      highlightNodes: actionEntries.slice(0, 3).map(([id]) => id),
    });
  }
  
  // Step 5: Customization Tips
  if (template.customizationTips && template.customizationTips.length > 0) {
    steps.push({
      id: 'customization',
      title: 'Customize for Your Needs',
      description: 'Here are some ways you can adapt this template to your specific use case:',
      icon: '✨',
      tips: template.customizationTips.slice(0, 5),
    });
  }
  
  // Step 6: Documentation (if available)
  steps.push({
    id: 'docs',
    title: 'Learn More',
    description: 'Check out the full documentation for detailed setup instructions, examples, and troubleshooting tips.',
    icon: '📚',
    tips: [
      'View detailed setup instructions',
      'See example configurations',
      'Troubleshooting common issues',
      'Best practices and tips',
    ],
    action: {
      label: 'View Documentation',
      type: 'open-docs',
    },
  });
  
  // Step 7: Ready to Run
  steps.push({
    id: 'ready',
    title: 'Ready to Go!',
    description: 'Your template is loaded and ready. Configure any remaining settings, then build and run your workflow!',
    icon: '🚀',
    tips: [
      'Click "Build" to compile your workflow',
      'Use the console to test with sample inputs',
      'Watch the timeline to see execution flow',
      'Check node states in the inspector panel',
    ],
    action: {
      label: 'Run Workflow',
      type: 'run-workflow',
    },
  });
  
  return steps;
}

/**
 * Template walkthrough store state
 */
interface TemplateWalkthroughState {
  /** Currently active template for walkthrough */
  template: Template | null;
  /** Generated walkthrough steps */
  steps: TemplateWalkthroughStep[];
  /** Current step index */
  currentStep: number;
  /** Whether the walkthrough modal is visible */
  isVisible: boolean;
  /** Start walkthrough for a template */
  start: (template: Template) => void;
  /** Go to next step */
  next: () => void;
  /** Go to previous step */
  previous: () => void;
  /** Go to specific step */
  goToStep: (index: number) => void;
  /** Skip/close the walkthrough */
  skip: () => void;
  /** Complete the walkthrough */
  complete: () => void;
  /** Reset state */
  reset: () => void;
}

/**
 * Template walkthrough store
 */
export const useTemplateWalkthrough = create<TemplateWalkthroughState>((set, get) => ({
  template: null,
  steps: [],
  currentStep: 0,
  isVisible: false,
  
  start: (template: Template) => {
    const steps = generateTemplateWalkthroughSteps(template);
    set({
      template,
      steps,
      currentStep: 0,
      isVisible: true,
    });
  },
  
  next: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      // Last step - complete
      get().complete();
    }
  },
  
  previous: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },
  
  goToStep: (index: number) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStep: index });
    }
  },
  
  skip: () => {
    set({ isVisible: false });
  },
  
  complete: () => {
    set({ isVisible: false });
  },
  
  reset: () => {
    set({
      template: null,
      steps: [],
      currentStep: 0,
      isVisible: false,
    });
  },
}));
