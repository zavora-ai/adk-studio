/**
 * NotificationPanel Component for ADK Studio
 * 
 * Properties panel for configuring Notification action nodes.
 * Provides UI for channel selection, webhook URL configuration,
 * message formatting, and variable interpolation preview.
 * 
 * Requirements: 17.1, 17.2, 12.2
 */

import React, { useCallback, useState, useMemo } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  NotificationNodeConfig, 
  NotificationChannel,
  MessageFormat,
  NotificationMessage,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/notificationPanel.css';

// ============================================
// Constants
// ============================================

const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = ['slack', 'discord', 'teams', 'webhook'];

const CHANNEL_CONFIG: Record<NotificationChannel, { icon: string; label: string; description: string; color: string }> = {
  slack: { 
    icon: '💬', 
    label: 'Slack', 
    description: 'Send messages to Slack channels via webhook',
    color: '#4A154B',
  },
  discord: { 
    icon: '🎮', 
    label: 'Discord', 
    description: 'Send messages to Discord channels via webhook',
    color: '#5865F2',
  },
  teams: { 
    icon: '👥', 
    label: 'Teams', 
    description: 'Send messages to Microsoft Teams via webhook',
    color: '#6264A7',
  },
  webhook: { 
    icon: '🔗', 
    label: 'Custom Webhook', 
    description: 'Send to any webhook endpoint',
    color: '#6B7280',
  },
};

const MESSAGE_FORMATS: readonly MessageFormat[] = ['plain', 'markdown', 'blocks'];

const FORMAT_CONFIG: Record<MessageFormat, { icon: string; label: string; description: string }> = {
  plain: { 
    icon: '📝', 
    label: 'Plain Text', 
    description: 'Simple text message',
  },
  markdown: { 
    icon: '📋', 
    label: 'Markdown', 
    description: 'Formatted text with markdown syntax',
  },
  blocks: { 
    icon: '🧱', 
    label: 'Blocks', 
    description: 'Rich formatting with Block Kit (Slack) / Embeds (Discord) / Adaptive Cards (Teams)',
  },
};

const DEFAULT_MESSAGE: NotificationMessage = {
  text: '',
  format: 'plain',
};

// ============================================
// Main Component
// ============================================

export interface NotificationPanelProps {
  /** Current Notification node configuration */
  node: NotificationNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: NotificationNodeConfig) => void;
}

/**
 * NotificationPanel provides configuration UI for Notification action nodes.
 * 
 * Features:
 * - Channel selector (Slack/Discord/Teams/Webhook) (Requirement 17.1)
 * - Webhook URL configuration (secret) (Requirement 17.1)
 * - Message format selector (Requirement 17.2)
 * - Message text editor with variable interpolation preview (Requirement 17.2)
 * - Blocks editor for rich formatting (Requirement 17.2)
 * - Custom username and icon configuration
 * - Standard properties panel integration
 * 
 * @see Requirements 17.1, 17.2, 12.2
 */
export function NotificationPanel({ node, onChange }: NotificationPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateChannel = useCallback((channel: NotificationChannel) => {
    onChange({ ...node, channel });
  }, [node, onChange]);
  
  const updateWebhookUrl = useCallback((webhookUrl: string) => {
    onChange({ ...node, webhookUrl });
  }, [node, onChange]);
  
  const updateMessage = useCallback((updates: Partial<NotificationMessage>) => {
    onChange({
      ...node,
      message: { ...(node.message || DEFAULT_MESSAGE), ...updates },
    });
  }, [node, onChange]);
  
  const updateUsername = useCallback((username: string) => {
    onChange({ ...node, username: username || undefined });
  }, [node, onChange]);
  
  const updateIconUrl = useCallback((iconUrl: string) => {
    onChange({ ...node, iconUrl: iconUrl || undefined });
  }, [node, onChange]);
  
  const updateTargetChannel = useCallback((targetChannel: string) => {
    onChange({ ...node, targetChannel: targetChannel || undefined });
  }, [node, onChange]);
  
  const updateBlocks = useCallback((blocksJson: string) => {
    try {
      const blocks = blocksJson.trim() ? JSON.parse(blocksJson) : undefined;
      updateMessage({ blocks });
    } catch {
      // Invalid JSON, don't update
    }
  }, [updateMessage]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Variable Interpolation Preview
  // ============================================
  
  const variablePreview = useMemo(() => {
    const text = node.message?.text || '';
    const variables = text.match(/\{\{([^}]+)\}\}/g) || [];
    return variables.map(v => v.replace(/\{\{|\}\}/g, ''));
  }, [node.message?.text]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="notification-panel">
      {/* Channel Selection */}
      <CollapsibleSection title="Notification Channel" defaultOpen>
        <Field label="Channel" required tooltip="Select the notification service to send messages to">
          <div className="notification-channel-selector">
            {NOTIFICATION_CHANNELS.map((channel) => {
              const config = CHANNEL_CONFIG[channel];
              return (
                <button
                  key={channel}
                  type="button"
                  className={`notification-channel-option ${node.channel === channel ? 'selected' : ''}`}
                  onClick={() => updateChannel(channel)}
                  title={config.description}
                  style={{ '--channel-color': config.color } as React.CSSProperties}
                >
                  <span className="notification-channel-icon">{config.icon}</span>
                  <span className="notification-channel-label">{config.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <div className="notification-panel-channel-description">
          {CHANNEL_CONFIG[node.channel]?.description}
        </div>
      </CollapsibleSection>
      
      {/* Webhook Configuration */}
      <WebhookSection 
        webhookUrl={node.webhookUrl} 
        channel={node.channel}
        onChange={updateWebhookUrl} 
      />
      
      {/* Message Configuration */}
      <MessageSection 
        message={node.message} 
        channel={node.channel}
        onChange={updateMessage}
        onBlocksChange={updateBlocks}
        variablePreview={variablePreview}
      />
      
      {/* Appearance Configuration */}
      <AppearanceSection
        username={node.username}
        iconUrl={node.iconUrl}
        targetChannel={node.targetChannel}
        channel={node.channel}
        onUsernameChange={updateUsername}
        onIconUrlChange={updateIconUrl}
        onTargetChannelChange={updateTargetChannel}
      />
      
      {/* Standard Properties */}
      <StandardPropertiesPanel
        properties={node}
        onChange={updateStandardProperties}
        showIdentity
      />
    </div>
  );
}

// ============================================
// Webhook Section Component (Requirement 17.1)
// ============================================

interface WebhookSectionProps {
  webhookUrl: string;
  channel: NotificationChannel;
  onChange: (url: string) => void;
}

/**
 * Webhook URL configuration section.
 * @see Requirement 17.1
 */
function WebhookSection({ webhookUrl, channel, onChange }: WebhookSectionProps) {
  const [showUrl, setShowUrl] = useState(false);
  
  const placeholder = useMemo(() => {
    switch (channel) {
      case 'slack':
        return 'https://hooks.slack.com/services/T.../B.../...';
      case 'discord':
        return 'https://discord.com/api/webhooks/.../...';
      case 'teams':
        return 'https://outlook.office.com/webhook/.../IncomingWebhook/...';
      default:
        return 'https://example.com/webhook';
    }
  }, [channel]);
  
  return (
    <CollapsibleSection title="Webhook Configuration" defaultOpen>
      <Field 
        label="Webhook URL" 
        required 
        hint="secret"
        tooltip="The webhook URL for the notification service. This is treated as a secret and will be masked in logs."
      >
        <div className="notification-webhook-input-wrapper">
          <input
            type={showUrl ? 'text' : 'password'}
            className="notification-panel-input notification-webhook-input"
            value={webhookUrl || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="notification-webhook-toggle"
            onClick={() => setShowUrl(!showUrl)}
            title={showUrl ? 'Hide URL' : 'Show URL'}
          >
            {showUrl ? '🙈' : '👁️'}
          </button>
        </div>
      </Field>
      
      <div className="notification-panel-info">
        <span className="notification-panel-info-icon">🔒</span>
        <span className="notification-panel-info-text">
          Webhook URLs are stored securely and masked in logs. You can also use {'{{variable}}'} syntax to reference secrets from state.
        </span>
      </div>
      
      {/* Quick setup links */}
      <div className="notification-webhook-help">
        <span className="notification-webhook-help-label">How to get webhook URL:</span>
        {channel === 'slack' && (
          <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
            Slack Webhooks Guide →
          </a>
        )}
        {channel === 'discord' && (
          <a href="https://support.discord.com/hc/en-us/articles/228383668" target="_blank" rel="noopener noreferrer">
            Discord Webhooks Guide →
          </a>
        )}
        {channel === 'teams' && (
          <a href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer">
            Teams Webhooks Guide →
          </a>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ============================================
// Message Section Component (Requirement 17.2)
// ============================================

interface MessageSectionProps {
  message?: NotificationMessage;
  channel: NotificationChannel;
  onChange: (updates: Partial<NotificationMessage>) => void;
  onBlocksChange: (blocksJson: string) => void;
  variablePreview: string[];
}

/**
 * Message configuration section.
 * @see Requirement 17.2
 */
function MessageSection({ message, channel, onChange, onBlocksChange, variablePreview }: MessageSectionProps) {
  const config = message || DEFAULT_MESSAGE;
  const [blocksJson, setBlocksJson] = useState(() => 
    config.blocks ? JSON.stringify(config.blocks, null, 2) : ''
  );
  
  const handleBlocksChange = (value: string) => {
    setBlocksJson(value);
    onBlocksChange(value);
  };
  
  return (
    <CollapsibleSection title="Message" defaultOpen>
      <Field label="Format" tooltip="Choose how to format your message">
        <div className="notification-format-selector">
          {MESSAGE_FORMATS.map((format) => {
            const formatConfig = FORMAT_CONFIG[format];
            return (
              <button
                key={format}
                type="button"
                className={`notification-format-option ${config.format === format ? 'selected' : ''}`}
                onClick={() => onChange({ format })}
                title={formatConfig.description}
              >
                <span className="notification-format-icon">{formatConfig.icon}</span>
                <span className="notification-format-label">{formatConfig.label}</span>
              </button>
            );
          })}
        </div>
      </Field>
      
      <Field 
        label="Message Text" 
        required 
        hint="supports {{variable}}"
        tooltip="The message content to send. Use {{variable}} syntax to interpolate values from workflow state."
      >
        <textarea
          className="notification-panel-textarea"
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={config.format === 'markdown' 
            ? '**Hello {{name}}!**\n\nYour order _{{orderId}}_ has been processed.'
            : 'Hello {{name}}! Your order {{orderId}} has been processed.'
          }
          rows={5}
        />
      </Field>
      
      {/* Variable Preview */}
      {variablePreview.length > 0 && (
        <div className="notification-variable-preview">
          <span className="notification-variable-preview-label">Variables detected:</span>
          <div className="notification-variable-preview-list">
            {variablePreview.map((v, i) => (
              <span key={i} className="notification-variable-preview-item">
                {'{{'}{v}{'}}'}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Blocks Editor */}
      {config.format === 'blocks' && (
        <BlocksEditor 
          blocksJson={blocksJson}
          channel={channel}
          onChange={handleBlocksChange}
        />
      )}
    </CollapsibleSection>
  );
}

// ============================================
// Blocks Editor Component (Requirement 17.2)
// ============================================

interface BlocksEditorProps {
  blocksJson: string;
  channel: NotificationChannel;
  onChange: (value: string) => void;
}

/**
 * Rich blocks editor for Slack Block Kit / Discord Embeds / Teams Adaptive Cards.
 * @see Requirement 17.2
 */
function BlocksEditor({ blocksJson, channel, onChange }: BlocksEditorProps) {
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (value: string) => {
    onChange(value);
    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      setError(null);
    } catch (e) {
      setError('Invalid JSON');
    }
  };
  
  const blockTypeLabel = useMemo(() => {
    switch (channel) {
      case 'slack':
        return 'Block Kit';
      case 'discord':
        return 'Embeds';
      case 'teams':
        return 'Adaptive Cards';
      default:
        return 'Blocks';
    }
  }, [channel]);
  
  const placeholder = useMemo(() => {
    switch (channel) {
      case 'slack':
        return `[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Hello *{{name}}*!"
    }
  }
]`;
      case 'discord':
        return `[
  {
    "title": "Notification",
    "description": "Hello {{name}}!",
    "color": 5814783
  }
]`;
      case 'teams':
        return `{
  "type": "AdaptiveCard",
  "body": [
    {
      "type": "TextBlock",
      "text": "Hello {{name}}!"
    }
  ]
}`;
      default:
        return '[]';
    }
  }, [channel]);
  
  return (
    <div className="notification-blocks-editor">
      <Field 
        label={`${blockTypeLabel} JSON`}
        hint="optional"
        tooltip={`Define rich message formatting using ${blockTypeLabel}. This will override the plain text message.`}
      >
        <textarea
          className={`notification-panel-textarea notification-panel-textarea-mono ${error ? 'notification-panel-textarea-error' : ''}`}
          value={blocksJson}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={10}
        />
        {error && (
          <span className="notification-blocks-error">{error}</span>
        )}
      </Field>
      
      <div className="notification-blocks-help">
        {channel === 'slack' && (
          <a href="https://app.slack.com/block-kit-builder" target="_blank" rel="noopener noreferrer">
            Open Block Kit Builder →
          </a>
        )}
        {channel === 'discord' && (
          <a href="https://discohook.org/" target="_blank" rel="noopener noreferrer">
            Open Discohook (Embed Builder) →
          </a>
        )}
        {channel === 'teams' && (
          <a href="https://adaptivecards.io/designer/" target="_blank" rel="noopener noreferrer">
            Open Adaptive Cards Designer →
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================
// Appearance Section Component
// ============================================

interface AppearanceSectionProps {
  username?: string;
  iconUrl?: string;
  targetChannel?: string;
  channel: NotificationChannel;
  onUsernameChange: (value: string) => void;
  onIconUrlChange: (value: string) => void;
  onTargetChannelChange: (value: string) => void;
}

/**
 * Appearance configuration section for custom username, icon, and channel.
 */
function AppearanceSection({ 
  username, 
  iconUrl, 
  targetChannel, 
  channel,
  onUsernameChange, 
  onIconUrlChange,
  onTargetChannelChange,
}: AppearanceSectionProps) {
  // Only show for channels that support these options
  const supportsUsername = channel === 'slack' || channel === 'discord';
  const supportsIcon = channel === 'slack' || channel === 'discord';
  const supportsTargetChannel = channel === 'slack';
  
  if (!supportsUsername && !supportsIcon && !supportsTargetChannel) {
    return null;
  }
  
  return (
    <CollapsibleSection title="Appearance" defaultOpen={false}>
      {supportsUsername && (
        <Field 
          label="Username" 
          hint="optional"
          tooltip="Custom username to display for the notification"
        >
          <input
            type="text"
            className="notification-panel-input"
            value={username || ''}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="My Workflow Bot"
          />
        </Field>
      )}
      
      {supportsIcon && (
        <Field 
          label="Icon URL" 
          hint="optional"
          tooltip="Custom icon URL to display for the notification"
        >
          <input
            type="url"
            className="notification-panel-input"
            value={iconUrl || ''}
            onChange={(e) => onIconUrlChange(e.target.value)}
            placeholder="https://example.com/icon.png"
          />
        </Field>
      )}
      
      {supportsTargetChannel && (
        <Field 
          label="Target Channel" 
          hint="optional, Slack only"
          tooltip="Override the default channel configured in the webhook"
        >
          <input
            type="text"
            className="notification-panel-input"
            value={targetChannel || ''}
            onChange={(e) => onTargetChannelChange(e.target.value)}
            placeholder="#general"
          />
        </Field>
      )}
    </CollapsibleSection>
  );
}

export default NotificationPanel;
