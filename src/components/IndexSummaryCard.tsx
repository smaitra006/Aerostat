import React, { useState, useEffect, useMemo } from 'react';
import { fetchIndexSeries } from '@/services/apiClient';
import { IndexPoint } from '@/types/airfare';
import { getRouteWeights, DGCA_WEIGHTS_DISCLAIMER, DGCA_WEIGHTS_NOTE } from '@/services/indexEngine';
import { CheckCircle, Scale, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export function IndexSummaryCard() {
  const [series, setSeries] = useState<IndexPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchIndexSeries(30).then((res) => {
      if (isMounted) {
        setSeries(res.data.series);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const routeWeights: Record<string, number> = useMemo(() => {
    return getRouteWeights();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full p-5 flex flex-col items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-zinc-500 font-sans">Loading APIx Data...</span>
        </div>
      </div>
    );
  }

  const latestPoint = series.length > 0 ? series[series.length - 1] : null;
  const basePoint = series.length > 0 ? series[0] : null;

  const currentValue = latestPoint ? latestPoint.indexValue : 100.0;
  const pctChange = latestPoint ? ((currentValue - 100.0) / 100.0) * 100 : 0.0;
  const isPositive = pctChange >= 0;

  return (
    <div className="w-full h-full p-5 font-sans space-y-5 flex flex-col">
      {/* VISIBLE DGCA WEIGHTS CITATION BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 px-4 py-3 rounded-xl text-sky-200">
        <Scale className="w-5 h-5 text-sky-400 shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5">
          <span className="tracking-wide font-bold text-white text-xs sm:text-sm">
            {DGCA_WEIGHTS_DISCLAIMER}
          </span>
          <span className="text-sky-300 font-medium text-xs">
            {DGCA_WEIGHTS_NOTE}
          </span>
          <span className="text-indigo-300/70 font-medium text-[11px] hidden md:inline">
            • Source: DGCA Monthly Statistics via india-aviation-traffic (ODbL)
          </span>
        </div>
      </div>

      {/* MAIN METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center flex-1">
        {/* LEFT / CENTER: CURRENT VALUE DISPLAY */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-2 pl-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            <span className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">
              Airfare Price Index (APIx)
            </span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline font-semibold">Base = 100.00</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-[11px] font-bold text-indigo-400 uppercase hidden sm:inline">Live</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-4 mt-1">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
              {currentValue.toFixed(2)}
            </span>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold tracking-wide shadow-sm ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="font-mono">{isPositive ? `+${pctChange.toFixed(2)}%` : `${pctChange.toFixed(2)}%`}</span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2 pt-2">
            <span>
              Base: <strong className="text-zinc-200">{basePoint?.date ?? '—'}</strong>
            </span>
            <span className="text-zinc-600">→</span>
            <span>
              Latest: <strong className="text-zinc-200">{latestPoint?.date ?? '—'}</strong>
            </span>
            <span className="text-zinc-600 hidden md:inline">•</span>
            <span className="text-zinc-500 font-medium hidden md:inline">({series.length} periods)</span>
          </div>
        </div>

        {/* RIGHT: WEIGHTS BREAKDOWN & ANOMALY FILTER TOGGLE */}
        <div className="md:col-span-6 bg-zinc-950/40 border border-white/5 shadow-inner rounded-xl p-4 space-y-4">
          {/* METHODOLOGY & WEIGHTS */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider mb-3 font-bold">
              <span className="flex items-center gap-2 text-zinc-300">
                <Layers className="w-4 h-4 text-indigo-400" />
                Route Passenger Weights (Dec 2025)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {Object.entries(routeWeights).map(([route, weight]) => (
                <div
                  key={route}
                  className="bg-zinc-900/60 border border-white/5 shadow-sm rounded-lg px-2 py-2"
                >
                  <div className="text-[11px] font-bold text-sky-400 mb-0.5">{route}</div>
                  <div className="text-sm font-black text-white font-mono">
                    {(weight * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5 font-mono">({weight.toFixed(4)})</div>
                </div>
              ))}
            </div>
          </div>

          {/* METHODOLOGY STATUS / IQRs */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Statistical IQR Anomalies:</span>
            </div>
            <span className="text-zinc-300 font-semibold bg-zinc-900/60 px-2.5 py-1 rounded-md border border-white/5 text-[11px] uppercase tracking-wide">
              Flagged • Retained
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE EXPLAINING MATHEMATICAL STRUCTURE */}
      <div className="border-t border-white/5 pt-3 text-[11px] text-zinc-500 flex flex-wrap items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-400">Calculation:</span>
          <span className="font-mono">Δ = exp(Σ w_r · ln(rel_r) / Σ w_r)</span>
        </div>
        <div className="text-zinc-600 font-medium tracking-wide uppercase text-[10px]">
          Continuous Chain Link • Geometric Mean
        </div>
      </div>
    </div>
  );
}
