import { useState, useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { VisualCalibrationTool } from './components/tools/visual-calibration/VisualCalibrationTool';
import { ThermalLoadTool } from './components/tools/thermal-load/ThermalLoadTool';
import { AirflowTool } from './components/tools/airflow/AirflowTool';
import { SpeakerCalibrationTool } from './components/tools/speaker-calibration/SpeakerCalibrationTool';
import { NetworkAuditTool } from './components/tools/network-audit/NetworkAuditTool';
import { FutureTool } from './components/tools/future/FutureTool';
import { TOOLS } from './lib/toolRegistry';
import type { ToolId } from './types';

function App() {
  const [activeToolId, setActiveToolId] = useState<ToolId>('home');

  const activeTool = TOOLS.find((t) => t.id === activeToolId)!;

  const handlePrint = useCallback(() => { window.print(); }, []);
  const handleExport = useCallback(() => { window.print(); }, []);

  function renderTool() {
    switch (activeToolId) {
      case 'home':
        return <Home tools={TOOLS.filter((t) => t.id !== 'home')} onToolSelect={setActiveToolId} />;
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
      default:
        return <FutureTool tool={activeTool} />;
    }
  }

  return (
    <Layout
      activeToolId={activeToolId}
      onToolSelect={setActiveToolId}
      tools={TOOLS}
      onPrint={handlePrint}
      onExport={handleExport}
    >
      {renderTool()}
    </Layout>
  );
}

export default App;
