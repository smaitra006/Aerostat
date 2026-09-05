import React, { useMemo } from 'react';
import { getAverageFareByRouteAndLeadTime } from '@/services/dataStore.ts';
import type { SectorCellData } from '@/services/dataStore.ts';
import { Grid, AlertCircle, Info } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  'DEL-BOM': 'Delhi ⇄ Mumbai',
  'DEL-BLR': 'Delhi ⇄ Bengaluru',
  'BOM-BLR': 'Mumbai ⇄ Bengaluru',
};

/**
 * Maps a fare between min and max to a cool-to-warm color scale.
 * Low fares (cool teal/cyan) -> Medium (amber/gold) -> High fares (warm rose/coral).
 */
function getHeatmapColor(fare: number | null, min: number, max: number) {
  if (fare === null || fare === 0) {
    return {
      bg: 'bg-zinc-900/60',
      border: 'border-zinc-800',
      text: 'text-zinc-500',
      badge: 'bg-zinc-800/80 text-zinc-400',
    };
  }

  const range = max - min;
  const ratio = range > 0 ? Math.min(Math.max((fare - min) / range, 0), 1) : 0.5;

  if (ratio < 0.25) {
    // Coolest: Deep Cyan / Slate Blue
    return {
      bg: 'bg-cyan-950/40 hover:bg-cyan-950/60',
      border: 'border-cyan-800/40',
      text: 'text-cyan-200',
      badge: 'bg-cyan-900/50 text-cyan-300',
    };
  } else if (ratio < 0.5) {
    // Cool-Medium: Emerald / Sage
    return {
      bg: 'bg-emerald-950/40 hover:bg-emerald-950/60',
      border: 'border-emerald-800/40',
      text: 'text-emerald-200',
      badge: 'bg-emerald-900/50 text-emerald-300',
    };
  } else if (ratio < 0.75) {
    // Medium-Warm: Amber / Gold
    return {
      bg: 'bg-amber-950/50 hover:bg-amber-950/70',
      border: 'border-amber-700/50',
      text: 'text-amber-200',
      badge: 'bg-amber-900/60 text-amber-300',
    };
  } else {
    // Warmest: Rose / Crimson
    return {
      bg: 'bg-rose-950/50 hover:bg-rose-950/70',
      border: 'border-rose-600/60',
      text: 'text-rose-100',
      badge: 'bg-rose-900/70 text-rose-300',
    };
  }
}

export function SectorHeatmap() {
  const aggregations = useMemo(() => getAverageFareByRouteAndLeadTime(), []);
  const { routes, leadTimes, matrix, totalSoldOutExcluded, minFare, maxFare } = aggregations;

  return (
    <div className="w-full bg-[#0F0F11] border border-[#222] rounded p-4 sm:p-5 font-mono shadow-lg text-xs space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded text-indigo-400">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                Sector Fare Heatmap
              </h2>
              <span className="bg-amber-950/50 border border-amber-600/60 text-amber-300 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                DEMO DATASET
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Average total fare (₹) by route sector × advance booking lead time
            </p>
          </div>
        </div>

        {/* EXCLUSIONS INFO */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-[#1A1A22] border border-[#2B2B38] px-2.5 py-1 rounded text-zinc-300">
            <span className="text-amber-400 font-bold">{totalSoldOutExcluded}</span> sold-out records excluded
          </span>
          <span className="bg-[#1A1A22] border border-[#2B2B38] px-2.5 py-1 rounded text-zinc-400">
            Range: <span className="text-white font-bold">₹{minFare.toLocaleString('en-IN')}</span> -{' '}
            <span className="text-white font-bold">₹{maxFare.toLocaleString('en-IN')}</span>
          </span>
        </div>
      </div>

      {/* HEATMAP GRID TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[580px]">
          <thead>
            <tr className="border-b border-[#222]">
              <th className="py-2.5 px-3 text-[10px] uppercase font-bold text-zinc-400 tracking-wider w-44">
                Route Sector
              </th>
              {leadTimes.map((lt) => (
                <th
                  key={lt}
                  className="py-2.5 px-3 text-center text-[10px] uppercase font-bold text-zinc-300 tracking-wider"
                >
                  <div>{lt} Day{lt > 1 ? 's' : ''}</div>
                  <div className="text-[9px] text-zinc-500 font-normal">
                    {lt === 1 ? 'Eve of Dept' : `${lt}d advance`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A20]">
            {routes.map((route) => (
              <tr key={route} className="hover:bg-[#121216] transition-colors">
                {/* ROUTE HEADER */}
                <td className="py-3 px-3">
                  <div className="font-bold text-white text-xs tracking-wider">{route}</div>
                  <div className="text-[10px] text-zinc-400">{ROUTE_LABELS[route] ?? route}</div>
                </td>

                {/* LEAD TIME CELLS */}
                {leadTimes.map((lt) => {
                  const cell: SectorCellData = matrix[route][lt];
                  const color = getHeatmapColor(cell.averageFare, minFare, maxFare);

                  if (cell.averageFare === null) {
                    return (
                      <td key={lt} className="p-2 text-center">
                        <div className="p-2.5 rounded border border-dashed border-zinc-700 bg-zinc-900/40 text-zinc-500">
                          <AlertCircle className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-500" />
                          <div className="text-[10px] font-bold uppercase">No Data</div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={lt} className="p-2 text-center">
                      <div
                        className={`p-2.5 rounded border transition-all ${color.bg} ${color.border}`}
                      >
                        <div className={`text-sm font-black tracking-tight ${color.text}`}>
                          ₹{cell.averageFare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px]">
                          <span className="text-zinc-400 font-medium">n={cell.count}</span>
                          {cell.soldOutCount > 0 && (
                            <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1 rounded">
                              {cell.soldOutCount} sold-out
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HEATMAP COLOR SCALE LEGEND */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#222] text-[10px] text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wider font-bold text-zinc-500">Fare Scale:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-300">Cool (Low ₹3k)</span>
            <div className="h-2 w-32 rounded-full bg-gradient-to-r from-cyan-900 via-emerald-800 via-amber-800 to-rose-700"></div>
            <span className="text-rose-300">Warm (High ₹16k+)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-zinc-500">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>Sold-out fares (₹0) are strictly excluded from average computations</span>
        </div>
      </div>
    </div>
  );
}
