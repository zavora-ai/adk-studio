import { useState } from 'react';

interface Props {
    onConfirm: (name: string) => void;
    onClose: () => void;
}

export function NewProjectModal({ onConfirm, onClose }: Props) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div 
                className="rounded-lg w-96 flex flex-col shadow-xl"
                style={{ 
                    backgroundColor: 'var(--surface-panel)',
                    border: '1px solid var(--border-default)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div 
                    className="flex justify-between items-center p-4 border-b"
                    style={{ borderColor: 'var(--border-default)' }}
                >
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>New Project</h2>
                    <button 
                        onClick={onClose} 
                        className="text-xl hover:opacity-70"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label 
                            className="block text-sm mb-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Project Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 rounded text-sm focus:outline-none"
                            style={{ 
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}
                            placeholder="My Awesome Agent"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-3 py-2 rounded text-sm hover:opacity-80"
                            style={{ 
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)'
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={!name.trim()} 
                            className="px-3 py-2 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                            style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
