/**
 * EmailPanel Component for ADK Studio
 * 
 * Properties panel for configuring Email action nodes.
 * Provides UI for email mode selection, IMAP/SMTP configuration,
 * filters, recipients, content, and attachments.
 * 
 * Requirements: 14.1, 14.2, 14.3, 12.2
 */

import { useCallback } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  EmailNodeConfig, 
  EmailMode,
  ImapConfig,
  EmailFilter,
  SmtpConfig,
  EmailRecipients,
  EmailContent,
  EmailBodyType,
  EmailAttachment,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/emailPanel.css';

// ============================================
// Constants
// ============================================

const EMAIL_MODES: readonly EmailMode[] = ['monitor', 'send'];

const EMAIL_MODE_LABELS: Record<EmailMode, string> = {
  monitor: '📥 Monitor Incoming',
  send: '📤 Send Outgoing',
};

const EMAIL_MODE_DESCRIPTIONS: Record<EmailMode, string> = {
  monitor: 'Monitor an email inbox for new messages using IMAP',
  send: 'Send emails using SMTP',
};

const EMAIL_BODY_TYPES: readonly EmailBodyType[] = ['text', 'html'];

const EMAIL_BODY_TYPE_LABELS: Record<EmailBodyType, string> = {
  text: 'Plain Text',
  html: 'HTML',
};

const DEFAULT_IMAP_CONFIG: ImapConfig = {
  host: '',
  port: 993,
  secure: true,
  username: '',
  password: '',
  folder: 'INBOX',
  markAsRead: true,
};

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: '',
  port: 587,
  secure: true,
  username: '',
  password: '',
  fromEmail: '',
  fromName: '',
};

const DEFAULT_FILTERS: EmailFilter = {
  unreadOnly: true,
};

const DEFAULT_RECIPIENTS: EmailRecipients = {
  to: '',
};

const DEFAULT_CONTENT: EmailContent = {
  subject: '',
  bodyType: 'text',
  body: '',
};

// ============================================
// Main Component
// ============================================

export interface EmailPanelProps {
  /** Current Email node configuration */
  node: EmailNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: EmailNodeConfig) => void;
}

/**
 * EmailPanel provides configuration UI for Email action nodes.
 * 
 * Features:
 * - Mode selector (monitor/send) (Requirement 14.1, 14.2)
 * - IMAP configuration for monitoring (Requirement 14.1)
 * - Email filters for monitoring (Requirement 14.1)
 * - SMTP configuration for sending (Requirement 14.2)
 * - Recipients configuration (Requirement 14.2)
 * - Email content editor (Requirement 14.2)
 * - Attachment handling (Requirement 14.3)
 * - Standard properties panel integration
 * 
 * @see Requirements 14.1, 14.2, 14.3, 12.2
 */
export function EmailPanel({ node, onChange }: EmailPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateMode = useCallback((mode: EmailMode) => {
    const updates: Partial<EmailNodeConfig> = { mode };
    
    // Initialize appropriate config based on mode
    if (mode === 'monitor' && !node.imap) {
      updates.imap = { ...DEFAULT_IMAP_CONFIG };
      updates.filters = { ...DEFAULT_FILTERS };
    } else if (mode === 'send' && !node.smtp) {
      updates.smtp = { ...DEFAULT_SMTP_CONFIG };
      updates.recipients = { ...DEFAULT_RECIPIENTS };
      updates.content = { ...DEFAULT_CONTENT };
    }
    
    onChange({ ...node, ...updates });
  }, [node, onChange]);
  
  const updateImap = useCallback((updates: Partial<ImapConfig>) => {
    onChange({
      ...node,
      imap: { ...(node.imap || DEFAULT_IMAP_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateFilters = useCallback((updates: Partial<EmailFilter>) => {
    onChange({
      ...node,
      filters: { ...(node.filters || DEFAULT_FILTERS), ...updates },
    });
  }, [node, onChange]);
  
  const updateSmtp = useCallback((updates: Partial<SmtpConfig>) => {
    onChange({
      ...node,
      smtp: { ...(node.smtp || DEFAULT_SMTP_CONFIG), ...updates },
    });
  }, [node, onChange]);
  
  const updateRecipients = useCallback((updates: Partial<EmailRecipients>) => {
    onChange({
      ...node,
      recipients: { ...(node.recipients || DEFAULT_RECIPIENTS), ...updates },
    });
  }, [node, onChange]);
  
  const updateContent = useCallback((updates: Partial<EmailContent>) => {
    onChange({
      ...node,
      content: { ...(node.content || DEFAULT_CONTENT), ...updates },
    });
  }, [node, onChange]);
  
  const updateAttachments = useCallback((attachments: EmailAttachment[]) => {
    onChange({ ...node, attachments });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="email-panel">
      {/* Mode Selection */}
      <CollapsibleSection title="Email Mode" defaultOpen>
        <Field label="Mode" required tooltip="Choose whether to monitor incoming emails or send outgoing emails">
          <div className="email-mode-selector">
            {EMAIL_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`email-mode-option ${node.mode === mode ? 'selected' : ''}`}
                onClick={() => updateMode(mode)}
                title={EMAIL_MODE_DESCRIPTIONS[mode]}
              >
                {EMAIL_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </Field>
        <div className="email-panel-mode-description">
          {EMAIL_MODE_DESCRIPTIONS[node.mode]}
        </div>
      </CollapsibleSection>
      
      {/* IMAP Configuration (Monitor Mode) */}
      {node.mode === 'monitor' && (
        <ImapSection imap={node.imap} onChange={updateImap} />
      )}
      
      {/* Email Filters (Monitor Mode) */}
      {node.mode === 'monitor' && (
        <FiltersSection filters={node.filters} onChange={updateFilters} />
      )}
      
      {/* SMTP Configuration (Send Mode) */}
      {node.mode === 'send' && (
        <SmtpSection smtp={node.smtp} onChange={updateSmtp} />
      )}
      
      {/* Recipients (Send Mode) */}
      {node.mode === 'send' && (
        <RecipientsSection recipients={node.recipients} onChange={updateRecipients} />
      )}
      
      {/* Email Content (Send Mode) */}
      {node.mode === 'send' && (
        <ContentSection content={node.content} onChange={updateContent} />
      )}
      
      {/* Attachments (Both Modes) */}
      <AttachmentsSection 
        attachments={node.attachments || []} 
        onChange={updateAttachments}
        mode={node.mode}
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
// IMAP Section Component (Requirement 14.1)
// ============================================

interface ImapSectionProps {
  imap?: ImapConfig;
  onChange: (updates: Partial<ImapConfig>) => void;
}

/**
 * IMAP configuration section for email monitoring.
 * @see Requirement 14.1
 */
function ImapSection({ imap, onChange }: ImapSectionProps) {
  const config = imap || DEFAULT_IMAP_CONFIG;
  
  return (
    <CollapsibleSection title="IMAP Connection" defaultOpen>
      <Field label="Host" required tooltip="IMAP server hostname (e.g., imap.gmail.com)">
        <input
          type="text"
          className="email-panel-input"
          value={config.host}
          onChange={(e) => onChange({ host: e.target.value })}
          placeholder="imap.gmail.com"
        />
      </Field>
      
      <div className="email-panel-row">
        <Field label="Port" required>
          <input
            type="number"
            className="email-panel-input email-panel-input-small"
            value={config.port}
            onChange={(e) => onChange({ port: parseInt(e.target.value, 10) || 993 })}
            min={1}
            max={65535}
          />
        </Field>
        
        <Field label="SSL/TLS">
          <label className="email-panel-toggle">
            <input
              type="checkbox"
              checked={config.secure}
              onChange={(e) => onChange({ secure: e.target.checked })}
            />
            <span className="email-panel-toggle-slider" />
            <span className="email-panel-toggle-label">
              {config.secure ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </Field>
      </div>
      
      <Field label="Username" required hint="email address">
        <input
          type="text"
          className="email-panel-input"
          value={config.username}
          onChange={(e) => onChange({ username: e.target.value })}
          placeholder="user@example.com"
        />
      </Field>
      
      <Field label="Password" required hint="or {{variable}}">
        <input
          type="password"
          className="email-panel-input"
          value={config.password}
          onChange={(e) => onChange({ password: e.target.value })}
          placeholder="Password or {{EMAIL_PASSWORD}}"
        />
      </Field>
      
      <Field label="Folder" tooltip="IMAP folder to monitor">
        <input
          type="text"
          className="email-panel-input"
          value={config.folder}
          onChange={(e) => onChange({ folder: e.target.value })}
          placeholder="INBOX"
        />
      </Field>
      
      <Field label="Mark as Read">
        <label className="email-panel-toggle">
          <input
            type="checkbox"
            checked={config.markAsRead}
            onChange={(e) => onChange({ markAsRead: e.target.checked })}
          />
          <span className="email-panel-toggle-slider" />
          <span className="email-panel-toggle-label">
            {config.markAsRead ? 'Yes' : 'No'}
          </span>
        </label>
      </Field>
      
      {/* Common IMAP presets */}
      <div className="email-panel-presets">
        <span className="email-panel-presets-label">Quick setup:</span>
        <button 
          type="button" 
          onClick={() => onChange({ host: 'imap.gmail.com', port: 993, secure: true })}
        >
          Gmail
        </button>
        <button 
          type="button" 
          onClick={() => onChange({ host: 'outlook.office365.com', port: 993, secure: true })}
        >
          Outlook
        </button>
        <button 
          type="button" 
          onClick={() => onChange({ host: 'imap.mail.yahoo.com', port: 993, secure: true })}
        >
          Yahoo
        </button>
      </div>
    </CollapsibleSection>
  );
}

// ============================================
// Filters Section Component (Requirement 14.1)
// ============================================

interface FiltersSectionProps {
  filters?: EmailFilter;
  onChange: (updates: Partial<EmailFilter>) => void;
}

/**
 * Email filter configuration section.
 * @see Requirement 14.1
 */
function FiltersSection({ filters, onChange }: FiltersSectionProps) {
  const config = filters || DEFAULT_FILTERS;
  
  return (
    <CollapsibleSection title="Email Filters" defaultOpen={false}>
      <Field label="Unread Only">
        <label className="email-panel-toggle">
          <input
            type="checkbox"
            checked={config.unreadOnly}
            onChange={(e) => onChange({ unreadOnly: e.target.checked })}
          />
          <span className="email-panel-toggle-slider" />
          <span className="email-panel-toggle-label">
            {config.unreadOnly ? 'Yes' : 'No'}
          </span>
        </label>
      </Field>
      
      <Field label="From" hint="sender filter">
        <input
          type="text"
          className="email-panel-input"
          value={config.from || ''}
          onChange={(e) => onChange({ from: e.target.value || undefined })}
          placeholder="sender@example.com or *@company.com"
        />
      </Field>
      
      <Field label="Subject" hint="supports wildcards">
        <input
          type="text"
          className="email-panel-input"
          value={config.subject || ''}
          onChange={(e) => onChange({ subject: e.target.value || undefined })}
          placeholder="*invoice* or Order Confirmation"
        />
      </Field>
      
      <div className="email-panel-row">
        <Field label="Date From">
          <input
            type="date"
            className="email-panel-input"
            value={config.dateFrom || ''}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
          />
        </Field>
        
        <Field label="Date To">
          <input
            type="date"
            className="email-panel-input"
            value={config.dateTo || ''}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
          />
        </Field>
      </div>
    </CollapsibleSection>
  );
}

// ============================================
// SMTP Section Component (Requirement 14.2)
// ============================================

interface SmtpSectionProps {
  smtp?: SmtpConfig;
  onChange: (updates: Partial<SmtpConfig>) => void;
}

/**
 * SMTP configuration section for sending emails.
 * @see Requirement 14.2
 */
function SmtpSection({ smtp, onChange }: SmtpSectionProps) {
  const config = smtp || DEFAULT_SMTP_CONFIG;
  
  return (
    <CollapsibleSection title="SMTP Connection" defaultOpen>
      <Field label="Host" required tooltip="SMTP server hostname (e.g., smtp.gmail.com)">
        <input
          type="text"
          className="email-panel-input"
          value={config.host}
          onChange={(e) => onChange({ host: e.target.value })}
          placeholder="smtp.gmail.com"
        />
      </Field>
      
      <div className="email-panel-row">
        <Field label="Port" required>
          <input
            type="number"
            className="email-panel-input email-panel-input-small"
            value={config.port}
            onChange={(e) => onChange({ port: parseInt(e.target.value, 10) || 587 })}
            min={1}
            max={65535}
          />
        </Field>
        
        <Field label="SSL/TLS">
          <label className="email-panel-toggle">
            <input
              type="checkbox"
              checked={config.secure}
              onChange={(e) => onChange({ secure: e.target.checked })}
            />
            <span className="email-panel-toggle-slider" />
            <span className="email-panel-toggle-label">
              {config.secure ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </Field>
      </div>
      
      <Field label="Username" required hint="email address">
        <input
          type="text"
          className="email-panel-input"
          value={config.username}
          onChange={(e) => onChange({ username: e.target.value })}
          placeholder="user@example.com"
        />
      </Field>
      
      <Field label="Password" required hint="or {{variable}}">
        <input
          type="password"
          className="email-panel-input"
          value={config.password}
          onChange={(e) => onChange({ password: e.target.value })}
          placeholder="Password or {{EMAIL_PASSWORD}}"
        />
      </Field>
      
      <Field label="From Email" required>
        <input
          type="email"
          className="email-panel-input"
          value={config.fromEmail}
          onChange={(e) => onChange({ fromEmail: e.target.value })}
          placeholder="noreply@example.com"
        />
      </Field>
      
      <Field label="From Name" hint="display name">
        <input
          type="text"
          className="email-panel-input"
          value={config.fromName || ''}
          onChange={(e) => onChange({ fromName: e.target.value || undefined })}
          placeholder="My Application"
        />
      </Field>
      
      {/* Common SMTP presets */}
      <div className="email-panel-presets">
        <span className="email-panel-presets-label">Quick setup:</span>
        <button 
          type="button" 
          onClick={() => onChange({ host: 'smtp.gmail.com', port: 587, secure: true })}
        >
          Gmail
        </button>
        <button 
          type="button" 
          onClick={() => onChange({ host: 'smtp.office365.com', port: 587, secure: true })}
        >
          Outlook
        </button>
        <button 
          type="button" 
          onClick={() => onChange({ host: 'smtp.sendgrid.net', port: 587, secure: true })}
        >
          SendGrid
        </button>
      </div>
    </CollapsibleSection>
  );
}

// ============================================
// Recipients Section Component (Requirement 14.2)
// ============================================

interface RecipientsSectionProps {
  recipients?: EmailRecipients;
  onChange: (updates: Partial<EmailRecipients>) => void;
}

/**
 * Email recipients configuration section.
 * @see Requirement 14.2
 */
function RecipientsSection({ recipients, onChange }: RecipientsSectionProps) {
  const config = recipients || DEFAULT_RECIPIENTS;
  
  return (
    <CollapsibleSection title="Recipients" defaultOpen>
      <Field label="To" required hint="comma-separated or {{variable}}">
        <textarea
          className="email-panel-textarea"
          value={config.to}
          onChange={(e) => onChange({ to: e.target.value })}
          placeholder="recipient@example.com, another@example.com"
          rows={2}
        />
      </Field>
      
      <Field label="CC" hint="comma-separated">
        <input
          type="text"
          className="email-panel-input"
          value={config.cc || ''}
          onChange={(e) => onChange({ cc: e.target.value || undefined })}
          placeholder="cc@example.com"
        />
      </Field>
      
      <Field label="BCC" hint="comma-separated">
        <input
          type="text"
          className="email-panel-input"
          value={config.bcc || ''}
          onChange={(e) => onChange({ bcc: e.target.value || undefined })}
          placeholder="bcc@example.com"
        />
      </Field>
    </CollapsibleSection>
  );
}

// ============================================
// Content Section Component (Requirement 14.2)
// ============================================

interface ContentSectionProps {
  content?: EmailContent;
  onChange: (updates: Partial<EmailContent>) => void;
}

/**
 * Email content configuration section.
 * @see Requirement 14.2
 */
function ContentSection({ content, onChange }: ContentSectionProps) {
  const config = content || DEFAULT_CONTENT;
  
  return (
    <CollapsibleSection title="Email Content" defaultOpen>
      <Field label="Subject" required hint="supports {{variable}}">
        <input
          type="text"
          className="email-panel-input"
          value={config.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="Your order {{orderId}} has shipped"
        />
      </Field>
      
      <Field label="Body Type">
        <div className="email-body-type-selector">
          {EMAIL_BODY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`email-body-type-option ${config.bodyType === type ? 'selected' : ''}`}
              onClick={() => onChange({ bodyType: type })}
            >
              {EMAIL_BODY_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </Field>
      
      <Field label="Body" required hint="supports {{variable}}">
        <textarea
          className={`email-panel-textarea email-panel-textarea-large ${config.bodyType === 'html' ? 'email-panel-textarea-mono' : ''}`}
          value={config.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder={config.bodyType === 'html' 
            ? '<html><body><h1>Hello {{name}}</h1></body></html>'
            : 'Hello {{name}},\n\nYour order has shipped.\n\nBest regards'
          }
          rows={8}
        />
      </Field>
      
      {config.bodyType === 'html' && (
        <div className="email-panel-info">
          <span className="email-panel-info-icon">💡</span>
          <span className="email-panel-info-text">
            Use HTML tags for formatting. Variables like {'{{name}}'} will be interpolated from state.
          </span>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ============================================
// Attachments Section Component (Requirement 14.3)
// ============================================

interface AttachmentsSectionProps {
  attachments: EmailAttachment[];
  onChange: (attachments: EmailAttachment[]) => void;
  mode: EmailMode;
}

/**
 * Email attachments configuration section.
 * @see Requirement 14.3
 */
function AttachmentsSection({ attachments, onChange, mode }: AttachmentsSectionProps) {
  const handleAdd = () => {
    onChange([...attachments, { filename: '', stateKey: '' }]);
  };
  
  const handleRemove = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };
  
  const handleUpdate = (index: number, updates: Partial<EmailAttachment>) => {
    onChange(attachments.map((att, i) => i === index ? { ...att, ...updates } : att));
  };
  
  return (
    <CollapsibleSection title="Attachments" defaultOpen={attachments.length > 0}>
      {mode === 'monitor' ? (
        <div className="email-panel-info">
          <span className="email-panel-info-icon">📎</span>
          <span className="email-panel-info-text">
            Attachments from monitored emails will be available in the output state.
            Configure state keys below to map specific attachments.
          </span>
        </div>
      ) : (
        <div className="email-panel-info">
          <span className="email-panel-info-icon">📎</span>
          <span className="email-panel-info-text">
            Attach files from workflow state. The state key should contain base64 data or a file path.
          </span>
        </div>
      )}
      
      <div className="email-attachments-list">
        {attachments.map((att, index) => (
          <div key={index} className="email-attachment-row">
            <input
              type="text"
              className="email-panel-input email-attachment-filename"
              value={att.filename}
              onChange={(e) => handleUpdate(index, { filename: e.target.value })}
              placeholder="report.pdf"
            />
            <span className="email-attachment-arrow">←</span>
            <input
              type="text"
              className="email-panel-input email-attachment-statekey"
              value={att.stateKey}
              onChange={(e) => handleUpdate(index, { stateKey: e.target.value })}
              placeholder="state.fileData"
            />
            <input
              type="text"
              className="email-panel-input email-attachment-mime"
              value={att.mimeType || ''}
              onChange={(e) => handleUpdate(index, { mimeType: e.target.value || undefined })}
              placeholder="application/pdf"
            />
            <button
              type="button"
              className="email-attachment-remove"
              onClick={() => handleRemove(index)}
              title="Remove attachment"
            >
              ×
            </button>
          </div>
        ))}
        
        <button
          type="button"
          className="email-attachment-add"
          onClick={handleAdd}
        >
          + Add Attachment
        </button>
      </div>
    </CollapsibleSection>
  );
}

export default EmailPanel;
