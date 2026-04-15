import { useState, useCallback, useEffect } from 'react';
import { useBOQAutoSync } from './lib/boqAutoSync';
import { ensureDemoProject } from './lib/demoProject';
import { ThemeProvider } from './lib/theme';
import { Layout } from './components/layout/Layout';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectHome } from './pages/ProjectHome';
import { VisualCalibrationTool } from './components/tools/visual-calibration/VisualCalibrationTool';
import { ThermalLoadTool } from './components/tools/thermal-load/ThermalLoadTool';
import { AirflowTool } from './components/tools/airflow/AirflowTool';
import { SpeakerCalibrationTool } from './components/tools/speaker-calibration/SpeakerCalibrationTool';
import { NetworkAuditTool } from './components/tools/network-audit/NetworkAuditTool';
import { SceneIntelligenceTool } from './components/tools/scene-intelligence/SceneIntelligenceTool';
import { FutureTool } from './components/tools/future/FutureTool';
import { TOOLS } from './lib/toolRegistry';
import { loadProjects } from './lib/projectStorage';
import { getToolsForProject, getSortedTools } from './lib/scopeToolMap';
import type { ToolId, BrahmastraProject, ToolMeta } from './types';

type AppView = 'projects' | 'project-tool';

function AppContent() {
  const [view, setView] = useState<AppView>('projects');
  const [projects, setProjects] = useState<BrahmastraProject[]>(() => {
    ensureDemoProject();
    return loadProjects();
  });
  const [activeProject, setActiveProject] = useState<BrahmastraProject | null>(null);
  const [activeToolId, setActiveToolId] = useState<ToolId>('home');

  const refreshProjects = useCallback(() => {
    setProjects(loadProjects());
  }, []);

  // Auto-sync: BOQ Builder is source of truth — new/updated projects appear automatically
  const { connected: syncConnected, lastSyncAt, refresh: syncRefresh } = useBOQAutoSync(refreshProjects);

  // Keep active project fresh when BOQ data updates in background
  useEffect(() => {
    if (activeProject) {
      const updated = projects.find((p) => p.id === activeProject.id);
      if (updated) setActiveProject(updated);
    }
  }, [projects]);

  function handleOpenProject(project: BrahmastraProject) {
    setActiveProject(project);
    setActiveToolId('home');
    setView('project-tool');
  }

  function handleBackToProjects() {
    setView('projects');
    setActiveProject(null);
    setActiveToolId('home');
  }

  const handlePrint = useCallback(() => { window.print(); }, []);
  const handleExport = useCallback(() => { window.print(); }, []);

  // ── Projects screen ─────────────────────────────────────────────
  if (view === 'projects') {
    return (
      <ProjectsPage
        projects={projects}
        onOpenProject={handleOpenProject}
        onProjectsChange={refreshProjects}
        syncConnected={syncConnected}
        syncLastAt={lastSyncAt}
        onSyncRefresh={syncRefresh}
      />
    );
  }

  if (!activeProject) return null;

  // ── Project tool screen ──────────────────────────────────────────
  const projectToolIds = getSortedTools(getToolsForProject(activeProject));
  const projectTools: ToolMeta[] = projectToolIds
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean) as ToolMeta[];

  const activeTool = projectTools.find((t) => t.id === activeToolId) ?? projectTools[0];

  function renderTool() {
    switch (activeToolId) {
      case 'home':
        return (
          <ProjectHome
            project={activeProject!}
            tools={projectTools}
            onToolSelect={setActiveToolId}
            onProjectUpdate={(updated) => {
              setActiveProject(updated);
              refreshProjects();
            }}
          />
        );
      case 'visual-calibration':
        return <VisualCalibrationTool />;
      case 'thermal-load':
        return <ThermalLoadTool />;
      case 'airflow':
        return <AirflowTool />;
      case 'speaker-calibration':
        return <SpeakerCalibrationTool />;
      case 'network-quality':
        return <NetworkAuditTool />;
      case 'scene-intelligence':
        return <SceneIntelligenceTool />;
      default:
        return <FutureTool tool={activeTool} />;
    }
  }

  return (
    <Layout
      activeToolId={activeToolId}
      onToolSelect={setActiveToolId}
      tools={projectTools}
      onPrint={handlePrint}
      onExport={handleExport}
      project={activeProject}
      onBack={handleBackToProjects}
    >
      {renderTool()}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
