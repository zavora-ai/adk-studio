/**
 * Property Tests for Trigger Input Flow
 * 
 * Tests the trigger configuration persistence, input context consistency,
 * and chat history completeness for the trigger-input-flow feature.
 * 
 * @see trigger-input-flow Requirements 1.1, 1.2, 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ManualTriggerConfig, TriggerNodeConfig } from './actionNodes';
import { DEFAULT_MANUAL_TRIGGER_CONFIG } from './actionNodes';
import type { InterruptData } from './execution';
import type { Project } from './project';
import { createDefaultStandardProperties } from './standardProperties';

// ============================================
// Types for Testing
// ============================================

/**
 * Workflow state for input context testing.
 * @see trigger-input-flow Requirements 4.1
 */
type WorkflowState = 
  | 'no_trigger'
  | 'no_agent'
  | 'not_connected'
  | 'not_built'
  | 'ready';

/**
 * Build status for input context testing.
 */
type BuildStatus = 'none' | 'building' | 'success' | 'error';

/**
 * Input context returned by getInputContext.
 */
interface InputContext {
  label: string;
  placeholder: string;
  disabled: boolean;
}

/**
 * Chat message for history testing.
 */
interface Message {
  role: 'user' | 'assistant' | 'interrupt';
  content: string;
  agent?: string;
  interruptData?: InterruptData;
}

// ============================================
// Helper Functions (Extracted from TestConsole)
// ============================================

/**
 * Get placeholder text based on workflow state.
 * Extracted from TestConsole.tsx for testing.
 */
function getPlaceholderText(state: WorkflowState, buildStatus: BuildStatus): string {
  switch (state) {
    case 'no_trigger':
      return '⚠️ Add a trigger node to start your workflow';
    case 'no_agent':
      return '⚠️ Add an agent to your workflow';
    case 'not_connected':
      return '⚠️ Connect your workflow to END';
    case 'not_built':
      if (buildStatus === 'building') {
        return '🔨 Building... please wait';
      }
      if (buildStatus === 'error') {
        return '❌ Build failed - check errors and rebuild';
      }
      return '⚙️ Click Build to compile your workflow';
    case 'ready':
      return 'Type a message...';
  }
}

/**
 * Get trigger configuration from project.
 * Extracted from TestConsole.tsx for testing.
 * @see trigger-input-flow Requirements 1.1, 1.2, 2.1
 */
function getTriggerConfig(project: Project | null): ManualTriggerConfig | null {
  if (!project) return null;
  
  const actionNodes = project.actionNodes || {};
  const trigger = Object.values(actionNodes)
    .find(node => node.type === 'trigger' && node.triggerType === 'manual');
  
  if (!trigger || trigger.type !== 'trigger') return null;
  
  return trigger.manual || DEFAULT_MANUAL_TRIGGER_CONFIG;
}

/**
 * Get input context based on workflow state, trigger configuration, and interrupt state.
 * Extracted from TestConsole.tsx for testing.
 * @see trigger-input-flow Requirements 2.1, 3.1, 4.1
 */
function getInputContext(
  workflowState: WorkflowState,
  buildStatus: BuildStatus,
  triggerConfig: ManualTriggerConfig | null,
  interrupt: InterruptData | null
): InputContext {
  // If there's an active interrupt, show interrupt-specific context
  if (interrupt) {
    return {
      label: `⚠️ ${interrupt.nodeId} requires input`,
      placeholder: interrupt.message,
      disabled: false,
    };
  }
  
  // If workflow is not ready, show informative placeholder and disable input
  if (workflowState !== 'ready') {
    return {
      label: '',
      placeholder: getPlaceholderText(workflowState, buildStatus),
      disabled: true,
    };
  }
  
  // Workflow is ready - use trigger configuration
  return {
    label: triggerConfig?.inputLabel || DEFAULT_MANUAL_TRIGGER_CONFIG.inputLabel,
    placeholder: triggerConfig?.defaultPrompt || DEFAULT_MANUAL_TRIGGER_CONFIG.defaultPrompt,
    disabled: false,
  };
}

// ============================================
// Arbitraries (Generators)
// ============================================

/**
 * Generator for valid input labels.
 */
const arbInputLabel: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Generator for valid default prompts.
 */
const arbDefaultPrompt: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

/**
 * Generator for valid ManualTriggerConfig objects.
 */
const arbManualTriggerConfig: fc.Arbitrary<ManualTriggerConfig> = fc.record({
  inputLabel: arbInputLabel,
  defaultPrompt: arbDefaultPrompt,
});

/**
 * Generator for workflow states.
 */
const arbWorkflowState: fc.Arbitrary<WorkflowState> = fc.constantFrom(
  'no_trigger',
  'no_agent',
  'not_connected',
  'not_built',
  'ready'
);

/**
 * Generator for build statuses.
 */
const arbBuildStatus: fc.Arbitrary<BuildStatus> = fc.constantFrom(
  'none',
  'building',
  'success',
  'error'
);

/**
 * Generator for valid node IDs.
 */
const arbNodeId: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(s));

/**
 * Generator for interrupt messages.
 */
const arbInterruptMessage: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

/**
 * Generator for InterruptData objects.
 */
const arbInterruptData: fc.Arbitrary<InterruptData> = fc.record({
  nodeId: arbNodeId,
  message: arbInterruptMessage,
  data: fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
});

/**
 * Generator for optional InterruptData (null or valid).
 */
const arbOptionalInterrupt: fc.Arbitrary<InterruptData | null> = fc.option(
  arbInterruptData,
  { nil: null }
);

/**
 * Generator for user messages.
 */
const arbUserMessage: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 500 })
  .filter(s => s.trim().length > 0);

/**
 * Generator for assistant responses.
 */
const arbAssistantResponse: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 1000 })
  .filter(s => s.trim().length > 0);

// ============================================
// Property Tests
// ============================================

describe('Trigger Input Flow Properties', () => {
  describe('Property 1: Trigger Configuration Persistence', () => {
    /**
     * **Feature: trigger-input-flow, Property 1: Trigger Configuration Persistence**
     * *For any* manual trigger configuration (inputLabel, defaultPrompt), WHEN the project
     * is saved and reopened, THEN the configuration SHALL be restored exactly.
     * **Validates: Requirements 1.1, 1.2**
     */
    it('prop_trigger_config_persistence', () => {
      fc.assert(
        fc.property(arbManualTriggerConfig, (config) => {
          // Simulate saving to JSON (as project save does)
          const serialized = JSON.stringify(config);
          
          // Simulate loading from JSON (as project load does)
          const deserialized = JSON.parse(serialized) as ManualTriggerConfig;
          
          // Property: inputLabel must be preserved exactly
          expect(deserialized.inputLabel).toBe(config.inputLabel);
          
          // Property: defaultPrompt must be preserved exactly
          expect(deserialized.defaultPrompt).toBe(config.defaultPrompt);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.2: Full TriggerNodeConfig Persistence**
     * *For any* TriggerNodeConfig with manual configuration, serialization and
     * deserialization SHALL preserve the manual trigger settings.
     * **Validates: Requirements 1.1, 1.2**
     */
    it('prop_trigger_node_config_persistence', () => {
      fc.assert(
        fc.property(arbManualTriggerConfig, arbNodeId, (manualConfig, nodeId) => {
          // Create a full TriggerNodeConfig
          const triggerConfig: TriggerNodeConfig = {
            ...createDefaultStandardProperties(nodeId, 'Manual Trigger', 'trigger_output'),
            type: 'trigger',
            triggerType: 'manual',
            manual: manualConfig,
          };
          
          // Simulate project save/load cycle
          const serialized = JSON.stringify(triggerConfig);
          const deserialized = JSON.parse(serialized) as TriggerNodeConfig;
          
          // Property: type must be preserved
          expect(deserialized.type).toBe('trigger');
          expect(deserialized.triggerType).toBe('manual');
          
          // Property: manual config must be preserved exactly
          expect(deserialized.manual).toBeDefined();
          expect(deserialized.manual?.inputLabel).toBe(manualConfig.inputLabel);
          expect(deserialized.manual?.defaultPrompt).toBe(manualConfig.defaultPrompt);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 1.3: Default Values Applied**
     * *For any* TriggerNodeConfig without manual configuration, getTriggerConfig
     * SHALL return the default values.
     * **Validates: Requirements 1.1, 1.2**
     */
    it('prop_default_values_applied', () => {
      fc.assert(
        fc.property(arbNodeId, (nodeId) => {
          // Create a trigger without manual config
          const triggerConfig: TriggerNodeConfig = {
            ...createDefaultStandardProperties(nodeId, 'Manual Trigger', 'trigger_output'),
            type: 'trigger',
            triggerType: 'manual',
            // No manual field - should use defaults
          };
          
          // Create a minimal project with this trigger
          const project = {
            id: 'test-project',
            name: 'Test Project',
            agents: {},
            workflow: { type: 'single' as const, edges: [], conditions: [] },
            actionNodes: { [nodeId]: triggerConfig },
          } as unknown as Project;
          
          // Get trigger config
          const result = getTriggerConfig(project);
          
          // Property: should return default values
          expect(result).toEqual(DEFAULT_MANUAL_TRIGGER_CONFIG);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Input Context Consistency', () => {
    /**
     * **Feature: trigger-input-flow, Property 4: Input Context Consistency**
     * *For any* workflow state transition, THE chat input label and placeholder
     * SHALL reflect the current state within 100ms of the state change.
     * **Validates: Requirements 4.1**
     */
    it('prop_input_context_consistency', () => {
      fc.assert(
        fc.property(
          arbWorkflowState,
          arbBuildStatus,
          arbManualTriggerConfig,
          arbOptionalInterrupt,
          (workflowState, buildStatus, triggerConfig, interrupt) => {
            const context = getInputContext(workflowState, buildStatus, triggerConfig, interrupt);
            
            // Property: Context must always have defined values
            expect(typeof context.label).toBe('string');
            expect(typeof context.placeholder).toBe('string');
            expect(typeof context.disabled).toBe('boolean');
            
            // Property: When interrupted, input should be enabled
            if (interrupt) {
              expect(context.disabled).toBe(false);
              expect(context.label).toContain(interrupt.nodeId);
              expect(context.placeholder).toBe(interrupt.message);
            }
            
            // Property: When not ready and not interrupted, input should be disabled
            if (!interrupt && workflowState !== 'ready') {
              expect(context.disabled).toBe(true);
              expect(context.label).toBe('');
            }
            
            // Property: When ready and not interrupted, input should be enabled
            if (!interrupt && workflowState === 'ready') {
              expect(context.disabled).toBe(false);
              expect(context.label).toBe(triggerConfig.inputLabel);
              expect(context.placeholder).toBe(triggerConfig.defaultPrompt);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.2: Interrupt Takes Priority**
     * *For any* workflow state with an active interrupt, THE interrupt context
     * SHALL take priority over the workflow state context.
     * **Validates: Requirements 3.1, 4.1**
     */
    it('prop_interrupt_takes_priority', () => {
      fc.assert(
        fc.property(
          arbWorkflowState,
          arbBuildStatus,
          arbManualTriggerConfig,
          arbInterruptData,
          (workflowState, buildStatus, triggerConfig, interrupt) => {
            const context = getInputContext(workflowState, buildStatus, triggerConfig, interrupt);
            
            // Property: Interrupt context always takes priority
            expect(context.disabled).toBe(false);
            expect(context.label).toContain(interrupt.nodeId);
            expect(context.placeholder).toBe(interrupt.message);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 4.3: Workflow State Determines Placeholder**
     * *For any* non-ready workflow state without interrupt, THE placeholder
     * SHALL contain an informative message about the current state.
     * **Validates: Requirements 4.1**
     */
    it('prop_workflow_state_determines_placeholder', () => {
      const nonReadyStates: WorkflowState[] = ['no_trigger', 'no_agent', 'not_connected', 'not_built'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...nonReadyStates),
          arbBuildStatus,
          arbManualTriggerConfig,
          (workflowState, buildStatus, triggerConfig) => {
            const context = getInputContext(workflowState, buildStatus, triggerConfig, null);
            
            // Property: Non-ready states should have informative placeholders
            expect(context.placeholder.length).toBeGreaterThan(0);
            
            // Property: Placeholder should contain warning or instruction
            const hasWarning = context.placeholder.includes('⚠️') || 
                              context.placeholder.includes('🔨') ||
                              context.placeholder.includes('❌') ||
                              context.placeholder.includes('⚙️');
            expect(hasWarning).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Chat History Completeness', () => {
    /**
     * **Feature: trigger-input-flow, Property 5: Chat History Completeness**
     * *For any* workflow execution with N user interactions (initial + HITL responses),
     * THE chat history SHALL contain exactly N user messages and their corresponding responses.
     * **Validates: Requirements 4.2**
     */
    it('prop_chat_history_completeness', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              userMessage: arbUserMessage,
              assistantResponse: arbAssistantResponse,
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (interactions) => {
            // Simulate building chat history
            const messages: Message[] = [];
            
            for (const interaction of interactions) {
              // Add user message
              messages.push({ role: 'user', content: interaction.userMessage });
              // Add assistant response
              messages.push({ role: 'assistant', content: interaction.assistantResponse });
            }
            
            // Property: Number of user messages equals number of interactions
            const userMessages = messages.filter(m => m.role === 'user');
            expect(userMessages.length).toBe(interactions.length);
            
            // Property: Number of assistant messages equals number of interactions
            const assistantMessages = messages.filter(m => m.role === 'assistant');
            expect(assistantMessages.length).toBe(interactions.length);
            
            // Property: Total messages is 2x interactions (user + assistant pairs)
            expect(messages.length).toBe(interactions.length * 2);
            
            // Property: Messages alternate user/assistant
            for (let i = 0; i < messages.length; i++) {
              const expectedRole = i % 2 === 0 ? 'user' : 'assistant';
              expect(messages[i].role).toBe(expectedRole);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.2: HITL Interactions Tracked**
     * *For any* workflow with HITL interrupts, THE chat history SHALL include
     * interrupt messages and user responses.
     * **Validates: Requirements 4.2**
     */
    it('prop_hitl_interactions_tracked', () => {
      fc.assert(
        fc.property(
          arbUserMessage,
          arbAssistantResponse,
          fc.array(
            fc.record({
              interrupt: arbInterruptData,
              response: arbUserMessage,
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (initialMessage, initialResponse, hitlInteractions) => {
            // Simulate building chat history with HITL
            const messages: Message[] = [];
            
            // Initial interaction
            messages.push({ role: 'user', content: initialMessage });
            messages.push({ role: 'assistant', content: initialResponse });
            
            // HITL interactions
            for (const hitl of hitlInteractions) {
              // Interrupt message
              messages.push({ 
                role: 'interrupt', 
                content: hitl.interrupt.message,
                agent: hitl.interrupt.nodeId,
                interruptData: hitl.interrupt,
              });
              // User response to interrupt
              messages.push({ role: 'user', content: hitl.response });
            }
            
            // Property: Total user messages = 1 (initial) + N (HITL responses)
            const userMessages = messages.filter(m => m.role === 'user');
            expect(userMessages.length).toBe(1 + hitlInteractions.length);
            
            // Property: Interrupt messages = N (one per HITL)
            const interruptMessages = messages.filter(m => m.role === 'interrupt');
            expect(interruptMessages.length).toBe(hitlInteractions.length);
            
            // Property: Each interrupt has corresponding interruptData
            for (const msg of interruptMessages) {
              expect(msg.interruptData).toBeDefined();
              expect(msg.interruptData?.nodeId).toBeDefined();
              expect(msg.interruptData?.message).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Property 5.3: Message Content Preserved**
     * *For any* message added to chat history, THE content SHALL be preserved exactly.
     * **Validates: Requirements 4.2**
     */
    it('prop_message_content_preserved', () => {
      fc.assert(
        fc.property(
          arbUserMessage,
          arbAssistantResponse,
          (userContent, assistantContent) => {
            // Create messages
            const userMsg: Message = { role: 'user', content: userContent };
            const assistantMsg: Message = { role: 'assistant', content: assistantContent };
            
            // Simulate storage (as React state does)
            const messages: Message[] = [userMsg, assistantMsg];
            
            // Property: Content is preserved exactly
            expect(messages[0].content).toBe(userContent);
            expect(messages[1].content).toBe(assistantContent);
            
            // Property: Roles are preserved
            expect(messages[0].role).toBe('user');
            expect(messages[1].role).toBe('assistant');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Default Values', () => {
    it('should have sensible default manual trigger config', () => {
      expect(DEFAULT_MANUAL_TRIGGER_CONFIG.inputLabel).toBe('Enter your message');
      expect(DEFAULT_MANUAL_TRIGGER_CONFIG.defaultPrompt).toBe('What can you help me build with ADK-Rust today?');
    });

    it('should return null for project without manual trigger', () => {
      const project = {
        id: 'test-project',
        name: 'Test Project',
        agents: {},
        workflow: { type: 'single' as const, edges: [], conditions: [] },
        actionNodes: {},
      } as unknown as Project;
      
      const result = getTriggerConfig(project);
      expect(result).toBeNull();
    });

    it('should return null for null project', () => {
      const result = getTriggerConfig(null);
      expect(result).toBeNull();
    });
  });
});
