import { DragEvent } from 'react';
import { AgentPalette, ToolPalette, ActionPalette } from '../Panels';
import type { ActionNodeType } from '../../types/actionNodes';

export interface CanvasSidebarProps {
  // AgentPalette
  onAgentDragStart: (e: DragEvent, type: string) => void;
  onAgentCreate: (type: string) => void;

  // ActionPalette
  onActionDragStart: (e: DragEvent, type: ActionNodeType) => void;
  onActionCreate: (type: ActionNodeType) => void;

  // ToolPalette
  selectedNodeId: string | null;
  agentTools: string[];
  onToolAdd: (type: string) => void;
  onToolRemove: (type: string) => void;

  // Build actions
  onCompile: () => void;
  onBuild: () => void;
  building: boolean;
  isAutobuild: boolean;
  builtBinaryPath: string | null;
  autobuildEnabled: boolean;
  onToggleAutobuild: () => void;
  onShowBuildProgress: () => void;

  // Console toggle
  showConsole: boolean;
  onToggleConsole: () => void;

  // State Inspector toggle
  debugMode: boolean;
  snapshotCount: number;
  showStateInspector: boolean;
  onToggleStateInspector: () => void;

  // Settings & navigation
  onShowSettings: () => void;
  onCloseProject: () => void;
}

export function CanvasSidebar({
  onAgentDragStart,
  onAgentCreate,
  onActionDragStart,
  onActionCreate,
  selectedNodeId,
  agentTools,
  onToolAdd,
  onToolRemove,
  onCompile,
  onBuild,
  building,
  isAutobuild,
  builtBinaryPath,
  autobuildEnabled,
  onToggleAutobuild,
  onShowBuildProgress,
  showConsole,
  onToggleConsole,
  debugMode,
  snapshotCount,
  showStateInspector,
  onToggleStateInspector,
  onShowSettings,
  onCloseProject,
}: CanvasSidebarProps) {
  return (
    <div
      className="w-48 border-r p-2 flex flex-col overflow-y-auto"
      style={{
        backgroundColor: 'var(--surface-panel)',
        borderColor: 'var(--border-default)',
        color: 'var(--text-primary)',
      }}
    >
      <AgentPalette onDragStart={onAgentDragStart} onCreate={onAgentCreate} />
      <div className="my-2" />
      <ActionPalette onDragStart={onActionDragStart} onCreate={onActionCreate} />
      <div className="my-2" />
      <ToolPalette
        selectedNodeId={selectedNodeId}
        agentTools={agentTools}
        onAdd={onToolAdd}
        onRemove={onToolRemove}
      />
      <div className="mt-auto space-y-1.5 pt-2">
        <button
          onClick={onCompile}
          className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white font-medium"
        >
          📄 View Code
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (building && isAutobuild) {
                onShowBuildProgress();
              } else {
                onBuild();
              }
            }}
            disabled={building && !isAutobuild}
            className={`flex-1 px-2 py-1.5 rounded text-xs text-white font-medium ${
              building
                ? 'cursor-pointer'
                : builtBinaryPath
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-orange-500 hover:bg-orange-600 animate-pulse'
            }`}
            style={building ? { backgroundColor: '#3B82F6' } : undefined}
            title={building && isAutobuild ? 'Click to view build progress' : undefined}
          >
            {building
              ? '⏳ Building...'
              : builtBinaryPath
                ? '🔨 Build'
                : '🔨 Build Required'}
          </button>
          <button
            onClick={onToggleAutobuild}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              autobuildEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : ''
            }`}
            style={
              !autobuildEnabled
                ? {
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-default)',
                  }
                : undefined
            }
            title={
              autobuildEnabled
                ? 'Autobuild ON - builds automatically on changes'
                : 'Autobuild OFF - click to enable'
            }
          >
            ⚡
          </button>
        </div>
        <button
          onClick={onToggleConsole}
          className="w-full px-2 py-1.5 rounded text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {showConsole ? 'Hide Console' : 'Show Console'}
        </button>
        {showConsole && debugMode && snapshotCount > 0 && (
          <button
            onClick={onToggleStateInspector}
            className="w-full px-2 py-1.5 rounded text-xs font-medium"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          >
            {showStateInspector ? '🔍 Hide Inspector' : '🔍 Show Inspector'}
          </button>
        )}
        <button
          onClick={onShowSettings}
          className="w-full px-2 py-1.5 rounded text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={onCloseProject}
          className="w-full px-2 py-1.5 rounded text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
