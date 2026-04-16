# Canvas Integration Audit

## Overview

This document audits the current Canvas.tsx integration points, documenting existing hooks, state, and event handlers to identify refactoring needed for ADK Studio v2.0.

## Current Architecture

### Canvas.tsx Integration Points

#### 1. Store Integration (useStore)

The Canvas component imports the following from the global store:

```typescript
const {
  currentProject,
  openProject,
  closeProject,
  saveProject,
  selectNode,
  selectedNodeId,
  updateAgent: storeUpdateAgent,
  renameAgent,
  addEdge: addProjectEdge,
  removeEdge: removeProjectEdge,
  addToolToAgent,
  removeToolFromAgent,
  addSubAgentToContainer,
  selectedToolId,
  selectTool,
  updateToolConfig: storeUpdateToolConfig,
  addAgent
} = useStore();
```

**Issues:**
- Too many store actions destructured directly in Canvas
- Mixing project management with canvas operations
- No separation between canvas state and project state

#### 2. Local State (useState)

Canvas maintains significant local state:

| State Variable | Type | Purpose |
|---------------|------|---------|
| `showConsole` | boolean | Toggle console visibility |
| `flowPhase` | 'idle' \| 'input' \| 'output' | Execution flow phase |
| `activeAgent` | string \| null | Currently executing agent |
| `iteration` | number | Loop iteration counter |
| `thoughts` | Record<string, string> | Agent thought bubbles |
| `compiledCode` | GeneratedProject \| null | Generated code output |
| `buildOutput` | object \| null | Build process output |
| `building` | boolean | Build in progress flag |
| `builtBinaryPath` | string \| null | Path to built binary |
| `showCodeEditor` | boolean | Code editor modal visibility |
| `showNewProjectModal` | boolean | New project modal visibility |

**Issues:**
- Execution state (`flowPhase`, `activeAgent`, `iteration`, `thoughts`) should be in a dedicated hook
- Build state (`building`, `buildOutput`, `builtBinaryPath`) should be extracted
- Modal visibility states could be consolidated

#### 3. Custom Hooks Used

| Hook | Purpose | Location |
|------|---------|----------|
| `useCanvasNodes` | Manages ReactFlow nodes/edges from project | `hooks/useCanvasNodes.ts` |
| `useLayout` | Dagre layout and fit-to-view | `hooks/useLayout.ts` |
| `useAgentActions` | Create/duplicate/remove agents | `hooks/useAgentActions.ts` |
| `useKeyboardShortcuts` | Keyboard event handling | `hooks/useKeyboardShortcuts.ts` |
| `useTheme` | Theme mode access | `hooks/useTheme.ts` |

**Issues:**
- `useCanvasNodes` mixes node building with execution state updates
- Layout mode (free/fixed) not yet implemented in `useLayout`
- No dedicated hook for canvas viewport state

#### 4. Event Handlers

| Handler | Purpose | Dependencies |
|---------|---------|--------------|
| `handleThought` | Update thought bubbles | Local state |
| `debouncedSave` | Auto-save with debounce | `saveProject` |
| `updateAgent` | Update agent + trigger save | Store + debounce |
| `updateToolConfig` | Update tool config + trigger save | Store + debounce |
| `handleCompile` | Generate code | API |
| `handleBuild` | Build project via SSE | API + local state |
| `onDragStart` | Palette drag initiation | None |
| `onDragOver` | Canvas drag over | None |
| `onDrop` | Handle palette drops | `createAgent`, `addToolToAgent` |
| `onConnect` | Handle edge connections | `addProjectEdge` |
| `onEdgesDelete` | Handle edge deletion | `removeProjectEdge` |
| `onNodesDelete` | Handle node deletion | `removeAgent` |
| `onEdgeDoubleClick` | Delete edge on double-click | `removeProjectEdge` |
| `onNodeClick` | Select node | `selectNode` |
| `onPaneClick` | Deselect all | `selectNode` |
| `handleAddTool` | Add tool to agent | `addToolToAgent`, `selectTool` |

**Issues:**
- Build-related handlers should be in a dedicated hook
- Drag/drop handlers could be extracted to `useCanvasDragDrop`
- Connection handlers could be part of `useCanvasNodes`

#### 5. ReactFlow Configuration

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onEdgesDelete={onEdgesDelete}
  onNodesDelete={onNodesDelete}
  onEdgeDoubleClick={onEdgeDoubleClick}
  onConnect={onConnect}
  onNodeClick={onNodeClick}
  onPaneClick={onPaneClick}
  onDrop={onDrop}
  onDragOver={onDragOver}
  deleteKeyCode={['Backspace', 'Delete']}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
  minZoom={0.1}
  maxZoom={2}
>
```

**Issues:**
- Theme-aware colors computed inline (should use CSS variables)
- No snap-to-grid configuration
- No layout mode switching (free vs fixed)

### Node Type Registration

Current node types in `components/Nodes/index.ts`:

```typescript
export const nodeTypes = {
  llm: LlmAgentNode,
  sequential: SequentialNode,
  loop: LoopNode,
  parallel: ParallelNode,
  router: RouterNode,
  start: StartNode,
  end: EndNode,
};
```

**Status:** ✅ Well-organized, ready for new node components

### Edge Type Registration

Current edge types in `components/Edges/index.ts`:

```typescript
export const edgeTypes = {
  animated: AnimatedEdge,
};
```

**Status:** ⚠️ Need to add `DataFlowEdge` for v2.0

## Refactoring Recommendations

### 1. Extract Canvas State Hook (`useCanvasState`)

Create a new hook to manage canvas-specific state:

```typescript
// hooks/useCanvasState.ts
export function useCanvasState() {
  // Viewport state
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  
  // UI state
  const [showMinimap, setShowMinimap] = useState(true);
  const [showDataFlowOverlay, setShowDataFlowOverlay] = useState(false);
  
  // Selection state (could stay in store)
  // ...
  
  return { viewport, setViewport, showMinimap, setShowMinimap, showDataFlowOverlay, setShowDataFlowOverlay };
}
```

### 2. Enhance useLayout Hook

Add layout mode support:

```typescript
// hooks/useLayout.ts (enhanced)
export function useLayout() {
  const [mode, setMode] = useState<'free' | 'fixed'>('free');
  const [direction, setDirection] = useState<LayoutDirection>('TB');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  
  // Existing layout functions...
  
  return {
    mode, setMode,
    direction, setDirection,
    snapToGrid, setSnapToGrid,
    gridSize, setGridSize,
    applyLayout, toggleLayout, fitToView
  };
}
```

### 3. Extract Build State Hook (`useBuild`)

```typescript
// hooks/useBuild.ts
export function useBuild(projectId: string | undefined) {
  const [building, setBuilding] = useState(false);
  const [buildOutput, setBuildOutput] = useState<BuildOutput | null>(null);
  const [builtBinaryPath, setBuiltBinaryPath] = useState<string | null>(null);
  
  const build = useCallback(async () => { /* ... */ }, [projectId]);
  const compile = useCallback(async () => { /* ... */ }, [projectId]);
  
  return { building, buildOutput, builtBinaryPath, build, compile };
}
```

### 4. Extract Drag/Drop Hook (`useCanvasDragDrop`)

```typescript
// hooks/useCanvasDragDrop.ts
export function useCanvasDragDrop(options: DragDropOptions) {
  const onDragStart = useCallback((e: DragEvent, type: string) => { /* ... */ }, []);
  const onDragOver = useCallback((e: DragEvent) => { /* ... */ }, []);
  const onDrop = useCallback((e: DragEvent) => { /* ... */ }, [options]);
  
  return { onDragStart, onDragOver, onDrop };
}
```

### 5. Consolidate Execution State

Move execution state from Canvas local state to `useExecution` hook:

```typescript
// hooks/useExecution.ts (enhanced)
export function useExecution() {
  // Existing state...
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('idle');
  
  // Add snapshot support for timeline
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>([]);
  const [currentSnapshotIndex, setCurrentSnapshotIndex] = useState(-1);
  
  // ...
}
```

### 6. Update Node/Edge Registration

Prepare for new components:

```typescript
// components/Nodes/index.ts
export const nodeTypes = {
  llm: LlmAgentNode,
  sequential: SequentialNode,
  loop: LoopNode,
  parallel: ParallelNode,
  router: RouterNode,
  start: StartNode,
  end: EndNode,
  // v2.0 additions (to be implemented)
  // custom: CustomNode,
};

// components/Edges/index.ts
export const edgeTypes = {
  animated: AnimatedEdge,
  // v2.0 additions (to be implemented)
  // dataflow: DataFlowEdge,
};
```

## Files to Modify

| File | Changes Needed | Status |
|------|----------------|--------|
| `components/Canvas/Canvas.tsx` | Extract state to hooks, simplify component | ✅ Done |
| `hooks/useLayout.ts` | Add layout mode, snap-to-grid support | ✅ Done |
| `hooks/useCanvasNodes.ts` | Separate node building from execution updates | Pending (Task 10) |
| `hooks/useExecution.ts` | Add flowPhase, snapshot support | Pending (Task 10) |
| `hooks/useCanvasState.ts` | New hook for canvas UI state | ✅ Created |
| `hooks/useBuild.ts` | New hook for build operations | ✅ Created |
| `hooks/index.ts` | Export new hooks | ✅ Done |
| `store/index.ts` | Add layout mode persistence | ✅ Done |
| `types/layout.ts` | Update LayoutMode type | ✅ Done |
| `types/nodes.ts` | Add edge data types | ✅ Done |
| `components/Nodes/index.ts` | Standardize registration | ✅ Done |
| `components/Edges/index.ts` | Add DataFlowEdge | ✅ Done |
| `components/Edges/DataFlowEdge.tsx` | New component (placeholder) | ✅ Created |

## Priority Order

1. **Task 2.2**: Extract canvas state to dedicated hooks
2. **Task 2.3**: Standardize node/edge type registration
3. **Task 4.x**: Implement layout mode system (depends on 2.2)
4. **Task 8.x**: Backend SSE schema v2 (independent)
5. **Task 10.x**: Timeline (depends on 8.x)

## Conclusion

The current Canvas.tsx is functional but has grown to handle too many responsibilities. The refactoring will:

1. Improve maintainability by separating concerns
2. Enable easier testing of individual hooks
3. Prepare the codebase for v2.0 features (layout modes, data flow overlays, timeline)
4. Reduce the complexity of the main Canvas component
