import React, { useMemo } from 'react';
import { getIndexSeries } from '@/services/dataStore.ts';
import { getRouteWeights, DGCA_WEIGHTS_DISCLAIMER, DGCA_WEIGHTS_NOTE } from '@/services/indexEngine.ts';
import { CheckCircle, Scale, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export function IndexSummaryCard() {
  const series = useMemo(() => {
    return getIndexSeries();
  }, []);

  const routeWeights: Record<string, number> = useMemo(() => {
    return getRouteWeights();
  }, []);

  const latestPoint = series.length > 0 ? series[series.length - 1] : null;
  const basePoint = series.length > 0 ? series[0] : null;

  const currentValue = latestPoint ? latestPoint.indexValue : 100.0;
  const pctChange = latestPoint ? ((currentValue - 100.0) / 100.0) * 100 : 0.0;
  const isPositive = pctChange >= 0;

  return (
    <div className="w-full bg-[#0F0F11] border border-[#222] rounded p-4 sm:p-5 font-mono shadow-lg text-xs space-y-4">
      {/* VISIBLE DGCA WEIGHTS CITATION BANNER (NOT FINE PRINT) */}
      <div className="flex items-center gap-2.5 bg-blue-950/50 border border-blue-500/70 px-3.5 py-2.5 rounded text-blue-200 font-bold text-[11px] sm:text-xs">
        <Scale className="w-4 h-4 text-blue-400 shrink-0" />
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="tracking-wide font-black text-white">
            {DGCA_WEIGHTS_DISCLAIMER}
          </span>
          <span className="text-blue-300 font-medium text-[11px]">
            {DGCA_WEIGHTS_NOTE}
          </span>
          <span className="text-zinc-400 font-normal text-[10px]">
            • Source: DGCA Monthly Statistics via india-aviation-traffic (ODbL)
          </span>
        </div>
      </div>

      {/* MAIN METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* LEFT / CENTER: CURRENT VALUE DISPLAY */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              Airfare Price Index (APIx)
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] text-zinc-500">Base = 100.00</span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {currentValue.toFixed(2)}
            </span>
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black tracking-wider ${
                isPositive
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{isPositive ? `+${pctChange.toFixed(2)}%` : `${pctChange.toFixed(2)}%`}</span>
              <span className="text-[10px] text-zinc-400 font-normal">vs base</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-2 pt-1">
            <span>
              Base Period: <strong className="text-zinc-200">{basePoint?.date ?? '—'}</strong> (100.00)
            </span>
            <span className="text-zinc-600">→</span>
            <span>
              Latest: <strong className="text-zinc-200">{latestPoint?.date ?? '—'}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">({series.length} daily chained periods)</span>
          </div>
        </div>

        {/* RIGHT: WEIGHTS BREAKDOWN & ANOMALY FILTER TOGGLE */}
        <div className="md:col-span-6 bg-[#141418] border border-[#222] rounded p-3 space-y-3">
          {/* METHODOLOGY & WEIGHTS */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider mb-2 font-bold">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Route Passenger Weights (DGCA Dec 2025)
              </span>
              <span className="text-zinc-500 font-normal">Method: Geometric Mean</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {Object.entries(routeWeights).map(([route, weight]) => (
                <div
                  key={route}
                  className="bg-[#1A1A22] border border-[#2B2B38] rounded px-2 py-1.5"
                >
                  <div className="text-[10px] font-bold text-blue-400">{route}</div>
                  <div className="text-xs font-black text-white">
                    {(weight * 100).toFixed(2)}%{' '}
                    <span className="text-[10px] text-zinc-400 font-normal">({weight.toFixed(4)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* METHODOLOGY STATUS / IQRs */}
          <div className="pt-2 border-t border-[#222] flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Statistical IQR Anomalies:</span>
            </div>
            <span className="text-zinc-300 font-semibold bg-[#1A1A22] px-2 py-0.5 rounded border border-[#2B2B38]">
              19 Flagged • Retained in Index
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER NOTE EXPLAINING MATHEMATICAL STRUCTURE */}
      <div className="border-t border-[#1C1C22] pt-2 text-[10px] text-zinc-500 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-zinc-400">Calculation: </span>
          Chain-linked, passenger-weighted geometric mean: Δ = exp(Σ w_r · ln(rel_r) / Σ w_r). Sold-out records excluded.
        </div>
        <div className="text-zinc-600">
          Continuous Chain Link • Base 100.00
        </div>
      </div>
    </div>
  );
}
