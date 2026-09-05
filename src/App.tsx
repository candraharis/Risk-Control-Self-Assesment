import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { RiskRegisterView } from './components/RiskRegisterView.tsx';
import { ControlsView } from './components/ControlsView.tsx';
import { ActionPlansView } from './components/ActionPlansView.tsx';
import { NotificationsView } from './components/NotificationsView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { SystemSettingsView } from './components/SystemSettingsView.tsx';
import { RiskWizardModal } from './components/RiskWizardModal.tsx';
import { RiskDetailModal } from './components/RiskDetailModal.tsx';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter state for matrix drill-down
  const [matrixFilter, setMatrixFilter] = useState<{
    type?: 'inherent' | 'residual';
    likelihood?: number | null;
    impact?: number | null;
  } | undefined>(undefined);

  // Key to force refresh after changes
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectRisk = (riskId: number) => {
    setSelectedRiskId(riskId);
    setIsDetailOpen(true);
  };

  const handleFilterByCell = (type: 'inherent' | 'residual', likelihood: number, impact: number) => {
    setMatrixFilter({ type, likelihood, impact });
    setActiveTab('risks');
  };

  const handleClearMatrixFilter = () => {
    setMatrixFilter(undefined);
  };

  const handleWizardSuccess = (risk: any) => {
    setRefreshKey(prev => prev + 1);
    setSelectedRiskId(risk.id);
    setIsDetailOpen(true);
  };

  const handleDetailRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Risk Portfolio';
      case 'risks':
        return 'Risk Register';
      case 'controls':
        return 'Control Library';
      case 'actions':
        return 'Action Plans Tracker';
      case 'notifications':
        return 'Alerts & Escalations';
      case 'audit':
        return 'Audit Trail';
      case 'system':
        return 'System & Scheduler';
      default:
        return 'RCSA Enterprise';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F2] text-[#1A1A1A] font-sans flex flex-col md:flex-row antialiased selection:bg-[#FF6321] selection:text-white">
      {/* Editorial Aside / Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewRiskModal={() => setIsWizardOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Editorial Top Sub-Header */}
        <header className="h-20 border-b border-[#D1D1CB] bg-white flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex gap-6 lg:gap-10 items-end">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif italic tracking-tighter leading-none text-[#1A1A1A]">
              {getPageTitle(activeTab)}
            </h1>
            <div className="hidden sm:flex gap-4 text-[11px] font-bold uppercase tracking-widest text-[#888883]">
              <span className="text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 cursor-pointer">Fiscal 2026</span>
              <span className="hover:text-[#1A1A1A] cursor-pointer pb-1 transition-colors">All Units</span>
              <span className="hover:text-[#1A1A1A] cursor-pointer pb-1 transition-colors">Enterprise ERM</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              id="btn-new-risk-header"
              onClick={() => setIsWizardOpen(true)}
              className="bg-[#FF6321] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#E5591D] transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              + New Risk
            </button>
          </div>
        </header>

        {/* View Content Area */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[#F4F4F2]">
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <DashboardView
                key={`dash-${refreshKey}`}
                onSelectRisk={handleSelectRisk}
                onFilterByCell={handleFilterByCell}
                onNavigateToRisks={() => {
                  setMatrixFilter(undefined);
                  setActiveTab('risks');
                }}
              />
            )}

            {activeTab === 'risks' && (
              <RiskRegisterView
                key={`risks-${refreshKey}`}
                onSelectRisk={handleSelectRisk}
                onOpenNewRiskModal={() => setIsWizardOpen(true)}
                initialFilters={matrixFilter}
                onClearMatrixFilter={handleClearMatrixFilter}
              />
            )}

            {activeTab === 'controls' && <ControlsView key={`ctrl-${refreshKey}`} />}

            {activeTab === 'actions' && (
              <ActionPlansView key={`act-${refreshKey}`} onSelectRisk={handleSelectRisk} />
            )}

            {activeTab === 'notifications' && <NotificationsView key={`notif-${refreshKey}`} />}

            {activeTab === 'audit' && <AuditTrailView key={`audit-${refreshKey}`} />}

            {activeTab === 'system' && <SystemSettingsView key={`sys-${refreshKey}`} />}
          </div>
        </main>

        {/* Editorial Footer */}
        <footer className="h-12 bg-white border-t border-[#D1D1CB] px-6 lg:px-10 flex items-center justify-between text-[10px] text-[#888883] font-mono tracking-tighter shrink-0">
          <div className="flex gap-4 sm:gap-6">
            <span>NODE_STATUS: ONLINE</span>
            <span className="hidden sm:inline">AUTH_LEVEL: ENTERPRISE_RBAC</span>
            <span>DB_LATENCY: 12ms</span>
          </div>
          <div className="uppercase">RCSA ENTERPRISE 2026 • OJK / BASEL II COMPLIANT</div>
        </footer>
      </div>

      {/* Modals */}
      <RiskWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />

      <RiskDetailModal
        riskId={selectedRiskId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRiskId(null);
        }}
        onRefresh={handleDetailRefresh}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
