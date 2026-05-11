import { useEffect, useState } from 'react';

export type DeployTarget = 'local' | 'docker' | 'cloud';

export interface DeployStep {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
}

interface Props {
  projectName: string;
  deploying: boolean;
  success: boolean | null;
  steps: DeployStep[];
  errorMessage?: string;
  deploymentUrl?: string;
  manifestPath?: string;
  onDeploy: (target: DeployTarget, cloudUrl?: string) => void;
  onClose: () => void;
}

const TARGETS: { id: DeployTarget; icon: string; title: string; desc: string; detail: string }[] = [
  {
    id: 'local',
    icon: '💻',
    title: 'Local',
    desc: 'Run on this machine',
    detail: 'Starts the ADK platform locally, builds your agent, and deploys it as a managed process.',
  },
  {
    id: 'docker',
    icon: '🐳',
    title: 'Docker',
    desc: 'Container deployment',
    detail: 'Builds a Docker image with the platform + agent, runs via docker compose.',
  },
  {
    id: 'cloud',
    icon: '☁️',
    title: 'Cloud',
    desc: 'Remote platform',
    detail: 'Pushes to a remote ADK deployment platform with secrets, scaling, and rollback.',
  },
];

export function DeployModal({
  projectName,
  deploying,
  success,
  steps,
  errorMessage,
  deploymentUrl,
  manifestPath,
  onDeploy,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<'pick' | 'progress'>('pick');
  const [selectedTarget, setSelectedTarget] = useState<DeployTarget>('local');
  const [cloudUrl, setCloudUrl] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // Switch to progress phase when deploying starts
  useEffect(() => {
    if (deploying) setPhase('progress');
  }, [deploying]);

  useEffect(() => {
    if (!deploying) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [deploying]);

  useEffect(() => {
    if (deploying) setElapsed(0);
  }, [deploying]);

  const handleDeploy = () => {
    onDeploy(selectedTarget, selectedTarget === 'cloud' ? cloudUrl || undefined : undefined);
  };

  // Target picker phase
  if (phase === 'pick') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="rounded-lg w-[560px] flex flex-col"
          style={{ backgroundColor: 'var(--surface-panel)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex justify-between items-center p-4 border-b"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              🚀 Deploy: {projectName}
            </h2>
            <button onClick={onClose} className="text-xl hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              ×
            </button>
          </div>

          {/* Target Cards */}
          <div className="p-4 space-y-3">
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Choose deployment target
            </div>
            <div className="grid grid-cols-3 gap-3">
              {TARGETS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTarget(t.id)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: selectedTarget === t.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    border: `2px solid ${selectedTarget === t.id ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  }}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.desc}</div>
                </button>
              ))}
            </div>

            {/* Detail for selected target */}
            <div
              className="p-3 rounded text-xs"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              {TARGETS.find(t => t.id === selectedTarget)?.detail}
            </div>

            {/* Cloud URL input */}
            {selectedTarget === 'cloud' && (
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Platform URL
                </label>
                <input
                  type="text"
                  value={cloudUrl}
                  onChange={e => setCloudUrl(e.target.value)}
                  placeholder="http://your-platform:8090 (or leave empty for localhost)"
                  className="w-full px-3 py-2 rounded text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="p-4 border-t flex justify-between items-center"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              All targets deploy through the ADK platform
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                className="px-4 py-2 rounded text-sm font-medium"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                }}
              >
                Deploy →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Progress phase
  const statusIcon = deploying ? '🚀' : success ? '✓' : '✗';
  const statusText = deploying
    ? `Deploying (${TARGETS.find(t => t.id === selectedTarget)?.title})...`
    : success
    ? 'Deployment Successful'
    : 'Deployment Failed';
  const statusColor = deploying ? 'text-blue-500' : success ? 'text-green-500' : 'text-red-500';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-lg w-[500px] max-h-[80vh] flex flex-col"
        style={{ backgroundColor: 'var(--surface-panel)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-4 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <h2 className={`text-lg font-semibold ${statusColor}`}>
            {statusIcon} {statusText}
          </h2>
          <div className="flex items-center gap-3">
            {deploying && (
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {elapsed}s
              </span>
            )}
            <button onClick={onClose} className="text-xl hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
              ×
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.status === 'done' && <span className="text-green-500">✓</span>}
                {step.status === 'running' && <span className="text-blue-500 animate-pulse">●</span>}
                {step.status === 'pending' && <span style={{ color: 'var(--text-muted)' }}>○</span>}
                {step.status === 'error' && <span className="text-red-500">✗</span>}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm"
                  style={{ color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}
                >
                  {step.label}
                </div>
                {step.detail && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Error */}
          {errorMessage && (
            <div
              className="mt-4 p-3 rounded border text-xs"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-error)', color: 'var(--accent-error)' }}
            >
              {errorMessage}
            </div>
          )}

          {/* Platform not reachable hint */}
          {errorMessage && (errorMessage.includes('error sending request') || errorMessage.includes('connection refused') || errorMessage.includes('8090')) && (
            <div
              className="mt-3 p-3 rounded border text-xs space-y-2"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'var(--accent-primary)', color: 'var(--text-secondary)' }}
            >
              <div className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                💡 Platform not reachable
              </div>
              <p>Could not connect to the ADK deployment platform. To deploy from the command line:</p>
              <div className="p-2 rounded font-mono space-y-0.5" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <div>cargo install cargo-adk</div>
                <div>cargo adk deploy --environment {selectedTarget === 'local' ? 'local' : 'staging'}</div>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>
                ✓ Manifest and runtime code were generated successfully in the deploy directory.
              </p>
            </div>
          )}

          {/* Success */}
          {success && manifestPath && (
            <div
              className="mt-4 p-3 rounded border"
              style={{ backgroundColor: 'rgba(56, 161, 105, 0.1)', borderColor: 'var(--accent-success)' }}
            >
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Deployed to:</div>
              <code className="text-xs font-mono" style={{ color: 'var(--accent-success)' }}>{manifestPath}</code>
            </div>
          )}

          {success && deploymentUrl && (
            <div className="mt-3">
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
              >
                Open Deployment Console →
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-default)' }}>
          {!deploying && success === null ? null : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
            >
              {deploying ? 'Cancel' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
