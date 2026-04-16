/**
 * RssPanel Component for ADK Studio
 * 
 * Properties panel for configuring RSS/Feed action nodes.
 * Provides UI for feed URL, poll interval, filters, and tracking configuration.
 * 
 * Requirements: 15.1, 15.2, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  RssNodeConfig,
  FeedFilter,
  SeenItemTracking,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/rssPanel.css';

// ============================================
// Constants
// ============================================

const POLL_INTERVAL_PRESETS = [
  { label: '1 minute', value: 60000 },
  { label: '5 minutes', value: 300000 },
  { label: '15 minutes', value: 900000 },
  { label: '30 minutes', value: 1800000 },
  { label: '1 hour', value: 3600000 },
  { label: '6 hours', value: 21600000 },
  { label: '12 hours', value: 43200000 },
  { label: '24 hours', value: 86400000 },
];

const DEFAULT_FILTERS: FeedFilter = {
  keywords: [],
  categories: [],
};

const DEFAULT_SEEN_TRACKING: SeenItemTracking = {
  enabled: false,
  stateKey: 'seenFeedItems',
  maxItems: 1000,
};

// ============================================
// Main Component
// ============================================

export interface RssPanelProps {
  /** Current RSS node configuration */
  node: RssNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: RssNodeConfig) => void;
}

/**
 * RssPanel provides configuration UI for RSS/Feed action nodes.
 * 
 * Features:
 * - Feed URL input (Requirement 15.1)
 * - Poll interval configuration (Requirement 15.1)
 * - Keyword and date filters (Requirement 15.1)
 * - Seen item tracking (Requirement 15.1)
 * - Feed parsing options (Requirement 15.2)
 * - Standard properties panel integration
 * 
 * @see Requirements 15.1, 15.2, 12.2
 */
export function RssPanel({ node, onChange }: RssPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateFeedUrl = useCallback((feedUrl: string) => {
    onChange({ ...node, feedUrl });
  }, [node, onChange]);
  
  const updatePollInterval = useCallback((pollInterval: number) => {
    onChange({ ...node, pollInterval });
  }, [node, onChange]);
  
  const updateFilters = useCallback((updates: Partial<FeedFilter>) => {
    onChange({
      ...node,
      filters: { ...(node.filters || DEFAULT_FILTERS), ...updates },
    });
  }, [node, onChange]);
  
  const updateSeenTracking = useCallback((updates: Partial<SeenItemTracking>) => {
    onChange({
      ...node,
      seenTracking: { ...(node.seenTracking || DEFAULT_SEEN_TRACKING), ...updates },
    });
  }, [node, onChange]);
  
  const updateMaxEntries = useCallback((maxEntries: number | undefined) => {
    onChange({ ...node, maxEntries });
  }, [node, onChange]);
  
  const updateIncludeContent = useCallback((includeContent: boolean) => {
    onChange({ ...node, includeContent });
  }, [node, onChange]);
  
  const updateParseMedia = useCallback((parseMedia: boolean) => {
    onChange({ ...node, parseMedia });
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="rss-panel">
      {/* Feed Configuration */}
      <CollapsibleSection title="Feed Configuration" defaultOpen>
        <Field 
          label="Feed URL" 
          required 
          tooltip="URL of the RSS or Atom feed to monitor"
        >
          <input
            type="url"
            className="rss-panel-input"
            value={node.feedUrl || ''}
            onChange={(e) => updateFeedUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
          />
        </Field>
        
        <Field 
          label="Poll Interval" 
          required 
          tooltip="How often to check the feed for new entries"
        >
          <div className="rss-poll-interval-selector">
            <select
              className="rss-panel-select"
              value={node.pollInterval}
              onChange={(e) => updatePollInterval(parseInt(e.target.value, 10))}
            >
              {POLL_INTERVAL_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            
            {!POLL_INTERVAL_PRESETS.some(p => p.value === node.pollInterval) && (
              <div className="rss-custom-interval">
                <input
                  type="number"
                  className="rss-panel-input rss-panel-input-small"
                  value={node.pollInterval}
                  onChange={(e) => updatePollInterval(parseInt(e.target.value, 10) || 60000)}
                  min={1000}
                />
                <span className="rss-interval-unit">ms</span>
              </div>
            )}
          </div>
        </Field>
        
        <Field 
          label="Max Entries" 
          hint="per poll"
          tooltip="Maximum number of entries to return per poll (leave empty for all)"
        >
          <input
            type="number"
            className="rss-panel-input rss-panel-input-small"
            value={node.maxEntries || ''}
            onChange={(e) => updateMaxEntries(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            placeholder="All"
            min={1}
            max={100}
          />
        </Field>
      </CollapsibleSection>
      
      {/* Feed Filters */}
      <FiltersSection 
        filters={node.filters} 
        onChange={updateFilters} 
      />
      
      {/* Seen Item Tracking */}
      <SeenTrackingSection 
        seenTracking={node.seenTracking} 
        onChange={updateSeenTracking} 
      />
      
      {/* Content Options */}
      <CollapsibleSection title="Content Options" defaultOpen={false}>
        <Field 
          label="Include Full Content"
          tooltip="Include the full content of each entry, not just the summary"
        >
          <label className="rss-panel-toggle">
            <input
              type="checkbox"
              checked={node.includeContent}
              onChange={(e) => updateIncludeContent(e.target.checked)}
            />
            <span className="rss-panel-toggle-slider" />
            <span className="rss-panel-toggle-label">
              {node.includeContent ? 'Yes' : 'No'}
            </span>
          </label>
        </Field>
        
        <Field 
          label="Parse Media/Enclosures"
          tooltip="Extract media attachments and enclosures from feed entries"
        >
          <label className="rss-panel-toggle">
            <input
              type="checkbox"
              checked={node.parseMedia}
              onChange={(e) => updateParseMedia(e.target.checked)}
            />
            <span className="rss-panel-toggle-slider" />
            <span className="rss-panel-toggle-label">
              {node.parseMedia ? 'Yes' : 'No'}
            </span>
          </label>
        </Field>
      </CollapsibleSection>
      
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
// Filters Section Component (Requirement 15.1)
// ============================================

interface FiltersSectionProps {
  filters?: FeedFilter;
  onChange: (updates: Partial<FeedFilter>) => void;
}

/**
 * Feed filter configuration section.
 * @see Requirement 15.1
 */
function FiltersSection({ filters, onChange }: FiltersSectionProps) {
  const config = filters || DEFAULT_FILTERS;
  const [keywordInput, setKeywordInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  
  const addKeyword = () => {
    if (keywordInput.trim()) {
      const keywords = [...(config.keywords || []), keywordInput.trim()];
      onChange({ keywords });
      setKeywordInput('');
    }
  };
  
  const removeKeyword = (index: number) => {
    const keywords = (config.keywords || []).filter((_, i) => i !== index);
    onChange({ keywords });
  };
  
  const addCategory = () => {
    if (categoryInput.trim()) {
      const categories = [...(config.categories || []), categoryInput.trim()];
      onChange({ categories });
      setCategoryInput('');
    }
  };
  
  const removeCategory = (index: number) => {
    const categories = (config.categories || []).filter((_, i) => i !== index);
    onChange({ categories });
  };
  
  return (
    <CollapsibleSection title="Filters" defaultOpen={false}>
      <Field 
        label="Keywords" 
        hint="in title or description"
        tooltip="Filter entries that contain any of these keywords"
      >
        <div className="rss-tags-input">
          <div className="rss-tags-list">
            {(config.keywords || []).map((keyword, index) => (
              <span key={index} className="rss-tag">
                {keyword}
                <button 
                  type="button" 
                  className="rss-tag-remove"
                  onClick={() => removeKeyword(index)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="rss-tag-input-row">
            <input
              type="text"
              className="rss-panel-input"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Add keyword..."
            />
            <button 
              type="button" 
              className="rss-tag-add"
              onClick={addKeyword}
            >
              +
            </button>
          </div>
        </div>
      </Field>
      
      <Field 
        label="Author"
        tooltip="Filter entries by author name"
      >
        <input
          type="text"
          className="rss-panel-input"
          value={config.author || ''}
          onChange={(e) => onChange({ author: e.target.value || undefined })}
          placeholder="Author name"
        />
      </Field>
      
      <div className="rss-panel-row">
        <Field label="Date From">
          <input
            type="date"
            className="rss-panel-input"
            value={config.dateFrom || ''}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
          />
        </Field>
        
        <Field label="Date To">
          <input
            type="date"
            className="rss-panel-input"
            value={config.dateTo || ''}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
          />
        </Field>
      </div>
      
      <Field 
        label="Categories/Tags"
        tooltip="Filter entries by category or tag"
      >
        <div className="rss-tags-input">
          <div className="rss-tags-list">
            {(config.categories || []).map((category, index) => (
              <span key={index} className="rss-tag rss-tag-category">
                {category}
                <button 
                  type="button" 
                  className="rss-tag-remove"
                  onClick={() => removeCategory(index)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="rss-tag-input-row">
            <input
              type="text"
              className="rss-panel-input"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
              placeholder="Add category..."
            />
            <button 
              type="button" 
              className="rss-tag-add"
              onClick={addCategory}
            >
              +
            </button>
          </div>
        </div>
      </Field>
    </CollapsibleSection>
  );
}

// ============================================
// Seen Tracking Section Component (Requirement 15.1)
// ============================================

interface SeenTrackingSectionProps {
  seenTracking?: SeenItemTracking;
  onChange: (updates: Partial<SeenItemTracking>) => void;
}

/**
 * Seen item tracking configuration section.
 * @see Requirement 15.1
 */
function SeenTrackingSection({ seenTracking, onChange }: SeenTrackingSectionProps) {
  const config = seenTracking || DEFAULT_SEEN_TRACKING;
  
  return (
    <CollapsibleSection title="Duplicate Prevention" defaultOpen={false}>
      <div className="rss-panel-info">
        <span className="rss-panel-info-icon">💡</span>
        <span className="rss-panel-info-text">
          Track seen items to avoid processing the same entry multiple times.
        </span>
      </div>
      
      <Field 
        label="Enable Tracking"
        tooltip="Track seen items to prevent duplicate processing"
      >
        <label className="rss-panel-toggle">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <span className="rss-panel-toggle-slider" />
          <span className="rss-panel-toggle-label">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Field>
      
      {config.enabled && (
        <>
          <Field 
            label="State Key"
            tooltip="Key in workflow state to store seen item IDs"
          >
            <input
              type="text"
              className="rss-panel-input"
              value={config.stateKey}
              onChange={(e) => onChange({ stateKey: e.target.value })}
              placeholder="seenFeedItems"
            />
          </Field>
          
          <Field 
            label="Max Tracked Items"
            tooltip="Maximum number of item IDs to keep in memory"
          >
            <input
              type="number"
              className="rss-panel-input rss-panel-input-small"
              value={config.maxItems}
              onChange={(e) => onChange({ maxItems: parseInt(e.target.value, 10) || 1000 })}
              min={100}
              max={10000}
            />
          </Field>
        </>
      )}
    </CollapsibleSection>
  );
}

export default RssPanel;
