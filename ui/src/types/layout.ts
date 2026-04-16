export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Layout mode for the canvas.
 * - 'free': Nodes can be placed anywhere, manual positioning
 * - 'fixed': Nodes are auto-arranged using Dagre layout
 */
export type LayoutMode = 'free' | 'fixed';

/**
 * Graph pattern type for layout analysis.
 * Used to determine optimal layout configuration based on graph structure.
 */
export type GraphPattern = 'pipeline' | 'tree' | 'cluster' | 'freeform';

export interface LayoutConfig {
  direction: LayoutDirection;
  nodeSpacing: number;
  rankSpacing: number;
}

export interface LayoutState {
  mode: LayoutMode;
  direction: LayoutDirection;
  snapToGrid: boolean;
  gridSize: number;
}

export const defaultLayoutState: LayoutState = {
  mode: 'free',
  direction: 'LR',
  snapToGrid: true,
  gridSize: 20,
};

export interface GraphAnalysis {
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  hasCycles: boolean;
  dominantPattern: GraphPattern;
  entryPoints: string[];
  exitPoints: string[];
}
