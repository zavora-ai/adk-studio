import Editor from '@monaco-editor/react';
import type { FunctionToolConfig } from '../../types/project';
import { generateFunctionTemplate, extractUserCode } from '../../utils/functionTemplates';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  config: FunctionToolConfig;
  onUpdate: (config: FunctionToolConfig) => void;
  onClose: () => void;
}

export function CodeEditorModal({ config, onUpdate, onClose }: Props) {
  const { mode } = useTheme();
  const editorTheme = mode === 'light' ? 'light' : 'vs-dark';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="rounded-lg w-11/12 h-5/6 flex flex-col"
        style={{ backgroundColor: 'var(--surface-panel)' }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="flex justify-between items-center p-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
            {config.name || 'function'}_fn
          </h2>
          <button 
            onClick={onClose} 
            className="text-xl hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            defaultLanguage="rust"
            theme={editorTheme}
            value={generateFunctionTemplate(config)}
            onChange={(value) => value && onUpdate({ ...config, code: extractUserCode(value, config) })}
            options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4 }}
          />
        </div>
        <div 
          className="p-4 border-t flex justify-end"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded text-sm text-white"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
