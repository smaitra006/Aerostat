import React, { useEffect, useState } from 'react';
import { getDataQualityReport } from '@/services/dataStore.ts';
import type { DataQualityReport } from '@/types/airfare.ts';
import { ShieldCheck, AlertTriangle, Ban, FileWarning, CheckCircle2 } from 'lucide-react';

interface DataQualityPanelProps {
  onFilterAnomalies?: () => void;
  isFilterActive?: boolean;
}

export function DataQualityPanel({ onFilterAnomalies, isFilterActive }: DataQualityPanelProps) {
  const [report, setReport] = useState<DataQualityReport | null>(null);

  useEffect(() => {
    const r = getDataQualityReport();
    setReport(r);
  }, []);

  if (!report) {
    return null;
  }

  const isHealthy = report.score >= 90;

  return (
    <div className="w-full bg-[#0F0F11] border border-[#222] rounded p-3 sm:p-4 text-xs font-mono shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* SCORE & INTEGRITY STATUS */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded bg-[#16161A] border border-[#2D2D38] shrink-0">
            <ShieldCheck className={`w-6 h-6 ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                {report.score.toFixed(2)}
              </span>
              <span className="text-zinc-500 font-bold text-xs">/ 100</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isHealthy
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                {isHealthy ? 'High Integrity' : 'Degraded Quality'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
              <span className="font-bold text-zinc-300">Data Quality Score (DQS)</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500 text-[10px]">Heuristic Ingestion Metric</span>
            </div>
          </div>
        </div>

        {/* METRICS TILES & PENALTY BREAKDOWN */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1 lg:max-w-xl">
          {/* SOLD OUT TILE */}
          <div className="bg-[#141417] border border-[#202026] rounded p-2 sm:px-3 text-left">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Ban className="w-3 h-3 text-rose-400" />
                Sold-Out
              </span>
              <span className="text-rose-400 font-bold">-{report.deductions.soldOutDeduction.toFixed(2)}</span>
            </div>
            <div className="mt-1 text-base font-bold text-zinc-200">
              {report.soldOutCount}{' '}
              <span className="text-[10px] text-zinc-500 font-normal">({((report.soldOutCount / report.totalObservations) * 100).toFixed(1)}%)</span>
            </div>
          </div>

          {/* ANOMALY TILE (CLICKABLE TO TOGGLE ANOMALY FILTER IF PROVIDED) */}
          <button
            type="button"
            onClick={onFilterAnomalies}
            className={`bg-[#141417] border rounded p-2 sm:px-3 text-left transition-colors cursor-pointer group ${
              isFilterActive
                ? 'border-amber-500/80 bg-amber-950/30'
                : 'border-[#202026] hover:border-amber-500/50'
            }`}
            title="Click to toggle filter to anomaly records only"
          >
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Anomalies
              </span>
              <span className="text-amber-400 font-bold">-{report.deductions.anomalyDeduction.toFixed(2)}</span>
            </div>
            <div className="mt-1 text-base font-bold text-amber-300 flex items-center justify-between">
              <span>
                {report.anomalyCount}{' '}
                <span className="text-[10px] text-zinc-500 font-normal">({((report.anomalyCount / report.totalObservations) * 100).toFixed(1)}%)</span>
              </span>
              {onFilterAnomalies && (
                <span className="text-[9px] text-zinc-500 group-hover:text-amber-300 transition-colors uppercase font-mono">
                  {isFilterActive ? 'Filtered' : 'Filter'}
                </span>
              )}
            </div>
          </button>

          {/* MISSING FIELDS TILE */}
          <div className="bg-[#141417] border border-[#202026] rounded p-2 sm:px-3 text-left">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <FileWarning className="w-3 h-3 text-zinc-400" />
                Missing
              </span>
              <span className="text-zinc-500 font-bold">-{report.deductions.missingFieldDeduction.toFixed(2)}</span>
            </div>
            <div className="mt-1 text-base font-bold text-zinc-200">
              {report.missingFieldWarnings}{' '}
              <span className="text-[10px] text-zinc-500 font-normal">fields</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER FORMULA NOTE */}
      <div className="mt-2.5 pt-2 border-t border-[#1C1C22] flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-zinc-400 font-bold">Formula:</span>
          <span>
            100 - ({report.soldOutCount}/{report.totalObservations} × 20) - ({report.anomalyCount}/{report.totalObservations} × 15) - ({report.missingFieldWarnings}/{report.totalObservations} × 25) ={' '}
            <strong className="text-zinc-300">{report.score.toFixed(2)}</strong>
          </span>
        </div>
        <div className="text-zinc-600 text-[9px]">
          [Heuristic scoring model • Pure client calculation]
        </div>
      </div>
    </div>
  );
}
