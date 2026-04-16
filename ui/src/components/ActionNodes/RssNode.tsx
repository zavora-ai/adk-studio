/**
 * RssNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for RSS/Feed action nodes.
 * Displays feed URL preview, poll interval, and filter configuration.
 * 
 * Requirements: 15.1, 15.2, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { RssNodeConfig } from '../../types/actionNodes';

interface RssNodeData extends RssNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: RssNodeData;
  selected?: boolean;
}

/**
 * Formats poll interval for display.
 */
function formatPollInterval(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 3600000)}h`;
}

/**
 * Truncates URL for display.
 */
function truncateUrl(url: string, maxLength: number = 35): string {
  if (!url || url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    const path = urlObj.pathname;
    
    // Show host + truncated path
    if (host.length + 5 < maxLength) {
      const availableForPath = maxLength - host.length - 3;
      if (path.length > availableForPath) {
        return `${host}${path.substring(0, availableForPath)}...`;
      }
      return `${host}${path}`;
    }
    
    return host.length > maxLength ? host.substring(0, maxLength - 3) + '...' : host;
  } catch {
    return url.substring(0, maxLength - 3) + '...';
  }
}

/**
 * RssNode displays RSS/Feed monitoring configuration.
 * 
 * Features:
 * - Feed URL preview (Requirement 15.1)
 * - Poll interval indicator
 * - Filter badges (keywords, date range)
 * - Seen item tracking indicator
 * - Entry count limit indicator
 * 
 * @see Requirements 15.1, 15.2, 12.1, 12.3
 */
export const RssNode = memo(function RssNode({ data, selected }: Props) {
  const hasFilters = data.filters && (
    (data.filters.keywords && data.filters.keywords.length > 0) ||
    data.filters.author ||
    data.filters.dateFrom ||
    data.filters.dateTo ||
    (data.filters.categories && data.filters.categories.length > 0)
  );
  
  const hasSeenTracking = data.seenTracking?.enabled;
  
  return (
    <ActionNodeBase
      type="rss"
      label={data.name || 'RSS/Feed'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="rss-node-content">
        {/* Feed URL preview */}
        {data.feedUrl && (
          <div className="rss-url-preview" title={data.feedUrl}>
            <span className="rss-url-icon">🔗</span>
            <span className="rss-url-text">
              {truncateUrl(data.feedUrl)}
            </span>
          </div>
        )}
        
        {/* Poll interval and settings row */}
        <div className="rss-settings-row">
          <span className="rss-poll-badge" title={`Poll every ${formatPollInterval(data.pollInterval)}`}>
            ⏱️ {formatPollInterval(data.pollInterval)}
          </span>
          
          {data.maxEntries && (
            <span className="rss-max-entries-badge" title={`Max ${data.maxEntries} entries`}>
              📋 {data.maxEntries}
            </span>
          )}
          
          {hasSeenTracking && (
            <span className="rss-tracking-badge" title="Tracking seen items">
              👁️
            </span>
          )}
        </div>
        
        {/* Filter indicators */}
        {hasFilters && (
          <div className="rss-filters-row">
            {data.filters?.keywords && data.filters.keywords.length > 0 && (
              <span 
                className="rss-filter-badge" 
                title={`Keywords: ${data.filters.keywords.join(', ')}`}
              >
                🔍 {data.filters.keywords.length} keyword{data.filters.keywords.length > 1 ? 's' : ''}
              </span>
            )}
            
            {data.filters?.author && (
              <span className="rss-filter-badge" title={`Author: ${data.filters.author}`}>
                👤 {data.filters.author.length > 10 
                  ? data.filters.author.substring(0, 10) + '...' 
                  : data.filters.author}
              </span>
            )}
            
            {(data.filters?.dateFrom || data.filters?.dateTo) && (
              <span className="rss-filter-badge" title="Date filter active">
                📅 Date
              </span>
            )}
            
            {data.filters?.categories && data.filters.categories.length > 0 && (
              <span 
                className="rss-filter-badge" 
                title={`Categories: ${data.filters.categories.join(', ')}`}
              >
                🏷️ {data.filters.categories.length}
              </span>
            )}
          </div>
        )}
        
        {/* Content options */}
        <div className="rss-options-row">
          {data.includeContent && (
            <span className="rss-option-badge" title="Including full content">
              📄 Full
            </span>
          )}
          {data.parseMedia && (
            <span className="rss-option-badge" title="Parsing media/enclosures">
              🎬 Media
            </span>
          )}
        </div>
      </div>
    </ActionNodeBase>
  );
});

export default RssNode;
