import Editor from '@monaco-editor/react';
import type { GeneratedProject } from '../../api/client';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  code: GeneratedProject;
  onClose: () => void;
}

export function CodeModal({ code, onClose }: Props) {
  const { mode } = useTheme();
  const editorTheme = mode === 'light' ? 'light' : 'vs-dark';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="rounded-lg w-4/5 h-4/5 flex flex-col"
        style={{ backgroundColor: 'var(--surface-panel)' }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="flex justify-between items-center p-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Generated Rust Code</h2>
          <button 
            onClick={onClose} 
            className="text-xl hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {code.files.map(file => (
            <div key={file.path} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-mono" style={{ color: 'var(--accent-primary)' }}>{file.path}</h3>
                <button 
                  onClick={() => navigator.clipboard.writeText(file.content)} 
                  className="text-xs px-2 py-1 rounded hover:opacity-80"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)'
                  }}
                >
                  Copy
                </button>
              </div>
              <div 
                className="rounded overflow-hidden"
                style={{ border: '1px solid var(--border-default)' }}
              >
                <Editor
                  height={Math.min(600, file.content.split('\n').length * 19 + 20)}
                  language={file.path.endsWith('.toml') ? 'toml' : 'rust'}
                  value={file.content}
                  theme={editorTheme}
                  options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 12 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
