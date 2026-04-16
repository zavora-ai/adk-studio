import type { LayoutConfig, GraphPattern } from '../types/layout';

export const layoutPresets: Record<GraphPattern, LayoutConfig> = {
  pipeline: { direction: 'LR', nodeSpacing: 40, rankSpacing: 100 },
  tree: { direction: 'TB', nodeSpacing: 50, rankSpacing: 80 },
  cluster: { direction: 'TB', nodeSpacing: 60, rankSpacing: 100 },
  freeform: { direction: 'TB', nodeSpacing: 50, rankSpacing: 80 },
};

export function getLayoutConfig(mode: GraphPattern, overrides?: Partial<LayoutConfig>): LayoutConfig {
  return { ...layoutPresets[mode], ...overrides };
}
