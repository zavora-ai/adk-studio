/**
 * TemplateGallery component for ADK Studio v2.0
 * 
 * Displays curated templates with category filters.
 * Allows users to select templates to load onto the canvas.
 * 
 * Requirements: 6.7
 */

import { useState, useMemo } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { TEMPLATES, CATEGORY_LABELS, getCategories } from './templates';
import { TemplateCard } from './TemplateCard';
import type { Template, TemplateCategory } from './templates';
import type { ActionNodeType } from '../../types/actionNodes';

/**
 * Action node type labels for filter display
 */
const ACTION_NODE_LABELS: Record<ActionNodeType, string> = {
  trigger: '🎯 Trigger',
  http: '🌐 HTTP',
  set: '📝 Set',
  transform: '⚙️ Transform',
  switch: '🔀 Switch',
  loop: '🔄 Loop',
  merge: '🔗 Merge',
  wait: '⏱️ Wait',
  code: '💻 Code',
  database: '🗄️ Database',
  email: '📧 Email',
  notification: '🔔 Notification',
  rss: '📡 RSS',
  file: '📁 File',
};

interface TemplateGalleryProps {
  /** Callback when a template is selected */
  onSelect: (template: Template) => void;
  /** Callback when Run button is clicked on a template */
  onRun?: (template: Template) => void;
  /** Callback to close the gallery */
  onClose?: () => void;
  /** Whether to show as a modal */
  isModal?: boolean;
}

/**
 * Template gallery with category filters and search
 */
export function TemplateGallery({ 
  onSelect, 
  onRun, 
  onClose,
  isModal = false 
}: TemplateGalleryProps) {
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<Set<ActionNodeType>>(new Set());
  const [showNodeTypeFilter, setShowNodeTypeFilter] = useState(false);

  // Get all unique action node types from automation templates
  const availableNodeTypes = useMemo(() => {
    const types = new Set<ActionNodeType>();
    TEMPLATES.forEach(template => {
      if (template.actionNodes) {
        Object.values(template.actionNodes).forEach(node => {
          types.add(node.type);
        });
      }
    });
    return Array.from(types).sort();
  }, []);

  // Toggle node type filter
  const toggleNodeType = (type: ActionNodeType) => {
    setSelectedNodeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Clear all node type filters
  const clearNodeTypeFilters = () => {
    setSelectedNodeTypes(new Set());
  };

  // Filter templates by category, search, and node types
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = category === 'all' || template.category === category;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by selected node types (if any selected)
    let matchesNodeTypes = true;
    if (selectedNodeTypes.size > 0) {
      if (!template.actionNodes) {
        matchesNodeTypes = false;
      } else {
        const templateNodeTypes = new Set(Object.values(template.actionNodes).map(n => n.type));
        matchesNodeTypes = Array.from(selectedNodeTypes).every(type => templateNodeTypes.has(type));
      }
    }
    
    return matchesCategory && matchesSearch && matchesNodeTypes;
  });

  const categories = getCategories();

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <h2 
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Template Gallery
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-opacity-10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search and filters */}
      <div className="p-4 space-y-3">
        {/* Search input */}
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-default)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: category === 'all' 
                ? 'var(--accent-primary)' 
                : 'var(--bg-secondary)',
              color: category === 'all' 
                ? 'white' 
                : 'var(--text-secondary)',
            }}
          >
            {CATEGORY_LABELS.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor: category === cat 
                  ? 'var(--accent-primary)' 
                  : 'var(--bg-secondary)',
                color: category === cat 
                  ? 'white' 
                  : 'var(--text-secondary)',
              }}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
          
          {/* Node type filter toggle */}
          <button
            onClick={() => setShowNodeTypeFilter(!showNodeTypeFilter)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
            style={{
              backgroundColor: selectedNodeTypes.size > 0 || showNodeTypeFilter
                ? 'var(--accent-secondary)' 
                : 'var(--bg-secondary)',
              color: selectedNodeTypes.size > 0 || showNodeTypeFilter
                ? 'white' 
                : 'var(--text-secondary)',
            }}
            title="Filter by action node types"
          >
            <Filter size={14} />
            {selectedNodeTypes.size > 0 && (
              <span className="ml-1">({selectedNodeTypes.size})</span>
            )}
          </button>
        </div>

        {/* Action node type filters (collapsible) */}
        {showNodeTypeFilter && (
          <div 
            className="p-3 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Filter by Action Node Types
              </span>
              {selectedNodeTypes.size > 0 && (
                <button
                  onClick={clearNodeTypeFilters}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ 
                    color: 'var(--accent-primary)',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableNodeTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleNodeType(type)}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: selectedNodeTypes.has(type)
                      ? 'var(--accent-primary)' 
                      : 'var(--bg-secondary)',
                    color: selectedNodeTypes.has(type)
                      ? 'white' 
                      : 'var(--text-secondary)',
                  }}
                >
                  {ACTION_NODE_LABELS[type] || type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div 
            className="text-center py-8"
            style={{ color: 'var(--text-muted)' }}
          >
            <p>No templates found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelect(template)}
                onRun={onRun ? () => onRun(template) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div 
        className="p-3 border-t text-center text-sm"
        style={{ 
          borderColor: 'var(--border-default)',
          color: 'var(--text-muted)',
        }}
      >
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );

  // Render as modal or inline
  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <div 
          className="w-full max-w-4xl max-h-[80vh] rounded-lg shadow-xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface-panel)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {content}
    </div>
  );
}
