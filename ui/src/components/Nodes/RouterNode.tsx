/**
 * RouterNode Component for ADK Studio v2.0
 * 
 * Displays router workflow nodes with conditional routes and theme-aware styling.
 * 
 * Requirements: 7.1, 7.2, 7.3
 */

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import type { NodeStatus } from '../Overlays/StatusIndicator';

interface Route {
  /** Condition expression for this route */
  condition: string;
  /** Target agent/node name */
  target: string;
}

interface RouterNodeData {
  /** Display label for the node */
  label: string;
  /** List of conditional routes */
  routes?: Route[];
  /** Currently active route condition */
  activeRoute?: string;
  /** Whether the node is currently executing */
  isActive?: boolean;
  /** Whether the node is interrupted (HITL waiting for input) */
  isInterrupted?: boolean;
  /** Execution status */
  status?: NodeStatus;
}

interface Props {
  data: RouterNodeData;
  selected?: boolean;
}

/**
 * RouteItem displays a single conditional route
 */
function RouteItem({
  route,
  isActive,
}: {
  route: Route;
  isActive: boolean;
}) {
  const className = [
    'route',
    isActive && 'route-active',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <span className="route-condition">{route.condition}</span>
      <span className="route-arrow">→</span>
      <span className="route-target">{route.target}</span>
    </div>
  );
}

/**
 * RouterNode displays a router workflow with:
 * - Colored header bar (router orange)
 * - List of conditional routes
 * - Active route highlighting
 * - Theme-aware styling
 * - Interrupted state for HITL (trigger-input-flow Requirement 3.3)
 */
export const RouterNode = memo(function RouterNode({ data, selected }: Props) {
  const isActive = data.isActive || false;
  const isInterrupted = data.isInterrupted || false;
  const routes = data.routes || [];
  const activeRoute = data.activeRoute;
  const status = data.status || (isActive ? 'running' : 'idle');

  return (
    <BaseNode
      label={data.label}
      nodeType="router"
      isActive={isActive}
      isSelected={selected}
      isInterrupted={isInterrupted}
      status={status}
    >
      {routes.length > 0 && (
        <div className="space-y-1">
          {routes.map((route) => (
            <RouteItem
              key={route.condition}
              route={route}
              isActive={activeRoute === route.condition}
            />
          ))}
        </div>
      )}
    </BaseNode>
  );
});

RouterNode.displayName = 'RouterNode';

export default RouterNode;
