import React, { useState, useMemo } from 'react';
import { ObservationTable } from '@/components/ObservationTable';
import { DataQualityPanel } from '@/components/DataQualityPanel';
import { IndexSummaryCard } from '@/components/IndexSummaryCard';
import { IndexTrendChart } from '@/components/IndexTrendChart';
import { SectorHeatmap } from '@/components/SectorHeatmap';
import { LeadTimeElasticityChart } from '@/components/LeadTimeElasticityChart';
import { MethodologyValidationPanel } from '@/components/MethodologyValidationPanel';
import { ApiContractDocs } from '@/components/ApiContractDocs';
import { ApiExplorerPanel } from '@/components/ApiExplorerPanel';
import { HealthCheckBanner } from '@/components/HealthCheckBanner';
import { LiveDataTicker } from '@/components/LiveDataTicker';
import { ScraperHealthPanel } from '@/components/ScraperHealthPanel';
import { LivePipelineVisualizer } from '@/components/LivePipelineVisualizer';
import { runPipelineHealthCheck } from '@/services/healthCheck';
import { triggerSnapshotDownload } from '@/services/snapshotExport';
import { Plane, Database, Download, Check, LayoutDashboard, Database as DbIcon, Code2, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'engine' | 'analytics' | 'integrity' | 'api';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('engine');
  const [tableFilter, setTableFilter] = useState<'all' | 'anomalies' | 'sold_out'>('all');
  const [exported, setExported] = useState(false);

  const healthResult = useMemo(() => runPipelineHealthCheck(), []);

  const handleToggleAnomalyFilter = () => {
    setTableFilter((prev) => (prev === 'anomalies' ? 'all' : 'anomalies'));
  };

  const handleExportSnapshot = () => {
    triggerSnapshotDownload();
    setExported(true);
    setTimeout(() => setExported(false), 2200);
  };

  const tabs = [
    { id: 'engine', label: 'Live Engine', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Trends', icon: LineChart },
    { id: 'integrity', label: 'Data Integrity', icon: DbIcon },
    { id: 'api', label: 'Developer API', icon: Code2 },
  ] as const;

  return (
    <div className="bg-[#09090B] text-zinc-300 font-sans min-h-screen flex flex-col select-none antialiased relative selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* PROFESSIONAL SOOTHING BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-slate-900/30 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* HEADER SECTION - SLEEK & MODERN */}
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl sticky top-0 z-50 shadow-md">
        <div className="p-5 sm:p-6 lg:px-10 flex flex-col md:flex-row justify-between md:items-end gap-6 max-w-[1600px] mx-auto w-full">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
              <span className="text-[11px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                AeroStat Phase 3 • Live Pro Dashboard
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl leading-[0.85] font-black tracking-tighter uppercase text-zinc-100 pb-1">
              AEROSTAT
            </h1>
            <p className="text-xs mt-3 tracking-[0.1em] text-zinc-500 font-medium">
              Information-Rich Observability & Analytical Terminal
            </p>
          </div>

          {/* COMPACT METRICS */}
          <div className="flex flex-wrap items-center gap-3 md:justify-end relative z-10">
            <div className="bg-zinc-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-right shadow-inner backdrop-blur-md transition-colors hover:bg-zinc-800/80">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                Active Routes
              </div>
              <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 justify-end">
                <Plane className="w-3.5 h-3.5 text-indigo-400" />
                DEL-BOM • DEL-BLR • BOM-BLR
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-right shadow-inner backdrop-blur-md transition-colors hover:bg-zinc-800/80">
              <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">
                Source Type
              </div>
              <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5 justify-end">
                <Database className="w-3.5 h-3.5 text-teal-500" />
                Live PostgreSQL Engine
              </div>
            </div>
          </div>
        </div>

        {/* TOP NAVIGATION TABS */}
        <div className="px-5 sm:px-6 lg:px-10 max-w-[1600px] mx-auto w-full flex gap-1 overflow-x-auto hide-scrollbar border-t border-white/5 pt-2 pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-all relative outline-none cursor-pointer ${
                  isActive ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 shadow-[0_-2px_8px_rgba(20,184,166,0.5)]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* LIVE DATA TICKER (ALWAYS VISIBLE) */}
      <div className="relative z-40 bg-zinc-950/80 border-b border-white/5 shadow-md">
        <div className="max-w-[1600px] mx-auto w-full">
          <LiveDataTicker />
        </div>
      </div>

      {/* RUNTIME PIPELINE HEALTH CHECK BANNER (ALWAYS VISIBLE) */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-10 mt-6 relative z-10">
        <HealthCheckBanner healthResult={healthResult} />
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px] w-full mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {activeTab === 'engine' && (
              <div className="flex flex-col gap-8">
                {/* Visualizer at the top */}
                <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden py-4">
                  <LivePipelineVisualizer />
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Summary Card restoring original rich info */}
                  <div className="xl:col-span-2 flex flex-col min-w-0">
                    <div className="flex-1 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-xl transition-all hover:border-white/10">
                      <IndexSummaryCard />
                    </div>
                  </div>
                  {/* Scraper Health bringing back the worker nodes */}
                  <div className="xl:col-span-1 flex flex-col min-w-0">
                     <ScraperHealthPanel />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="flex flex-col gap-6">
                {/* 30 Day Trend restoring original grid/stats */}
                <div className="w-full bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10">
                  <IndexTrendChart />
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="flex flex-col min-w-0 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10">
                    <SectorHeatmap />
                  </div>
                  <div className="flex flex-col min-w-0 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10">
                    <LeadTimeElasticityChart />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrity' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                  <div className="xl:col-span-1 sticky top-32">
                    <DataQualityPanel
                      onFilterAnomalies={handleToggleAnomalyFilter}
                      isFilterActive={tableFilter === 'anomalies'}
                    />
                  </div>
                  <div className="xl:col-span-2 bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden transition-all hover:border-white/10">
                    <ObservationTable
                      filterMode={tableFilter}
                      onFilterChange={setTableFilter}
                    />
                  </div>
                </div>
                
                <div className="w-full bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl transition-all hover:border-white/10 mt-6">
                  <MethodologyValidationPanel />
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden transition-all hover:border-white/10 sticky top-32">
                  <ApiExplorerPanel />
                </div>
                <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl overflow-hidden transition-all hover:border-white/10">
                  <ApiContractDocs />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* COMPACT FOOTER */}
      <footer className="border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 relative z-20 mt-auto">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></span>
          <span className="font-medium tracking-wide">AeroStat Information-Rich Engine</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleExportSnapshot}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-zinc-500 rounded-md font-semibold transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
            title="Download verified static snapshot of all data & calculation invariants as a safety net"
          >
            {exported ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400 font-bold">Snapshot Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Snapshot</span>
              </>
            )}
          </button>
          <span className="text-zinc-800 hidden sm:inline">|</span>
          <span className="text-zinc-500/80 font-medium tracking-wide">Client-Side React • TypeScript</span>
        </div>
      </footer>
    </div>
  );
}
