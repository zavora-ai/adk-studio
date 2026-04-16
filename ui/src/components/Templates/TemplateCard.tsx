/**
 * TemplateCard component for ADK Studio v2.0
 * 
 * Displays individual template preview with name, description, and icon.
 * 
 * Requirements: 6.7
 */

import { Play } from 'lucide-react';
import type { Template } from './templates';
import { CATEGORY_LABELS } from './templates';

interface TemplateCardProps {
  /** Template data */
  template: Template;
  /** Callback when template is selected */
  onSelect: () => void;
  /** Callback when Run button is clicked */
  onRun?: () => void;
}

/**
 * Action node type icons for display
 */
const ACTION_NODE_ICONS: Record<string, string> = {
  trigger: '🎯',
  http: '🌐',
  set: '📝',
  transform: '⚙️',
  switch: '🔀',
  loop: '🔄',
  merge: '🔗',
  wait: '⏱️',
  code: '💻',
  database: '🗄️',
  email: '📧',
  notification: '🔔',
  rss: '📡',
  file: '📁',
};

/**
 * Individual template card with preview
 */
export function TemplateCard({ template, onSelect, onRun }: TemplateCardProps) {
  const agentCount = Object.keys(template.agents).length;
  const actionNodeCount = template.actionNodes ? Object.keys(template.actionNodes).length : 0;
  const edgeCount = template.edges.length;
  
  // Get unique action node types for icon display
  const actionNodeTypes = template.actionNodes 
    ? [...new Set(Object.values(template.actionNodes).map(n => n.type))]
    : [];

  return (
    <div
      className="template-card group cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
      style={{
        backgroundColor: 'var(--surface-card)',
        borderColor: 'var(--border-default)',
      }}
      onClick={onSelect}
    >
      {/* Header with icon and category */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{template.icon}</span>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          {CATEGORY_LABELS[template.category]}
        </span>
      </div>

      {/* Name and description */}
      <h3
        className="font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {template.name}
      </h3>
      <p
        className="text-sm mb-3 line-clamp-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {template.description}
      </p>

      {/* Stats */}
      <div
        className="flex items-center gap-3 text-xs mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>
        {actionNodeCount > 0 && (
          <>
            <span>•</span>
            <span>{actionNodeCount} action{actionNodeCount !== 1 ? 's' : ''}</span>
          </>
        )}
        <span>•</span>
        <span>{edgeCount} connection{edgeCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Action node type icons */}
      {actionNodeTypes.length > 0 && (
        <div 
          className="flex flex-wrap gap-1 mb-3"
          title={`Uses: ${actionNodeTypes.join(', ')}`}
        >
          {actionNodeTypes.slice(0, 6).map((type) => (
            <span
              key={type}
              className="text-sm px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                fontSize: '12px',
              }}
              title={type}
            >
              {ACTION_NODE_ICONS[type] || '📦'}
            </span>
          ))}
          {actionNodeTypes.length > 6 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
              }}
            >
              +{actionNodeTypes.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex-1 px-3 py-2 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Use Template
        </button>
        {onRun && (
          <button
            className="p-2 rounded transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            title="Run immediately"
          >
            <Play size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
