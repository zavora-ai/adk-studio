import { useCallback, useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useStore } from './store';
import { ProjectList } from './components/Projects/ProjectList';
import { Canvas } from './components/Canvas/Canvas';
import { ThemeProvider, ThemeToggle } from './components/Theme';
import { WalkthroughModal, SettingsModal, TemplateWalkthroughModal, DeployModal } from './components/Overlays';
import type { DeployStep, DeployTarget } from './components/Overlays';
import { useWalkthrough } from './hooks/useWalkthrough';
import { useTheme } from './hooks/useTheme';
import { useVSCodeThemeSync } from './hooks/useVSCodeThemeSync';
import { useVSCodeProjectSync } from './hooks/useVSCodeProjectSync';
import { ADK_VERSION } from './version';
import { loadGlobalSettings } from './types/settings';
import { api } from './api/client';
import type { ProjectSettings } from './types/project';

// Component to apply theme from global settings
function ThemeInitializer() {
  const { setMode } = useTheme();
  
  useEffect(() => {
    const globalSettings = loadGlobalSettings();
    if (globalSettings.theme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    } else {
      setMode(globalSettings.theme);
    }
  }, [setMode]);
  
  return null;
}

export default function App() {
  const { currentProject, fetchProjects, openProject } = useStore();
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean | null>(null);
  const [deploySteps, setDeploySteps] = useState<DeployStep[]>([]);
  const [deployError, setDeployError] = useState<string | undefined>();
  const [deployUrl, setDeployUrl] = useState<string | undefined>();
  const [deployManifestPath, setDeployManifestPath] = useState<string | undefined>();

  // Listen for live VS Code theme changes via postMessage
  useVSCodeThemeSync();
  // Listen for VS Code project open/close commands via postMessage
  useVSCodeProjectSync();
  const { 
    isVisible: showWalkthrough, 
    complete: completeWalkthrough, 
    skip: skipWalkthrough, 
    hide: hideWalkthrough,
    shouldShowOnFirstRun,
    show: openWalkthrough,
  } = useWalkthrough();

  useEffect(() => {
    fetchProjects().then(() => {
      const params = new URLSearchParams(window.location.search);
      const projectParam = params.get('project');
      if (projectParam) {
        openProject(projectParam).catch((err) => {
          console.warn('[ADK Studio] Failed to open project from URL param: %s', projectParam, err);
        });
      }
    });
  }, [fetchProjects, openProject]);

  // Show walkthrough on first run
  useEffect(() => {
    if (shouldShowOnFirstRun()) {
      openWalkthrough();
    }
  }, [shouldShowOnFirstRun, openWalkthrough]);

  const handleDeploy = useCallback(async (target: DeployTarget, cloudUrl?: string) => {
    if (!currentProject || deploying) return;
    setDeploying(true);
    setDeploySuccess(null);
    setDeployError(undefined);
    setDeployUrl(undefined);
    setDeployManifestPath(undefined);

    const targetSteps: Record<DeployTarget, DeployStep[]> = {
      local: [
        { label: 'Generating deployment manifest & code', status: 'running' },
        { label: 'Building agent binary (cargo build --release)', status: 'pending' },
        { label: 'Starting local ADK platform', status: 'pending' },
        { label: 'Pushing deployment to platform', status: 'pending' },
      ],
      docker: [
        { label: 'Generating deployment manifest & code', status: 'running' },
        { label: 'Generating Dockerfile & docker-compose.yml', status: 'pending' },
        { label: 'Building Docker image', status: 'pending' },
        { label: 'Starting containers', status: 'pending' },
      ],
      cloud: [
        { label: 'Generating deployment manifest & code', status: 'running' },
        { label: 'Authenticating with platform', status: 'pending' },
        { label: 'Uploading secrets', status: 'pending' },
        { label: 'Pushing deployment bundle', status: 'pending' },
      ],
    };

    const steps = targetSteps[target];
    setDeploySteps([...steps]);

    try {
      // All targets start with manifest + codegen (step 0)
      const result = await api.projects.deploy(currentProject.id, {
        register: false,
        openSpatialOs: false,
        pushToDeploymentPlatform: target !== 'docker', // docker doesn't push to platform
        openDeploymentConsole: target === 'cloud',
        deploymentEnvironment: target === 'local' ? 'local' : target === 'docker' ? 'docker' : 'staging',
        controlPlaneUrl: cloudUrl || undefined,
        deployTarget: target,
      });

      // Mark all steps done on success
      steps.forEach(s => { s.status = 'done'; });
      setDeploySteps([...steps]);

      setDeploySuccess(true);
      setDeployManifestPath(result.deploymentManifestPath ?? result.manifestPath);

      if (result.openUrl) {
        setDeployUrl(result.openUrl);
      }
      if (result.deployment) {
        steps[steps.length - 1].detail = `${result.deployment.agentName} v${result.deployment.version} → ${result.deployment.environment}`;
        setDeploySteps([...steps]);
      } else {
        // For local/docker where platform push may be skipped
        steps[steps.length - 1].detail = target === 'docker'
          ? 'Image built. Run: docker compose up'
          : target === 'local'
          ? 'Agent deployed to local platform'
          : 'Manifest generated';
        setDeploySteps([...steps]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setDeployError(message);
      setDeploySuccess(false);
      // Mark the first pending/running step as error
      const runningIdx = steps.findIndex(s => s.status === 'running' || s.status === 'pending');
      if (runningIdx >= 0) {
        // Mark preceding pending steps as done (they completed server-side)
        for (let i = 0; i < runningIdx; i++) {
          if (steps[i].status === 'running') steps[i].status = 'done';
        }
        steps[runningIdx].status = 'error';
        steps[runningIdx].detail = message;
        setDeploySteps([...steps]);
      } else {
        // All were running/pending, mark first as error
        steps[0].status = 'error';
        steps[0].detail = message;
        setDeploySteps([...steps]);
      }
    } finally {
      setDeploying(false);
    }
  }, [currentProject, deploying]);

  const handleOpenDeployModal = useCallback(() => {
    if (!currentProject) return;
    setShowDeployModal(true);
  }, [currentProject]);

  return (
    <ThemeProvider>
      <ThemeInitializer />
      <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <header 
          className="h-12 border-b flex items-center justify-between px-4"
          style={{ 
            backgroundColor: 'var(--surface-panel)', 
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)'
          }}
        >
          <div className="flex items-center">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <img src="https://adk-rust.com/icon.svg" alt="ADK" className="w-7 h-7" /> ADK Studio
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>v{ADK_VERSION}</span>
            </h1>
            {currentProject && (
              <span className="ml-4" style={{ color: 'var(--text-secondary)' }}>/ {currentProject.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDeployModal}
              disabled={!currentProject || deploying}
              className="px-3 py-1.5 rounded text-xs font-semibold border transition-opacity disabled:opacity-50"
              style={{
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                backgroundColor: 'transparent',
              }}
              title="Create deploy manifest and register with ADK Spatial OS"
            >
              {deploying ? 'Deploying...' : 'Deploy'}
            </button>
            <button
              onClick={() => setShowGlobalSettings(true)}
              className="p-1.5 rounded hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
              title={currentProject ? 'Project Settings' : 'Settings'}
            >
              ⚙️
            </button>
            <ThemeToggle size={20} />
          </div>
        </header>
        <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>
          {currentProject ? (
            <ReactFlowProvider>
              <Canvas />
            </ReactFlowProvider>
          ) : (
            <ProjectList />
          )}
        </main>
        
        {/* Walkthrough Modal - shows on first run or when triggered from Help menu */}
        {showWalkthrough && (
          <WalkthroughModal
            onComplete={completeWalkthrough}
            onSkip={skipWalkthrough}
            onClose={hideWalkthrough}
          />
        )}
        
        {/* Settings Modal */}
        {showGlobalSettings && (
          <SettingsModal
            settings={currentProject?.settings}
            projectName={currentProject?.name}
            projectDescription={currentProject?.description}
            projectId={currentProject?.id}
            onSave={currentProject ? (settings: ProjectSettings, name: string, description: string) => {
              const { updateProjectSettings, updateProjectMeta } = useStore.getState();
              updateProjectMeta(name, description);
              updateProjectSettings(settings);
            } : undefined}
            onClose={() => setShowGlobalSettings(false)}
          />
        )}

        {/* Deploy Modal */}
        {showDeployModal && (
          <DeployModal
            projectName={currentProject?.name ?? 'Project'}
            deploying={deploying}
            success={deploySuccess}
            steps={deploySteps}
            errorMessage={deployError}
            deploymentUrl={deployUrl}
            manifestPath={deployManifestPath}
            onDeploy={handleDeploy}
            onClose={() => setShowDeployModal(false)}
          />
        )}
        
        {/* Template Walkthrough Modal - shows after loading a template */}
        <TemplateWalkthroughModal 
          onAction={(actionType, templateId) => {
            // Handle walkthrough actions
            if (actionType === 'open-env') {
              setShowGlobalSettings(true);
            } else if (actionType === 'open-docs') {
              // Open template documentation
              window.open(`https://github.com/zavora-ai/adk-rust/blob/main/adk-studio/ui/src/components/Templates/docs/${templateId}.md`, '_blank');
            }
            // run-workflow and highlight-node can be handled by the Canvas component
          }}
        />
      </div>
    </ThemeProvider>
  );
}
