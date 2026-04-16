/**
 * HttpNode Component for ADK Studio
 * 
 * ReactFlow node wrapper for HTTP action nodes.
 * Displays HTTP method, URL preview, and authentication indicator.
 * 
 * Requirements: 3.1, 12.1, 12.3
 */

import { memo } from 'react';
import { ActionNodeBase } from './ActionNodeBase';
import type { HttpNodeConfig, HttpMethod } from '../../types/actionNodes';

interface HttpNodeData extends HttpNodeConfig {
  isActive?: boolean;
}

interface Props {
  data: HttpNodeData;
  selected?: boolean;
}

/**
 * HTTP method color mapping for visual distinction.
 */
const HTTP_METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#10B981',     // Green
  POST: '#3B82F6',    // Blue
  PUT: '#F59E0B',     // Amber
  PATCH: '#8B5CF6',   // Purple
  DELETE: '#EF4444',  // Red
};

/**
 * Truncates URL for display, preserving the domain and path start.
 */
function truncateUrl(url: string, maxLength: number = 35): string {
  if (!url || url.length <= maxLength) return url;
  
  // Try to preserve the domain
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    // If domain + start of path fits, show that
    const domainPart = domain.length > 20 ? domain.substring(0, 17) + '...' : domain;
    const remaining = maxLength - domainPart.length - 3; // 3 for "..."
    
    if (remaining > 5 && path.length > 1) {
      const pathPart = path.length > remaining ? path.substring(0, remaining - 3) + '...' : path;
      return domainPart + pathPart;
    }
    
    return domainPart + (path.length > 1 ? '/...' : '');
  } catch {
    // If URL parsing fails, just truncate
    return url.substring(0, maxLength - 3) + '...';
  }
}

/**
 * Checks if URL contains variable interpolation.
 */
function hasVariables(url: string): boolean {
  return /\{\{[^}]+\}\}/.test(url);
}

/**
 * HttpNode displays API calls and HTTP requests.
 * 
 * Features:
 * - Color-coded HTTP method badge (Requirement 3.1)
 * - URL preview with truncation
 * - Variable interpolation indicator ({{variable}})
 * - Authentication type indicator
 * - Response type badge
 * 
 * @see Requirements 3.1, 12.1, 12.3
 */
export const HttpNode = memo(function HttpNode({ data, selected }: Props) {
  const methodColor = HTTP_METHOD_COLORS[data.method] || '#6B7280';
  const displayUrl = truncateUrl(data.url);
  const hasVars = hasVariables(data.url);
  const hasAuth = data.auth?.type && data.auth.type !== 'none';
  
  return (
    <ActionNodeBase
      type="http"
      label={data.name || 'HTTP Request'}
      isActive={data.isActive}
      isSelected={selected}
      status={data.isActive ? 'running' : 'idle'}
    >
      <div className="http-node-content">
        {/* Method and URL row */}
        <div className="http-method-row">
          <span 
            className="http-method-badge"
            style={{ backgroundColor: methodColor }}
          >
            {data.method}
          </span>
          {hasVars && (
            <span className="http-vars-indicator" title="Contains variables">
              {'{{}}'}
            </span>
          )}
        </div>
        
        {/* URL preview */}
        {data.url && (
          <div className="http-url-preview" title={data.url}>
            {displayUrl || 'No URL configured'}
          </div>
        )}
        
        {/* Status indicators row */}
        <div className="http-indicators">
          {hasAuth && (
            <span className="http-auth-badge" title={`Auth: ${data.auth.type}`}>
              🔐 {data.auth.type}
            </span>
          )}
          {data.response?.type && data.response.type !== 'json' && (
            <span className="http-response-badge" title={`Response: ${data.response.type}`}>
              {data.response.type}
            </span>
          )}
          {data.response?.jsonPath && (
            <span className="http-jsonpath-badge" title={`Extract: ${data.response.jsonPath}`}>
              $.
            </span>
          )}
        </div>
      </div>
    </ActionNodeBase>
  );
});

export default HttpNode;
