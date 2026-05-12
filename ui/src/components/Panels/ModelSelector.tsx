import React from 'react';
import {
  PROVIDERS,
  detectProviderFromModel,
  getCapabilityIcon,
  formatContextWindow,
  type ProviderInfo,
  type ModelInfo,
} from '../../data/models';

interface Props {
  value: string;
  onChange: (model: string) => void;
  compact?: boolean;
  // Model-specific config
  extendedThinking?: boolean;
  onExtendedThinkingChange?: (value: boolean) => void;
  thinkingBudgetTokens?: number;
  onThinkingBudgetChange?: (value: number | undefined) => void;
  promptCaching?: boolean;
  onPromptCachingChange?: (value: boolean) => void;
  reasoningEffort?: 'low' | 'medium' | 'high';
  onReasoningEffortChange?: (value: 'low' | 'medium' | 'high' | undefined) => void;
}

/** Check if the selected model belongs to Anthropic provider */
function isAnthropicModel(model: string): boolean {
  if (!model) return false;
  return detectProviderFromModel(model) === 'anthropic';
}

/** Check if the selected model is an OpenAI o-series reasoning model */
function isOSeriesModel(model: string): boolean {
  if (!model) return false;
  const lower = model.toLowerCase();
  return (lower.startsWith('o1') || lower.startsWith('o3') || lower.startsWith('o4')) &&
    detectProviderFromModel(model) === 'openai';
}

export function ModelSelector({ 
  value, 
  onChange, 
  compact = false,
  extendedThinking,
  onExtendedThinkingChange,
  thinkingBudgetTokens,
  onThinkingBudgetChange,
  promptCaching,
  onPromptCachingChange,
  reasoningEffort,
  onReasoningEffortChange,
}: Props) {
  const [selectedProvider, setSelectedProvider] = React.useState<string>(() => 
    detectProviderFromModel(value)
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [customModelId, setCustomModelId] = React.useState<string>(value || '');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const provider = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];
  const currentModel = provider.models.find(m => m.id === value);
  const isOpenRouter = selectedProvider === 'openrouter';

  // Determine if model-specific controls should be visible
  const showAnthropicControls = isAnthropicModel(value) && onExtendedThinkingChange !== undefined;
  const showOSeriesControls = isOSeriesModel(value) && onReasoningEffortChange !== undefined;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter models based on search
  const filteredModels = provider.models.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const newProvider = PROVIDERS.find(p => p.id === providerId);
    if (providerId === 'openrouter') {
      // For OpenRouter, keep the current value or clear it
      setCustomModelId(value || '');
    } else if (newProvider && newProvider.models.length > 0) {
      // Select first model of new provider
      onChange(newProvider.models[0].id);
    }
    // Note: We do NOT clear model-specific config values here.
    // The controls just become invisible when the provider changes,
    // but stored values persist in the schema.
  };

  const handleModelSelect = (model: ModelInfo) => {
    onChange(model.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomModelId(newValue);
    onChange(newValue);
  };

  if (compact) {
    return (
      <CompactSelector
        value={value}
        provider={provider}
        providers={PROVIDERS}
        onProviderChange={handleProviderChange}
        onModelChange={onChange}
        isOpenRouter={isOpenRouter}
        customModelId={customModelId}
        onCustomModelChange={(val) => { setCustomModelId(val); onChange(val); }}
      />
    );
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {/* Provider Dropdown */}
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Provider</label>
        <select
          className="w-full px-3 py-2 rounded text-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
        >
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selector */}
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Model</label>
        {isOpenRouter ? (
          /* OpenRouter: show text input for model ID */
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., anthropic/claude-sonnet-4-6"
                value={customModelId}
                onChange={handleCustomModelChange}
                className="flex-1 px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded text-sm whitespace-nowrap"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Browse models
              </a>
            </div>
            <div 
              className="text-xs p-2 rounded"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
            >
              Enter any model ID from OpenRouter (e.g., &quot;anthropic/claude-sonnet-4-6&quot;, &quot;google/gemini-2.5-pro&quot;)
            </div>
          </div>
        ) : (
          /* Standard provider: show model dropdown */
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-3 py-2 rounded text-sm text-left flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="truncate">{currentModel?.name || value || 'Select model...'}</span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div
                className="absolute z-50 w-full mt-1 rounded shadow-lg max-h-80 overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface-panel)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {/* Search */}
                <div className="p-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                    autoFocus
                  />
                </div>

                {/* Model List */}
                <div className="overflow-y-auto max-h-60">
                  {filteredModels.map(model => (
                    <ModelOption
                      key={model.id}
                      model={model}
                      isSelected={model.id === value}
                      onClick={() => handleModelSelect(model)}
                    />
                  ))}
                  {filteredModels.length === 0 && (
                    <div className="p-3 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No models found
                    </div>
                  )}
                </div>

                {/* Provider Info */}
                <div 
                  className="p-2 text-xs"
                  style={{ 
                    borderTop: '1px solid var(--border-default)',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <span>Requires: </span>
                  <code style={{ color: 'var(--accent-primary)' }}>{provider.envVar}</code>
                  {provider.envVarAlt && (
                    <span> or <code style={{ color: 'var(--accent-primary)' }}>{provider.envVarAlt}</code></span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model-Specific Configuration: Anthropic */}
      {showAnthropicControls && (
        <div 
          className="space-y-2 p-2 rounded"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Anthropic Options
          </div>

          {/* Extended Thinking Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Extended Thinking
            </label>
            <button
              onClick={() => onExtendedThinkingChange?.(!extendedThinking)}
              className="relative w-8 h-4 rounded-full transition-colors"
              style={{
                backgroundColor: extendedThinking ? 'var(--accent-primary)' : 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
                style={{
                  backgroundColor: extendedThinking ? 'white' : 'var(--text-muted)',
                  left: extendedThinking ? '16px' : '2px',
                }}
              />
            </button>
          </div>

          {/* Thinking Budget Slider (visible only when extended thinking is ON) */}
          {extendedThinking && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Thinking Budget
                </label>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {thinkingBudgetTokens ?? 4096} tokens
                </span>
              </div>
              <input
                type="range"
                min={1024}
                max={32768}
                step={1024}
                value={thinkingBudgetTokens ?? 4096}
                onChange={(e) => onThinkingBudgetChange?.(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>1024</span>
                <span>32768</span>
              </div>
            </div>
          )}

          {/* Prompt Caching Toggle */}
          {onPromptCachingChange && (
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Prompt Caching
              </label>
              <button
                onClick={() => onPromptCachingChange?.(!promptCaching)}
                className="relative w-8 h-4 rounded-full transition-colors"
                style={{
                  backgroundColor: promptCaching ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
                  style={{
                    backgroundColor: promptCaching ? 'white' : 'var(--text-muted)',
                    left: promptCaching ? '16px' : '2px',
                  }}
                />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Model-Specific Configuration: OpenAI o-series */}
      {showOSeriesControls && (
        <div 
          className="space-y-2 p-2 rounded"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
        >
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Reasoning Options
          </div>

          {/* Reasoning Effort Radio Group */}
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Reasoning Effort
            </label>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onReasoningEffortChange?.(level)}
                  className="flex-1 px-2 py-1 rounded text-xs capitalize transition-colors"
                  style={{
                    backgroundColor: reasoningEffort === level ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: reasoningEffort === level ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${reasoningEffort === level ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Model Info */}
      {currentModel && (
        <div 
          className="text-xs p-2 rounded"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          <div className="mb-1">{currentModel.description}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span title="Context window">📏 {formatContextWindow(currentModel.contextWindow)}</span>
            {currentModel.capabilities.map(cap => (
              <span key={cap} title={cap}>{getCapabilityIcon(cap)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelOption({ model, isSelected, onClick }: { model: ModelInfo; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 text-left hover:opacity-90 transition-colors"
      style={{
        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
        color: isSelected ? 'white' : 'var(--text-primary)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{model.name}</span>
        <span 
          className="text-xs px-1 rounded"
          style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}
        >
          {formatContextWindow(model.contextWindow)}
        </span>
      </div>
      <div className="text-xs mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
        {model.description}
      </div>
      <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
        <span>📏 {formatContextWindow(model.contextWindow)}</span>
        {model.capabilities.slice(0, 4).map(cap => (
          <span key={cap}>{getCapabilityIcon(cap)}</span>
        ))}
        {model.capabilities.length > 4 && <span>+{model.capabilities.length - 4}</span>}
      </div>
    </button>
  );
}

// Compact version for sub-agents
function CompactSelector({ 
  value, 
  provider, 
  providers, 
  onProviderChange, 
  onModelChange,
  isOpenRouter,
  customModelId,
  onCustomModelChange,
}: { 
  value: string; 
  provider: ProviderInfo; 
  providers: ProviderInfo[];
  onProviderChange: (id: string) => void;
  onModelChange: (model: string) => void;
  isOpenRouter: boolean;
  customModelId: string;
  onCustomModelChange: (val: string) => void;
}) {
  return (
    <div className="flex gap-1">
      <select
        className="px-1 py-1 rounded text-xs"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          width: '70px',
        }}
        value={provider.id}
        onChange={(e) => onProviderChange(e.target.value)}
      >
        {providers.map(p => (
          <option key={p.id} value={p.id}>{p.icon} {p.id}</option>
        ))}
      </select>
      {isOpenRouter ? (
        <input
          type="text"
          placeholder="e.g., anthropic/claude-sonnet-4-6"
          value={customModelId}
          onChange={(e) => onCustomModelChange(e.target.value)}
          className="flex-1 px-1 py-1 rounded text-xs"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        />
      ) : (
        <select
          className="flex-1 px-1 py-1 rounded text-xs"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          value={value}
          onChange={(e) => onModelChange(e.target.value)}
        >
          {provider.models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default ModelSelector;
