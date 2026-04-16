/**
 * EmailNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for Email action nodes.
 * Displays email mode (monitor/send), connection status, and configuration preview.
 * 
 * Requirements: 14.1, 14.2, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { EmailNodeConfig, EmailMode } from '../../types/actionNodes';

interface EmailNodeData extends EmailNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: EmailNodeData;
  selected?: boolean;
}

/**
 * Email mode icons and labels for visual distinction.
 */
const EMAIL_MODE_CONFIG: Record<EmailMode, { icon: string; label: string; color: string }> = {
  monitor: { icon: '📥', label: 'Monitor', color: '#3B82F6' },  // Blue - incoming
  send: { icon: '📤', label: 'Send', color: '#10B981' },        // Green - outgoing
};

/**
 * Truncates email address for display.
 */
function truncateEmail(email: string, maxLength: number = 25): string {
  if (!email || email.length <= maxLength) return email;
  
  const atIndex = email.indexOf('@');
  if (atIndex > 0 && atIndex < maxLength - 5) {
    // Keep the domain visible
    const domain = email.substring(atIndex);
    const localPart = email.substring(0, atIndex);
    const availableForLocal = maxLength - domain.length - 3;
    if (availableForLocal > 3) {
      return localPart.substring(0, availableForLocal) + '...' + domain;
    }
  }
  
  return email.substring(0, maxLength - 3) + '...';
}

/**
 * Formats recipient list for display.
 */
function formatRecipients(to: string | undefined): string {
  if (!to) return 'No recipients';
  
  const recipients = to.split(',').map(r => r.trim()).filter(Boolean);
  if (recipients.length === 0) return 'No recipients';
  if (recipients.length === 1) return truncateEmail(recipients[0]);
  return `${truncateEmail(recipients[0])} +${recipients.length - 1}`;
}

/**
 * EmailNode displays email monitoring or sending configuration.
 * 
 * Features:
 * - Mode badge (monitor/send) with distinct colors (Requirement 14.1, 14.2)
 * - Connection preview (IMAP/SMTP host)
 * - Folder indicator for monitoring mode
 * - Recipients preview for send mode
 * - Attachment count indicator
 * 
 * @see Requirements 14.1, 14.2, 12.1, 12.3
 */
export const EmailNode = memo(function EmailNode({ data, selected }: Props) {
  const modeConfig = EMAIL_MODE_CONFIG[data.mode] || EMAIL_MODE_CONFIG.monitor;
  const hasAttachments = data.attachments && data.attachments.length > 0;
  
  // Get connection info based on mode
  const connectionHost = data.mode === 'monitor' 
    ? data.imap?.host 
    : data.smtp?.host;
  
  const connectionPort = data.mode === 'monitor'
    ? data.imap?.port
    : data.smtp?.port;
  
  return (
    <ActionNodeBase
      type="email"
      label={data.name || 'Email'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="email-node-content">
        {/* Mode badge row */}
        <div className="email-mode-row">
          <span 
            className="email-mode-badge"
            style={{ backgroundColor: modeConfig.color }}
          >
            <span className="email-mode-icon">{modeConfig.icon}</span>
            <span className="email-mode-label">{modeConfig.label}</span>
          </span>
          {hasAttachments && (
            <span className="email-attachment-badge" title={`${data.attachments!.length} attachment(s)`}>
              📎 {data.attachments!.length}
            </span>
          )}
        </div>
        
        {/* Connection preview */}
        {connectionHost && (
          <div className="email-connection-preview" title={`${connectionHost}:${connectionPort}`}>
            <span className="email-connection-icon">🔌</span>
            <span className="email-connection-host">
              {connectionHost}
              {connectionPort && <span className="email-connection-port">:{connectionPort}</span>}
            </span>
          </div>
        )}
        
        {/* Mode-specific info */}
        {data.mode === 'monitor' && (
          <div className="email-monitor-info">
            {data.imap?.folder && (
              <span className="email-folder-badge" title={`Folder: ${data.imap.folder}`}>
                📁 {data.imap.folder}
              </span>
            )}
            {data.filters?.unreadOnly && (
              <span className="email-filter-badge" title="Unread only">
                🔵 Unread
              </span>
            )}
            {data.filters?.from && (
              <span className="email-filter-badge" title={`From: ${data.filters.from}`}>
                👤 {truncateEmail(data.filters.from, 15)}
              </span>
            )}
          </div>
        )}
        
        {data.mode === 'send' && (
          <div className="email-send-info">
            {data.recipients?.to && (
              <div className="email-recipients-preview" title={data.recipients.to}>
                <span className="email-recipients-icon">👥</span>
                <span className="email-recipients-text">
                  {formatRecipients(data.recipients.to)}
                </span>
              </div>
            )}
            {data.content?.subject && (
              <div className="email-subject-preview" title={data.content.subject}>
                <span className="email-subject-text">
                  {data.content.subject.length > 30 
                    ? data.content.subject.substring(0, 27) + '...' 
                    : data.content.subject}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Status indicators */}
        <div className="email-indicators">
          {data.imap?.secure || data.smtp?.secure ? (
            <span className="email-secure-badge" title="SSL/TLS enabled">
              🔒 Secure
            </span>
          ) : null}
          {data.content?.bodyType === 'html' && (
            <span className="email-html-badge" title="HTML email">
              HTML
            </span>
          )}
        </div>
      </div>
    </ActionNodeBase>
  );
});

export default EmailNode;
