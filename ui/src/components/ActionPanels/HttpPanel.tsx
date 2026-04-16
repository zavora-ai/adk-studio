/**
 * HttpPanel Component for ADK Studio
 * 
 * Properties panel for configuring HTTP action nodes.
 * Provides UI for HTTP method, URL, authentication, headers, body, and response handling.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.2
 */

import { useCallback, useState } from 'react';
import { StandardPropertiesPanel } from './StandardPropertiesPanel';
import { ACTION_NODE_TOOLTIPS } from '../Overlays/Tooltip';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { Field } from '../shared/Field';
import type { 
  HttpNodeConfig, 
  HttpMethod, 
  HttpAuthType,
  HttpAuth,
  HttpBodyType,
  HttpBody,
  HttpResponseType,
  HttpResponse,
  RateLimit,
} from '../../types/actionNodes';
import type { StandardProperties } from '../../types/standardProperties';
import '../../styles/httpPanel.css';

// ============================================
// Constants
// ============================================

const HTTP_METHODS: readonly HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const HTTP_METHOD_DESCRIPTIONS: Record<HttpMethod, string> = {
  GET: 'Retrieve data',
  POST: 'Create resource',
  PUT: 'Replace resource',
  PATCH: 'Update resource',
  DELETE: 'Remove resource',
};

const HTTP_AUTH_TYPES: readonly HttpAuthType[] = ['none', 'bearer', 'basic', 'api_key'];

const HTTP_AUTH_LABELS: Record<HttpAuthType, string> = {
  none: 'No Authentication',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  api_key: 'API Key',
};

const HTTP_BODY_TYPES: readonly HttpBodyType[] = ['none', 'json', 'form', 'raw'];

const HTTP_BODY_LABELS: Record<HttpBodyType, string> = {
  none: 'No Body',
  json: 'JSON',
  form: 'Form Data',
  raw: 'Raw Text',
};

const HTTP_RESPONSE_TYPES: readonly HttpResponseType[] = ['json', 'text', 'binary'];

const HTTP_RESPONSE_LABELS: Record<HttpResponseType, string> = {
  json: 'JSON',
  text: 'Plain Text',
  binary: 'Binary',
};

// ============================================
// Main Component
// ============================================

export interface HttpPanelProps {
  /** Current HTTP node configuration */
  node: HttpNodeConfig;
  /** Callback when configuration changes */
  onChange: (node: HttpNodeConfig) => void;
}

/**
 * HttpPanel provides configuration UI for HTTP action nodes.
 * 
 * Features:
 * - HTTP method selector (Requirement 3.1)
 * - URL input with variable interpolation support (Requirement 3.1)
 * - Authentication configuration (Requirement 3.2)
 * - Headers key-value editor (Requirement 3.3)
 * - Body configuration with JSON editor (Requirement 3.3)
 * - Response handling options (Requirement 3.4)
 * - Rate limiting configuration (Requirement 3.5)
 * - Standard properties panel integration
 * 
 * @see Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 12.2
 */
export function HttpPanel({ node, onChange }: HttpPanelProps) {
  
  // ============================================
  // Update Handlers
  // ============================================
  
  const updateMethod = useCallback((method: HttpMethod) => {
    onChange({ ...node, method });
  }, [node, onChange]);
  
  const updateUrl = useCallback((url: string) => {
    onChange({ ...node, url });
  }, [node, onChange]);
  
  const updateAuth = useCallback((updates: Partial<HttpAuth>) => {
    onChange({
      ...node,
      auth: { ...node.auth, ...updates },
    });
  }, [node, onChange]);
  
  const updateHeaders = useCallback((headers: Record<string, string>) => {
    onChange({ ...node, headers });
  }, [node, onChange]);
  
  const updateBody = useCallback((updates: Partial<HttpBody>) => {
    onChange({
      ...node,
      body: { ...node.body, ...updates },
    });
  }, [node, onChange]);
  
  const updateResponse = useCallback((updates: Partial<HttpResponse>) => {
    onChange({
      ...node,
      response: { ...node.response, ...updates },
    });
  }, [node, onChange]);
  
  const updateRateLimit = useCallback((updates: Partial<RateLimit> | null) => {
    if (updates === null) {
      const { rateLimit: _, ...rest } = node;
      onChange(rest as HttpNodeConfig);
    } else {
      onChange({
        ...node,
        rateLimit: { ...node.rateLimit, ...updates } as RateLimit,
      });
    }
  }, [node, onChange]);
  
  const updateStandardProperties = useCallback((props: StandardProperties) => {
    onChange({ ...node, ...props });
  }, [node, onChange]);
  
  // ============================================
  // Render
  // ============================================
  
  return (
    <div className="http-panel">
      {/* Method and URL Section (Requirement 3.1) */}
      <CollapsibleSection title="Request" defaultOpen>
        <Field label="HTTP Method" required tooltip={ACTION_NODE_TOOLTIPS.httpMethod}>
          <div className="http-method-selector">
            {HTTP_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                className={`http-method-option ${node.method === method ? 'selected' : ''} http-method-${method.toLowerCase()}`}
                onClick={() => updateMethod(method)}
                title={HTTP_METHOD_DESCRIPTIONS[method]}
              >
                {method}
              </button>
            ))}
          </div>
        </Field>
        
        <Field label="URL" required hint="supports {{variable}} interpolation" tooltip={ACTION_NODE_TOOLTIPS.httpUrl}>
          <input
            type="text"
            className="http-panel-input http-panel-input-mono"
            value={node.url}
            onChange={(e) => updateUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
          />
          {node.url && /\{\{[^}]+\}\}/.test(node.url) && (
            <div className="http-panel-url-vars">
              <span className="http-panel-url-vars-label">Variables detected:</span>
              <span className="http-panel-url-vars-list">
                {(node.url.match(/\{\{([^}]+)\}\}/g) || []).map((v, i) => (
                  <code key={i} className="http-panel-url-var">{v}</code>
                ))}
              </span>
            </div>
          )}
        </Field>
      </CollapsibleSection>
      
      {/* Authentication Section (Requirement 3.2) */}
      <AuthenticationSection auth={node.auth} onChange={updateAuth} />
      
      {/* Headers Section (Requirement 3.3) */}
      <HeadersSection headers={node.headers} onChange={updateHeaders} />
      
      {/* Body Section (Requirement 3.3) */}
      <BodySection body={node.body} method={node.method} onChange={updateBody} />
      
      {/* Response Section (Requirement 3.4) */}
      <ResponseSection response={node.response} onChange={updateResponse} />
      
      {/* Rate Limiting Section (Requirement 3.5) */}
      <RateLimitSection rateLimit={node.rateLimit} onChange={updateRateLimit} />
      
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
// Authentication Section Component
// ============================================

interface AuthenticationSectionProps {
  auth: HttpAuth;
  onChange: (updates: Partial<HttpAuth>) => void;
}

/**
 * Authentication configuration section.
 * @see Requirement 3.2
 */
function AuthenticationSection({ auth, onChange }: AuthenticationSectionProps) {
  return (
    <CollapsibleSection title="Authentication" defaultOpen={auth.type !== 'none'}>
      <Field label="Auth Type" tooltip={ACTION_NODE_TOOLTIPS.httpAuth}>
        <select
          className="http-panel-select"
          value={auth.type}
          onChange={(e) => onChange({ type: e.target.value as HttpAuthType })}
        >
          {HTTP_AUTH_TYPES.map((type) => (
            <option key={type} value={type}>
              {HTTP_AUTH_LABELS[type]}
            </option>
          ))}
        </select>
      </Field>
      
      {/* Bearer Token */}
      {auth.type === 'bearer' && (
        <Field label="Bearer Token" required hint="or {{variable}}">
          <input
            type="password"
            className="http-panel-input"
            value={auth.bearer?.token || ''}
            onChange={(e) => onChange({ bearer: { token: e.target.value } })}
            placeholder="Enter token or {{TOKEN_VAR}}"
          />
        </Field>
      )}
      
      {/* Basic Auth */}
      {auth.type === 'basic' && (
        <>
          <Field label="Username" required>
            <input
              type="text"
              className="http-panel-input"
              value={auth.basic?.username || ''}
              onChange={(e) => onChange({ 
                basic: { ...auth.basic, username: e.target.value, password: auth.basic?.password || '' } 
              })}
              placeholder="Username"
            />
          </Field>
          <Field label="Password" required hint="or {{variable}}">
            <input
              type="password"
              className="http-panel-input"
              value={auth.basic?.password || ''}
              onChange={(e) => onChange({ 
                basic: { ...auth.basic, username: auth.basic?.username || '', password: e.target.value } 
              })}
              placeholder="Password or {{PASSWORD_VAR}}"
            />
          </Field>
        </>
      )}
      
      {/* API Key */}
      {auth.type === 'api_key' && (
        <>
          <Field label="Header Name" required hint="e.g., X-API-Key">
            <input
              type="text"
              className="http-panel-input"
              value={auth.apiKey?.headerName || ''}
              onChange={(e) => onChange({ 
                apiKey: { ...auth.apiKey, headerName: e.target.value, value: auth.apiKey?.value || '' } 
              })}
              placeholder="X-API-Key"
            />
          </Field>
          <Field label="API Key Value" required hint="or {{variable}}">
            <input
              type="password"
              className="http-panel-input"
              value={auth.apiKey?.value || ''}
              onChange={(e) => onChange({ 
                apiKey: { ...auth.apiKey, headerName: auth.apiKey?.headerName || '', value: e.target.value } 
              })}
              placeholder="API key or {{API_KEY_VAR}}"
            />
          </Field>
        </>
      )}
    </CollapsibleSection>
  );
}

// ============================================
// Headers Section Component
// ============================================

interface HeadersSectionProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

/**
 * Headers key-value editor section.
 * @see Requirement 3.3
 */
function HeadersSection({ headers, onChange }: HeadersSectionProps) {
  const entries = Object.entries(headers);
  
  const handleAdd = () => {
    onChange({ ...headers, '': '' });
  };
  
  const handleRemove = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    onChange(newHeaders);
  };
  
  const handleKeyChange = (oldKey: string, newKey: string) => {
    const newHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (k === oldKey) {
        newHeaders[newKey] = v;
      } else {
        newHeaders[k] = v;
      }
    }
    onChange(newHeaders);
  };
  
  const handleValueChange = (key: string, newVal: string) => {
    onChange({ ...headers, [key]: newVal });
  };
  
  return (
    <CollapsibleSection title="Headers" defaultOpen={entries.length > 0}>
      <div className="http-panel-kv-editor">
        {entries.map(([k, v], idx) => (
          <div key={idx} className="http-panel-kv-row">
            <input
              type="text"
              className="http-panel-kv-key"
              value={k}
              onChange={(e) => handleKeyChange(k, e.target.value)}
              placeholder="Header name"
            />
            <span className="http-panel-kv-separator">:</span>
            <input
              type="text"
              className="http-panel-kv-value"
              value={v}
              onChange={(e) => handleValueChange(k, e.target.value)}
              placeholder="Header value"
            />
            <button
              type="button"
              className="http-panel-kv-remove"
              onClick={() => handleRemove(k)}
              title="Remove header"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="http-panel-kv-add"
          onClick={handleAdd}
        >
          + Add Header
        </button>
      </div>
      
      {/* Common headers quick-add */}
      <div className="http-panel-quick-headers">
        <span className="http-panel-quick-label">Quick add:</span>
        <button 
          type="button" 
          onClick={() => onChange({ ...headers, 'Content-Type': 'application/json' })}
          disabled={'Content-Type' in headers}
        >
          Content-Type
        </button>
        <button 
          type="button" 
          onClick={() => onChange({ ...headers, 'Accept': 'application/json' })}
          disabled={'Accept' in headers}
        >
          Accept
        </button>
        <button 
          type="button" 
          onClick={() => onChange({ ...headers, 'User-Agent': 'ADK-Studio/1.0' })}
          disabled={'User-Agent' in headers}
        >
          User-Agent
        </button>
      </div>
    </CollapsibleSection>
  );
}

export default HttpPanel;


// ============================================
// Body Section Component
// ============================================

interface BodySectionProps {
  body: HttpBody;
  method: HttpMethod;
  onChange: (updates: Partial<HttpBody>) => void;
}

/**
 * Request body configuration section.
 * @see Requirement 3.3
 */
function BodySection({ body, method, onChange }: BodySectionProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // GET and DELETE typically don't have bodies
  const showBodyWarning = (method === 'GET' || method === 'DELETE') && body.type !== 'none';
  
  const handleContentChange = (content: string) => {
    if (body.type === 'json') {
      try {
        // Validate JSON
        if (content.trim()) {
          JSON.parse(content);
        }
        setJsonError(null);
      } catch (e) {
        setJsonError('Invalid JSON syntax');
      }
    }
    onChange({ content });
  };
  
  return (
    <CollapsibleSection title="Body" defaultOpen={body.type !== 'none'}>
      <Field label="Body Type">
        <div className="http-body-type-selector">
          {HTTP_BODY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`http-body-type-option ${body.type === type ? 'selected' : ''}`}
              onClick={() => onChange({ type, content: type === 'none' ? undefined : body.content })}
            >
              {HTTP_BODY_LABELS[type]}
            </button>
          ))}
        </div>
      </Field>
      
      {showBodyWarning && (
        <div className="http-panel-warning">
          ⚠️ {method} requests typically don't include a body
        </div>
      )}
      
      {body.type === 'json' && (
        <Field label="JSON Body" hint="supports {{variable}}">
          <textarea
            className={`http-panel-textarea http-panel-textarea-mono ${jsonError ? 'error' : ''}`}
            value={typeof body.content === 'string' ? body.content : JSON.stringify(body.content, null, 2)}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder='{"key": "value", "data": "{{variable}}"}'
            rows={6}
          />
          {jsonError && <span className="http-panel-error">{jsonError}</span>}
        </Field>
      )}
      
      {body.type === 'form' && (
        <Field label="Form Data" hint="key=value pairs">
          <textarea
            className="http-panel-textarea"
            value={typeof body.content === 'string' ? body.content : ''}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="field1=value1&#10;field2={{variable}}"
            rows={4}
          />
        </Field>
      )}
      
      {body.type === 'raw' && (
        <Field label="Raw Body">
          <textarea
            className="http-panel-textarea"
            value={typeof body.content === 'string' ? body.content : ''}
            onChange={(e) => onChange({ content: e.target.value })}
            placeholder="Raw request body content"
            rows={4}
          />
        </Field>
      )}
    </CollapsibleSection>
  );
}

// ============================================
// Response Section Component
// ============================================

interface ResponseSectionProps {
  response: HttpResponse;
  onChange: (updates: Partial<HttpResponse>) => void;
}

/**
 * Response handling configuration section.
 * @see Requirement 3.4
 */
function ResponseSection({ response, onChange }: ResponseSectionProps) {
  return (
    <CollapsibleSection title="Response Handling" defaultOpen={false}>
      <Field label="Response Type">
        <select
          className="http-panel-select"
          value={response.type}
          onChange={(e) => onChange({ type: e.target.value as HttpResponseType })}
        >
          {HTTP_RESPONSE_TYPES.map((type) => (
            <option key={type} value={type}>
              {HTTP_RESPONSE_LABELS[type]}
            </option>
          ))}
        </select>
      </Field>
      
      <Field label="Status Validation" hint="e.g., 200-299, 200,201">
        <input
          type="text"
          className="http-panel-input"
          value={response.statusValidation || ''}
          onChange={(e) => onChange({ statusValidation: e.target.value || undefined })}
          placeholder="200-299"
        />
        <div className="http-panel-field-help">
          Leave empty to accept any status. Use ranges (200-299) or comma-separated values (200,201,204).
        </div>
      </Field>
      
      {response.type === 'json' && (
        <Field label="JSONPath Extraction" hint="extract specific field">
          <input
            type="text"
            className="http-panel-input http-panel-input-mono"
            value={response.jsonPath || ''}
            onChange={(e) => onChange({ jsonPath: e.target.value || undefined })}
            placeholder="$.data.items[0].id"
          />
          <div className="http-panel-field-help">
            Use JSONPath syntax to extract a specific value from the response. Leave empty to use full response.
          </div>
        </Field>
      )}
      
      {/* Response preview info */}
      <div className="http-panel-info">
        <span className="http-panel-info-icon">ℹ️</span>
        <span className="http-panel-info-text">
          The full response (status, headers, body) is available in the output. 
          Use JSONPath to extract specific values.
        </span>
      </div>
    </CollapsibleSection>
  );
}

// ============================================
// Rate Limit Section Component
// ============================================

interface RateLimitSectionProps {
  rateLimit?: RateLimit;
  onChange: (updates: Partial<RateLimit> | null) => void;
}

/**
 * Rate limiting configuration section.
 * @see Requirement 3.5
 */
function RateLimitSection({ rateLimit, onChange }: RateLimitSectionProps) {
  const [enabled, setEnabled] = useState(!!rateLimit);
  
  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled);
    if (newEnabled && !rateLimit) {
      onChange({ requestsPerWindow: 10, windowMs: 1000 });
    } else if (!newEnabled) {
      onChange(null);
    }
  };
  
  return (
    <CollapsibleSection title="Rate Limiting" defaultOpen={false}>
      <Field label="Enable Rate Limiting">
        <label className="http-panel-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <span className="http-panel-toggle-slider" />
          <span className="http-panel-toggle-label">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </Field>
      
      {enabled && rateLimit && (
        <>
          <Field label="Requests per Window" hint="max requests">
            <input
              type="number"
              className="http-panel-input"
              value={rateLimit.requestsPerWindow}
              onChange={(e) => onChange({ requestsPerWindow: parseInt(e.target.value, 10) || 1 })}
              min={1}
              max={1000}
            />
          </Field>
          
          <Field label="Window Duration" hint="milliseconds">
            <input
              type="number"
              className="http-panel-input"
              value={rateLimit.windowMs}
              onChange={(e) => onChange({ windowMs: parseInt(e.target.value, 10) || 1000 })}
              min={100}
              step={100}
            />
            <div className="http-panel-field-help">
              {rateLimit.requestsPerWindow} request{rateLimit.requestsPerWindow !== 1 ? 's' : ''} per {rateLimit.windowMs}ms 
              = {Math.round((rateLimit.requestsPerWindow / rateLimit.windowMs) * 1000 * 60)} requests/minute
            </div>
          </Field>
        </>
      )}
    </CollapsibleSection>
  );
}
