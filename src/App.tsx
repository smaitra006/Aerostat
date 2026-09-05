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
import { runPipelineHealthCheck } from '@/services/healthCheck';
import { triggerSnapshotDownload } from '@/services/snapshotExport';
import { Plane, Database, Download, Check } from 'lucide-react';

export default function App() {
  const [tableFilter, setTableFilter] = useState<'all' | 'anomalies' | 'sold_out'>('all');
  const [exported, setExported] = useState(false);

  // Re-verifies all critical pipeline invariants at runtime on mount
  const healthResult = useMemo(() => runPipelineHealthCheck(), []);

  const handleToggleAnomalyFilter = () => {
    setTableFilter((prev) => (prev === 'anomalies' ? 'all' : 'anomalies'));
  };

  const handleExportSnapshot = () => {
    triggerSnapshotDownload();
    setExported(true);
    setTimeout(() => setExported(false), 2200);
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 font-sans min-h-screen flex flex-col select-none antialiased relative selection:bg-indigo-500/30">
      
      {/* SUBTLE BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* HEADER SECTION - PREMIUM MODERN DESIGN */}
      <header className="border-b border-white/5 p-5 sm:p-6 lg:px-10 flex flex-col md:flex-row justify-between md:items-end gap-6 bg-zinc-900/40 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <span className="text-[11px] font-bold tracking-[0.2em] text-indigo-400 uppercase">
              Airfare Price Index Prototype • Phase 3 APIx Engine
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-[80px] leading-[0.85] font-black tracking-tighter uppercase bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent pb-2">
            AEROSTAT
          </h1>
          <p className="text-xs mt-3 tracking-[0.15em] uppercase text-zinc-400 font-medium">
            Chain-Linked Passenger-Weighted Geometric Mean Index • Anomaly Detection • DQS
          </p>
        </div>

        {/* METRICS / STATS CARDS */}
        <div className="flex flex-wrap items-center gap-3 md:justify-end relative z-10">
          <div className="bg-zinc-800/40 border border-white/5 rounded-xl px-4 py-2 text-right shadow-inner backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">
              Active Routes
            </div>
            <div className="text-sm font-bold text-zinc-200 flex items-center gap-1.5 justify-end">
              <Plane className="w-4 h-4 text-sky-400" />
              DEL-BOM • DEL-BLR • BOM-BLR
            </div>
          </div>

          <div className="bg-zinc-800/40 border border-white/5 rounded-xl px-4 py-2 text-right shadow-inner backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">
              Source Type
            </div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
              <Database className="w-4 h-4 text-emerald-400" />
              Live PostgreSQL Backend
            </div>
          </div>
        </div>
      </header>

      {/* LIVE DATA TICKER */}
      <div className="relative z-40">
        <LiveDataTicker />
      </div>

      {/* 0. RUNTIME PIPELINE HEALTH CHECK BANNER */}
      <HealthCheckBanner healthResult={healthResult} />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-6 relative z-10">
        {/* SCRAPER HEALTH MONITOR */}
        <ScraperHealthPanel />

        {/* AIRFARE PRICE INDEX (APIx) SUMMARY CARD */}
        <IndexSummaryCard />

        {/* DATA QUALITY PANEL (SCORE & BREAKDOWN) */}
        <DataQualityPanel
          onFilterAnomalies={handleToggleAnomalyFilter}
          isFilterActive={tableFilter === 'anomalies'}
        />

        {/* OBSERVATION TABLE */}
        <ObservationTable
          filterMode={tableFilter}
          onFilterChange={setTableFilter}
        />

        {/* 1. INDEX TREND CHART */}
        <IndexTrendChart />

        {/* 2. SECTOR HEATMAP */}
        <SectorHeatmap />

        {/* 3. LEAD-TIME ELASTICITY CURVE */}
        <LeadTimeElasticityChart />

        {/* 4. METHODOLOGY VALIDATION PANEL */}
        <MethodologyValidationPanel />

        {/* 5. API ACCESS & CONTRACT SPECIFICATION */}
        <ApiContractDocs />

        {/* 6. LOCAL API EXPLORER */}
        <ApiExplorerPanel />
      </main>

      {/* COMPACT FOOTER */}
      <footer className="border-t border-white/5 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 relative z-20">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          <span className="font-medium">AeroStat Airfare Prototype — Phase 3: Chain-Linked Passenger-Weighted Geometric Mean Index</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportSnapshot}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-zinc-500 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
            title="Download verified static snapshot of all data & calculation invariants as a safety net"
          >
            {exported ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Snapshot Exported</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Verified Snapshot</span>
              </>
            )}
          </button>
          <span className="text-zinc-700 hidden sm:inline">•</span>
          <span className="text-zinc-600 font-medium">Client-Side React • TypeScript • Vite</span>
        </div>
      </footer>
    </div>
  );
}
