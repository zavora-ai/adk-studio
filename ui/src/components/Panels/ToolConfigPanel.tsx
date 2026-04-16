import type { McpToolConfig, FunctionToolConfig, BrowserToolConfig, ToolConfig, FunctionParameter } from '../../types/project';
import { FUNCTION_TEMPLATES, MCP_TEMPLATES, generateFunctionTemplate } from '../../utils/functionTemplates';

interface Props {
  toolId: string;
  config: ToolConfig | null;
  onUpdate: (config: ToolConfig) => void;
  onClose: () => void;
  onOpenCodeEditor: () => void;
}

export function ToolConfigPanel({ toolId, config, onUpdate, onClose, onOpenCodeEditor }: Props) {
  const toolType = toolId.includes('_mcp') ? 'mcp' : toolId.includes('_function') ? 'function' : toolId.includes('_browser') ? 'browser' : toolId.includes('_exit_loop') ? 'exit_loop' : toolId.includes('_google_search') ? 'google_search' : '';

  const getDefault = (): ToolConfig | null => {
    if (toolType === 'mcp') return { type: 'mcp', server_command: '', server_args: [], tool_filter: [] };
    if (toolType === 'function') return { type: 'function', name: '', description: '', parameters: [] };
    if (toolType === 'browser') return { type: 'browser', headless: true, timeout_ms: 30000 };
    return null;
  };

  const current = config || getDefault();
  const isSimple = ['exit_loop', 'google_search', 'load_artifact'].includes(toolType);
  if (!current && !isSimple) return null;

  return (
    <div 
      className="w-80 border-l p-4 overflow-y-auto"
      style={{ backgroundColor: 'var(--surface-panel)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Configure Tool</h3>
        <button 
          onClick={onClose} 
          className="px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
        >
          Close
        </button>
      </div>

      {toolType === 'mcp' && <McpConfig config={current as McpToolConfig} onUpdate={onUpdate} />}
      {toolType === 'function' && <FunctionConfig config={current as FunctionToolConfig} onUpdate={onUpdate} onOpenCodeEditor={onOpenCodeEditor} />}
      {toolType === 'browser' && <BrowserConfig config={current as BrowserToolConfig} onUpdate={onUpdate} />}
      {isSimple && <SimpleToolInfo type={toolType} />}
    </div>
  );
}

function McpConfig({ config, onUpdate }: { config: McpToolConfig; onUpdate: (c: ToolConfig) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Quick Templates</label>
        <div className="grid grid-cols-2 gap-1 mb-3">
          {MCP_TEMPLATES.map(t => (
            <button 
              key={t.name} 
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              title={t.desc} 
              onClick={() => onUpdate({ ...config, name: t.name, server_command: t.command, server_args: t.args })}
            >
              <span>{t.icon}</span><span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Server Command</label>
        <input 
          className="w-full px-2 py-1 border rounded text-sm" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          placeholder="npx, uvx..." 
          value={config.server_command} 
          onChange={e => onUpdate({ ...config, server_command: e.target.value })} 
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Server Args (one per line)</label>
        <textarea 
          className="w-full px-2 py-1 border rounded text-sm h-20" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          value={config.server_args.join('\n')} 
          onChange={e => onUpdate({ ...config, server_args: e.target.value.split('\n').filter(Boolean) })} 
        />
      </div>
    </div>
  );
}

function FunctionConfig({ config, onUpdate, onOpenCodeEditor }: { config: FunctionToolConfig; onUpdate: (c: ToolConfig) => void; onOpenCodeEditor: () => void }) {
  const addParam = () => onUpdate({ ...config, parameters: [...config.parameters, { name: '', param_type: 'string', description: '', required: false }] });
  const updateParam = (idx: number, updates: Partial<FunctionParameter>) => {
    const params = [...config.parameters];
    params[idx] = { ...params[idx], ...updates };
    onUpdate({ ...config, parameters: params });
  };
  const removeParam = (idx: number) => onUpdate({ ...config, parameters: config.parameters.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Function Name</label>
        <input 
          className="w-full px-2 py-1 border rounded text-sm" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          placeholder="get_weather" 
          value={config.name} 
          onChange={e => onUpdate({ ...config, name: e.target.value })} 
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
        <textarea 
          className="w-full px-2 py-1 border rounded text-sm h-16" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          value={config.description} 
          onChange={e => onUpdate({ ...config, description: e.target.value })} 
        />
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Parameters</label>
        {config.parameters.map((p, idx) => (
          <div key={idx} className="flex gap-1 mb-1 items-center">
            <input 
              className="flex-1 px-1 py-0.5 border rounded text-xs" 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              placeholder="name" 
              value={p.name} 
              onChange={e => updateParam(idx, { name: e.target.value })} 
            />
            <select 
              className="px-1 py-0.5 border rounded text-xs" 
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              value={p.param_type} 
              onChange={e => updateParam(idx, { param_type: e.target.value as 'string' | 'number' | 'boolean' })}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
            <label className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={p.required} onChange={e => updateParam(idx, { required: e.target.checked })} />req
            </label>
            <button style={{ color: 'var(--accent-error)' }} className="text-xs" onClick={() => removeParam(idx)}>×</button>
          </div>
        ))}
        <button 
          className="w-full py-1 rounded text-xs mt-1" 
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          onClick={addParam}
        >
          + Add Parameter
        </button>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>Code (Rust)</label>
          <button className="text-xs" style={{ color: 'var(--accent-primary)' }} onClick={onOpenCodeEditor}>✏️ Edit</button>
        </div>
        <textarea 
          className="w-full px-2 py-2 border rounded text-xs font-mono h-32 cursor-pointer" 
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
          value={generateFunctionTemplate(config)} 
          readOnly 
          onClick={onOpenCodeEditor} 
        />
      </div>
      <div>
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Templates</label>
        <div className="grid grid-cols-2 gap-1">
          {FUNCTION_TEMPLATES.map(t => (
            <button 
              key={t.name} 
              className="px-2 py-1 rounded text-xs flex items-center gap-1" 
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              onClick={() => onUpdate({ ...config, ...t.template })}
            >
              <span>{t.icon}</span><span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowserConfig({ config, onUpdate }: { config: BrowserToolConfig; onUpdate: (c: ToolConfig) => void }) {
  return (
    <div className="space-y-3">
      <div 
        className="p-2 rounded text-xs"
        style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid var(--accent-warning)', color: 'var(--text-primary)' }}
      >
        <div className="font-semibold mb-1" style={{ color: 'var(--accent-warning)' }}>⚠️ Requirements</div>
        <p style={{ color: 'var(--text-secondary)' }}>Chrome + ChromeDriver required</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="headless" checked={config.headless} onChange={e => onUpdate({ ...config, headless: e.target.checked })} />
        <label htmlFor="headless" className="text-sm" style={{ color: 'var(--text-primary)' }}>Headless Mode</label>
      </div>
      <div>
        <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Timeout (ms)</label>
        <input 
          type="number" 
          className="w-full px-2 py-1 border rounded text-sm" 
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          value={config.timeout_ms} 
          onChange={e => onUpdate({ ...config, timeout_ms: parseInt(e.target.value) || 30000 })} 
        />
      </div>
    </div>
  );
}

function SimpleToolInfo({ type }: { type: string }) {
  const info: Record<string, { title: string; desc: string }> = {
    exit_loop: { title: 'Exit Loop Tool', desc: 'Allows agent to exit a loop when task is complete.' },
    google_search: { title: 'Google Search Tool', desc: 'Web search via Google Grounding API.' },
    load_artifact: { title: 'Load Artifact Tool', desc: 'Load artifacts from session store.' },
  };
  const { title, desc } = info[type] || { title: 'Tool', desc: 'No configuration needed.' };
  return (
    <div 
      className="p-2 rounded text-xs"
      style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid var(--node-agent)', color: 'var(--text-primary)' }}
    >
      <div className="font-semibold mb-1" style={{ color: 'var(--node-agent)' }}>ℹ️ {title}</div>
      <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  );
}
