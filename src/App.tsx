import React, { useState, useMemo } from 'react';
import { ObservationTable } from '@/components/ObservationTable.tsx';
import { DataQualityPanel } from '@/components/DataQualityPanel.tsx';
import { IndexSummaryCard } from '@/components/IndexSummaryCard.tsx';
import { IndexTrendChart } from '@/components/IndexTrendChart.tsx';
import { SectorHeatmap } from '@/components/SectorHeatmap.tsx';
import { LeadTimeElasticityChart } from '@/components/LeadTimeElasticityChart.tsx';
import { MethodologyValidationPanel } from '@/components/MethodologyValidationPanel.tsx';
import { ApiContractDocs } from '@/components/ApiContractDocs.tsx';
import { ApiExplorerPanel } from '@/components/ApiExplorerPanel.tsx';
import { HealthCheckBanner } from '@/components/HealthCheckBanner.tsx';
import { runPipelineHealthCheck } from '@/services/healthCheck.ts';
import { triggerSnapshotDownload } from '@/services/snapshotExport.ts';
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
    <div className="bg-[#0A0A0B] text-[#E0E0E0] font-mono min-h-screen flex flex-col select-none antialiased">
      {/* HEADER SECTION - BOLD TYPOGRAPHY DESIGN */}
      <header className="border-b border-[#222] p-5 sm:p-6 lg:px-10 flex flex-col md:flex-row justify-between md:items-end gap-6 bg-[#0A0A0B]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#3B82F6] animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-[0.3em] text-[#3B82F6] uppercase font-mono">
              Airfare Price Index Prototype • Phase 3 APIx Engine
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-[90px] leading-[0.85] font-black tracking-tighter text-[#3B82F6] uppercase font-mono">
            AEROSTAT
          </h1>
          <p className="text-xs mt-3 tracking-[0.2em] uppercase text-[#71717A] font-sans">
            Chain-Linked Passenger-Weighted Geometric Mean Index • Anomaly Detection • DQS
          </p>
        </div>

        {/* METRICS / STATS CARDS */}
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <div className="border border-[#222] bg-[#0F0F11] px-4 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-[#71717A]">
              Active Routes
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
              <Plane className="w-3.5 h-3.5 text-[#3B82F6]" />
              DEL-BOM • DEL-BLR • BOM-BLR
            </div>
          </div>

          <div className="border border-[#222] bg-[#0F0F11] px-4 py-2 text-right">
            <div className="text-[10px] uppercase tracking-widest text-[#71717A]">
              Source Type
            </div>
            <div className="text-sm font-bold text-[#10B981] flex items-center gap-1.5 justify-end">
              <Database className="w-3.5 h-3.5 text-[#10B981]" />
              Local JSON Fixtures
            </div>
          </div>
        </div>
      </header>

      {/* 0. RUNTIME PIPELINE HEALTH CHECK BANNER (RENDERED ONLY IF HEALTHY === FALSE) */}
      <HealthCheckBanner healthResult={healthResult} />

      {/* MAIN CONTAINER: INDEX CARD, DATA QUALITY PANEL & OBSERVATION TABLE */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-4">
        {/* AIRFARE PRICE INDEX (APIx) SUMMARY CARD */}
        <IndexSummaryCard />

        {/* DATA QUALITY PANEL (SCORE & BREAKDOWN) */}
        <DataQualityPanel
          onFilterAnomalies={handleToggleAnomalyFilter}
          isFilterActive={tableFilter === 'anomalies'}
        />

        {/* OBSERVATION TABLE (INCLUDES MANDATORY PROMINENT BADGE AT TOP) */}
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

        {/* 6. LOCAL API EXPLORER (ZERO NETWORK CALLS) */}
        <ApiExplorerPanel />
      </main>

      {/* COMPACT FOOTER WITH LOW-PRIORITY STATIC SNAPSHOT EXPORT BUTTON */}
      <footer className="border-t border-[#222] bg-black px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]"></span>
          <span>AeroStat Airfare Prototype — Phase 3: Chain-Linked Passenger-Weighted Geometric Mean Index</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121217] hover:bg-[#1C1C24] text-zinc-300 hover:text-white border border-[#2B2B36] hover:border-zinc-500 rounded text-[11px] font-mono transition shadow-sm cursor-pointer active:translate-y-0.5"
            title="Download verified static snapshot of all data & calculation invariants as a safety net"
          >
            {exported ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Snapshot Exported</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Verified Snapshot</span>
              </>
            )}
          </button>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-600">Client-Side React • TypeScript • Vite</span>
        </div>
      </footer>
    </div>
  );
}

