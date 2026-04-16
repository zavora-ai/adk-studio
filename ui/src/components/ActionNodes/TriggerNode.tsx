/**
 * TriggerNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Trigger action nodes.
 * Displays trigger type badge and configuration preview.
 * 
 * Requirements: 2.1, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { TriggerNodeConfig, TriggerType } from '../../types/actionNodes';

interface TriggerNodeData extends TriggerNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: TriggerNodeData;
  selected?: boolean;
}

/**
 * Trigger type display labels
 * @see Requirement 2.1
 */
const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  manual: 'Manual',
  webhook: 'Webhook',
  schedule: 'Schedule',
  event: 'Event',
};

/**
 * Trigger type icons for visual distinction
 */
const TRIGGER_TYPE_ICONS: Record<TriggerType, string> = {
  manual: '👆',
  webhook: '🔗',
  schedule: '📅',
  event: '⚡',
};

/**
 * TriggerNode displays workflow entry points (manual, webhook, schedule, event).
 * 
 * Features:
 * - Displays trigger type badge with icon (Requirement 2.1)
 * - Shows webhook path and method preview (Requirement 2.2)
 * - Shows cron expression preview for schedules (Requirement 2.3)
 * - Shows event source for event triggers
 * 
 * @see Requirements 2.1, 12.1, 12.3
 */
export const TriggerNode = memo(function TriggerNode({ data, selected }: Props) {
  const triggerLabel = TRIGGER_TYPE_LABELS[data.triggerType] || data.triggerType;
  const triggerIcon = TRIGGER_TYPE_ICONS[data.triggerType] || '🎯';

  /**
   * Renders configuration preview based on trigger type
   */
  const renderPreview = () => {
    switch (data.triggerType) {
      case 'webhook':
        if (data.webhook?.path) {
          return (
            <div className="action-node-preview">
              <span className="action-node-preview-method">{data.webhook.method}</span>
              <span className="action-node-preview-path">{data.webhook.path}</span>
              {data.webhook.auth !== 'none' && (
                <span className="action-node-preview-auth" title={`Auth: ${data.webhook.auth}`}>
                  🔒
                </span>
              )}
            </div>
          );
        }
        return null;

      case 'schedule':
        if (data.schedule?.cron) {
          return (
            <div className="action-node-preview">
              <span className="action-node-preview-cron">{data.schedule.cron}</span>
              {data.schedule.timezone && (
                <span className="action-node-preview-tz" title={data.schedule.timezone}>
                  🌍
                </span>
              )}
            </div>
          );
        }
        return null;

      case 'event':
        if (data.event?.source) {
          return (
            <div className="action-node-preview">
              <span className="action-node-preview-source">{data.event.source}</span>
              {data.event.eventType && (
                <span className="action-node-preview-type">: {data.event.eventType}</span>
              )}
            </div>
          );
        }
        return null;

      case 'manual':
      default:
        return (
          <div className="action-node-preview action-node-preview-manual">
            Click to run
          </div>
        );
    }
  };

  return (
    <ActionNodeBase
      type="trigger"
      label={data.name || 'Trigger'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
      inputPorts={0} // Trigger nodes have no inputs - they are entry points
      outputPorts={1}
    >
      <div className="action-node-badge">
        <span className="action-node-badge-icon">{triggerIcon}</span>
        <span className="action-node-badge-label">{triggerLabel}</span>
      </div>
      {renderPreview()}
    </ActionNodeBase>
  );
});

export default TriggerNode;
