import React, { useEffect, useState } from 'react';
import { fetchObservations } from '@/services/apiClient';
import { computeDataQualityScore } from '@/services/dataQuality';
import type { DataQualityReport } from '@/types/airfare';
import { ShieldCheck, AlertTriangle, Ban, FileWarning, CheckCircle2 } from 'lucide-react';

interface DataQualityPanelProps {
  onFilterAnomalies?: () => void;
  isFilterActive?: boolean;
}

export function DataQualityPanel({ onFilterAnomalies, isFilterActive }: DataQualityPanelProps) {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchObservations()
      .then((res) => {
        if (isMounted) {
          const scoreReport = computeDataQualityScore(res.data);
          setReport(scoreReport);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch observations for Data Quality Panel', err);
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-center min-h-[120px] backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-zinc-500 font-sans">Calculating Data Quality...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const isHealthy = report.score >= 90;

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-md font-sans">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* SCORE & INTEGRITY STATUS */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-14 h-14 rounded-xl border shrink-0 ${isHealthy ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20'}`}>
            <ShieldCheck className={`w-7 h-7 ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
                {report.score.toFixed(2)}
              </span>
              <span className="text-zinc-500 font-semibold text-sm">/ 100</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ml-2 ${
                  isHealthy
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {isHealthy ? 'High Integrity' : 'Degraded Quality'}
              </span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="font-semibold text-zinc-300">Data Quality Score (DQS)</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">Heuristic Ingestion Metric</span>
            </div>
          </div>
        </div>

        {/* METRICS TILES & PENALTY BREAKDOWN */}
        <div className="grid grid-cols-3 gap-3 flex-1 xl:max-w-xl">
          {/* SOLD OUT TILE */}
          <div className="bg-zinc-800/40 border border-white/5 rounded-xl p-3 sm:px-4 text-left">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                Sold-Out
              </span>
              <span className="text-rose-400 font-bold font-mono">-{report.deductions.soldOutDeduction.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-lg font-bold text-zinc-200 font-mono">
              {report.soldOutCount}{' '}
              <span className="text-[11px] text-zinc-500 font-semibold font-sans">({((report.soldOutCount / report.totalObservations) * 100).toFixed(1)}%)</span>
            </div>
          </div>

          {/* ANOMALY TILE (CLICKABLE TO TOGGLE ANOMALY FILTER IF PROVIDED) */}
          <button
            type="button"
            onClick={onFilterAnomalies}
            className={`text-left transition-all duration-200 cursor-pointer group ${
              isFilterActive
                ? 'bg-amber-500/10 border-amber-500/30 rounded-xl p-3 sm:px-4 shadow-inner'
                : 'bg-zinc-800/40 border-white/5 rounded-xl p-3 sm:px-4 hover:border-amber-500/30 hover:bg-zinc-800/60'
            } border`}
            title="Click to toggle filter to anomaly records only"
          >
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-amber-500/80 group-hover:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Anomalies
              </span>
              <span className="text-amber-400 font-bold font-mono">-{report.deductions.anomalyDeduction.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-lg font-bold text-amber-400 font-mono flex items-center justify-between">
              <span>
                {report.anomalyCount}{' '}
                <span className="text-[11px] text-zinc-500 font-semibold font-sans">({((report.anomalyCount / report.totalObservations) * 100).toFixed(1)}%)</span>
              </span>
              {onFilterAnomalies && (
                <span className="text-[10px] text-amber-500/50 group-hover:text-amber-400 transition-colors uppercase font-bold font-sans">
                  {isFilterActive ? 'Filtered' : 'Filter'}
                </span>
              )}
            </div>
          </button>

          {/* MISSING FIELDS TILE */}
          <div className="bg-zinc-800/40 border border-white/5 rounded-xl p-3 sm:px-4 text-left">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-zinc-400" />
                Missing
              </span>
              <span className="text-zinc-500 font-bold font-mono">-{report.deductions.missingFieldDeduction.toFixed(2)}</span>
            </div>
            <div className="mt-2 text-lg font-bold text-zinc-200 font-mono">
              {report.missingFieldWarnings}{' '}
              <span className="text-[11px] text-zinc-500 font-semibold font-sans">fields</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER FORMULA NOTE */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold">Formula:</span>
          <span className="font-mono">
            100 - ({report.soldOutCount}/{report.totalObservations} × 20) - ({report.anomalyCount}/{report.totalObservations} × 15) - ({report.missingFieldWarnings}/{report.totalObservations} × 25) ={' '}
            <strong className="text-indigo-300 font-bold">{report.score.toFixed(2)}</strong>
          </span>
        </div>
        <div className="text-zinc-600 text-[10px] font-medium tracking-wide uppercase">
          Live DB Scoring Model
        </div>
      </div>
    </div>
  );
}
