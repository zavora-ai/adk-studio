/**
 * NotificationNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Notification action nodes.
 * Displays notification channel (Slack/Discord/Teams/Webhook), message preview,
 * and configuration status.
 * 
 * Requirements: 17.1, 17.2, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { NotificationNodeConfig, NotificationChannel, MessageFormat } from '../../types/actionNodes';

interface NotificationNodeData extends NotificationNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: NotificationNodeData;
  selected?: boolean;
}

/**
 * Channel configuration with icons, labels, and colors.
 */
const CHANNEL_CONFIG: Record<NotificationChannel, { icon: string; label: string; color: string }> = {
  slack: { icon: '💬', label: 'Slack', color: '#4A154B' },
  discord: { icon: '🎮', label: 'Discord', color: '#5865F2' },
  teams: { icon: '👥', label: 'Teams', color: '#6264A7' },
  webhook: { icon: '🔗', label: 'Webhook', color: '#6B7280' },
};

/**
 * Message format icons.
 */
const FORMAT_ICONS: Record<MessageFormat, string> = {
  plain: '📝',
  markdown: '📋',
  blocks: '🧱',
};

/**
 * Truncates text for display.
 */
function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extracts domain from webhook URL for display.
 */
function extractDomain(url: string): string {
  if (!url) return '';
  try {
    // Handle variable interpolation
    if (url.includes('{{')) {
      return '{{...}}';
    }
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return truncateText(url, 25);
  }
}

/**
 * Counts variables in a message text.
 */
function countVariables(text: string): number {
  if (!text) return 0;
  const matches = text.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.length : 0;
}

/**
 * NotificationNode displays notification channel and message configuration.
 * 
 * Features:
 * - Channel badge (Slack/Discord/Teams/Webhook) with distinct colors (Requirement 17.1)
 * - Webhook URL preview (masked for security)
 * - Message format indicator
 * - Message text preview with variable count
 * - Custom username/icon indicators
 * 
 * @see Requirements 17.1, 17.2, 12.1, 12.3
 */
export const NotificationNode = memo(function NotificationNode({ data, selected }: Props) {
  const channelConfig = CHANNEL_CONFIG[data.channel] || CHANNEL_CONFIG.webhook;
  const formatIcon = FORMAT_ICONS[data.message?.format || 'plain'];
  const variableCount = countVariables(data.message?.text || '');
  const hasBlocks = data.message?.blocks && data.message.blocks.length > 0;
  const webhookDomain = extractDomain(data.webhookUrl || '');
  
  return (
    <ActionNodeBase
      type="notification"
      label={data.name || 'Notification'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="notification-node-content">
        {/* Channel badge row */}
        <div className="notification-channel-row">
          <span 
            className="notification-channel-badge"
            style={{ backgroundColor: channelConfig.color }}
          >
            <span className="notification-channel-icon">{channelConfig.icon}</span>
            <span className="notification-channel-label">{channelConfig.label}</span>
          </span>
          {data.message?.format && data.message.format !== 'plain' && (
            <span className="notification-format-badge" title={`Format: ${data.message.format}`}>
              {formatIcon} {data.message.format}
            </span>
          )}
        </div>
        
        {/* Webhook URL preview */}
        {webhookDomain && (
          <div className="notification-webhook-preview" title={data.webhookUrl}>
            <span className="notification-webhook-icon">🔗</span>
            <span className="notification-webhook-domain">{webhookDomain}</span>
            <span className="notification-webhook-masked">••••</span>
          </div>
        )}
        
        {/* Message preview */}
        {data.message?.text && (
          <div className="notification-message-preview">
            <span className="notification-message-text">
              {truncateText(data.message.text, 40)}
            </span>
            {variableCount > 0 && (
              <span className="notification-vars-badge" title={`${variableCount} variable(s)`}>
                {'{{'}{variableCount}{'}}'}
              </span>
            )}
          </div>
        )}
        
        {/* Blocks indicator */}
        {hasBlocks && (
          <div className="notification-blocks-indicator">
            <span className="notification-blocks-icon">🧱</span>
            <span className="notification-blocks-text">
              {data.message!.blocks!.length} block(s)
            </span>
          </div>
        )}
        
        {/* Additional indicators */}
        <div className="notification-indicators">
          {data.username && (
            <span className="notification-indicator" title={`Username: ${data.username}`}>
              👤 {truncateText(data.username, 12)}
            </span>
          )}
          {data.iconUrl && (
            <span className="notification-indicator" title="Custom icon">
              🖼️ Icon
            </span>
          )}
          {data.targetChannel && (
            <span className="notification-indicator" title={`Channel: ${data.targetChannel}`}>
              #{truncateText(data.targetChannel, 10)}
            </span>
          )}
        </div>
      </div>
    </ActionNodeBase>
  );
});

export default NotificationNode;
