import type { AgentSchema, ToolConfig } from '../../types/project';
import type { StateSnapshot } from '../../types/execution';
import { PropertiesPanel, ActionPropertiesPanel, ToolConfigPanel, StateInspector } from '../Panels';

export interface CanvasRightPanelProps {
  // Agent properties panel
  selectedNodeId: string | null;
  selectedAgent: AgentSchema | null;
  agents: Record<string, AgentSchema>;
  toolConfigs: Record<string, ToolConfig>;
  onUpdateAgent: (id: string, updates: Partial<AgentSchema>) => void;
  onRenameAgent: (oldId: string, newId: string) => void;
  onAddSubAgent: (nodeId: string) => void;
  onCloseAgent: () => void;
  onSelectTool: (toolId: string) => void;
  onRemoveToolFromAgent: (nodeId: string, toolType: string) => void;

  // Action properties panel
  selectedActionNodeId: string | null;
  hasProject: boolean;
  onCloseActionNode: () => void;

  // Tool config panel
  selectedToolId: string | null;
  toolConfig: ToolConfig | null;
  onUpdateToolConfig: (toolId: string, config: ToolConfig) => void;
  onCloseTool: () => void;
  onOpenCodeEditor: () => void;

  // State inspector
  showConsole: boolean;
  debugMode: boolean;
  showStateInspector: boolean;
  snapshots: StateSnapshot[];
  currentSnapshot: StateSnapshot | null;
  previousSnapshot: StateSnapshot | null;
  currentSnapshotIndex: number;
  onStateHistorySelect: (index: number) => void;
  onCloseStateInspector: () => void;
}

export function CanvasRightPanel({
  // Agent properties panel
  selectedNodeId,
  selectedAgent,
  agents,
  toolConfigs,
  onUpdateAgent,
  onRenameAgent,
  onAddSubAgent,
  onCloseAgent,
  onSelectTool,
  onRemoveToolFromAgent,
  // Action properties panel
  selectedActionNodeId,
  hasProject,
  onCloseActionNode,
  // Tool config panel
  selectedToolId,
  toolConfig,
  onUpdateToolConfig,
  onCloseTool,
  onOpenCodeEditor,
  // State inspector
  showConsole,
  debugMode,
  showStateInspector,
  snapshots,
  currentSnapshot,
  previousSnapshot,
  currentSnapshotIndex,
  onStateHistorySelect,
  onCloseStateInspector,
}: CanvasRightPanelProps) {
  return (
    <>
      {/* Right Sidebar - Properties Panel */}
      {selectedAgent && selectedNodeId && (
        <PropertiesPanel
          nodeId={selectedNodeId}
          agent={selectedAgent}
          agents={agents}
          toolConfigs={toolConfigs}
          onUpdate={onUpdateAgent}
          onRename={onRenameAgent}
          onAddSubAgent={() => onAddSubAgent(selectedNodeId)}
          onClose={onCloseAgent}
          onSelectTool={onSelectTool}
          onRemoveTool={t => onRemoveToolFromAgent(selectedNodeId, t)}
        />
      )}

      {/* Right Sidebar - Action Properties Panel (v2.0) */}
      {/* @see Requirements 12.2, 12.3 */}
      {selectedActionNodeId && hasProject && (
        <ActionPropertiesPanel
          nodeId={selectedActionNodeId}
          onClose={onCloseActionNode}
        />
      )}

      {selectedToolId && hasProject && (
        <ToolConfigPanel
          toolId={selectedToolId}
          config={toolConfig}
          onUpdate={c => onUpdateToolConfig(selectedToolId, c)}
          onClose={onCloseTool}
          onOpenCodeEditor={onOpenCodeEditor}
        />
      )}

      {/* State Inspector Panel - shows runtime state during execution (v2.0) */}
      {/* @see Requirements 4.1, 4.2, 4.5, 5.4 */}
      {/* Only visible when debug mode is enabled */}
      {showConsole && debugMode && showStateInspector && snapshots.length > 0 && (
        <div className="w-72 flex-shrink-0">
          <StateInspector
            snapshot={currentSnapshot}
            previousSnapshot={previousSnapshot}
            snapshots={snapshots}
            currentIndex={currentSnapshotIndex}
            onHistorySelect={onStateHistorySelect}
            onClose={onCloseStateInspector}
          />
        </div>
      )}
    </>
  );
}
