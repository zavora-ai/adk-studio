/**
 * ActionPalette Component for ADK Studio
 * 
 * Displays all 10 action node types as draggable items grouped by category.
 * Supports drag-and-drop to canvas and click-to-create functionality.
 * 
 * Categories:
 * - Entry: Trigger
 * - Data: Set, Transform
 * - Control: Switch, Loop, Merge, Wait
 * - Integration: HTTP, Database
 * - Code: Code
 * 
 * Requirements: 12.3
 */

import { DragEvent } from 'react';
import { ACTION_NODE_COLORS, ACTION_NODE_ICONS, ACTION_NODE_LABELS } from '../ActionNodes';
import type { ActionNodeType } from '../../types/actionNodes';

/**
 * Action node category definitions
 */
interface ActionNodeCategory {
  name: string;
  types: ActionNodeType[];
}

/**
 * Action node categories for organizing the palette
 */
const ACTION_NODE_CATEGORIES: ActionNodeCategory[] = [
  {
    name: 'Entry',
    types: ['trigger'],
  },
  {
    name: 'Data',
    types: ['set', 'transform'],
  },
  {
    name: 'Control',
    types: ['switch', 'loop', 'merge', 'wait'],
  },
  {
    name: 'Integration',
    types: ['http', 'database', 'email'],
  },
  {
    name: 'Code',
    types: ['code'],
  },
];

/**
 * All action node types in a flat array
 */
export const ALL_ACTION_NODE_TYPES: ActionNodeType[] = ACTION_NODE_CATEGORIES.flatMap(
  (category) => category.types
);

interface ActionPaletteItemProps {
  type: ActionNodeType;
  onDragStart: (e: DragEvent, type: ActionNodeType) => void;
  onCreate: (type: ActionNodeType) => void;
}

/**
 * Individual action palette item - matches AgentPalette button styling
 */
function ActionPaletteItem({ type, onDragStart, onCreate }: ActionPaletteItemProps) {
  const color = ACTION_NODE_COLORS[type];
  const icon = ACTION_NODE_ICONS[type];
  const label = ACTION_NODE_LABELS[type];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      onClick={() => onCreate(type)}
      className="p-1.5 rounded text-xs cursor-grab hover:opacity-80 text-white font-medium"
      style={{ backgroundColor: color }}
      title={`Drag or click to add ${label} node`}
    >
      {icon} {label}
    </div>
  );
}

interface ActionPaletteCategoryProps {
  category: ActionNodeCategory;
  onDragStart: (e: DragEvent, type: ActionNodeType) => void;
  onCreate: (type: ActionNodeType) => void;
}

/**
 * Category section in the palette
 */
function ActionPaletteCategory({ category, onDragStart, onCreate }: ActionPaletteCategoryProps) {
  return (
    <div className="mb-1">
      <div 
        className="text-[10px] font-semibold uppercase tracking-wide mb-1 px-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {category.name}
      </div>
      <div className="space-y-1">
        {category.types.map((type) => (
          <ActionPaletteItem
            key={type}
            type={type}
            onDragStart={onDragStart}
            onCreate={onCreate}
          />
        ))}
      </div>
    </div>
  );
}

interface ActionPaletteProps {
  /** Handler for drag start event */
  onDragStart: (e: DragEvent, type: ActionNodeType) => void;
  /** Handler for click-to-create */
  onCreate: (type: ActionNodeType) => void;
}

/**
 * ActionPalette displays all action node types organized by category.
 * 
 * Features:
 * - Drag-and-drop support for adding nodes to canvas
 * - Click-to-create for quick node addition
 * - Grouped by category (Entry, Data, Control, Integration, Code)
 * - Color-coded items matching node header colors
 * - Theme-aware styling
 * 
 * @see Requirements 12.3
 */
export function ActionPalette({ onDragStart, onCreate }: ActionPaletteProps) {
  return (
    <div>
      <h3 
        className="font-semibold mb-2" 
        style={{ color: 'var(--text-primary)' }}
      >
        Actions
      </h3>
      {ACTION_NODE_CATEGORIES.map((category) => (
        <ActionPaletteCategory
          key={category.name}
          category={category}
          onDragStart={onDragStart}
          onCreate={onCreate}
        />
      ))}
    </div>
  );
}

export default ActionPalette;
