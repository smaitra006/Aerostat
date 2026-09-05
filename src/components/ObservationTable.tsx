import React, { useEffect, useState } from 'react';
import { loadObservations } from '@/services/dataStore.ts';
import type { FareObservation } from '@/types/airfare.ts';
import { AlertTriangle, Ban, CheckCircle, Filter } from 'lucide-react';

interface ObservationTableProps {
  filterMode?: 'all' | 'anomalies' | 'sold_out';
  onFilterChange?: (mode: 'all' | 'anomalies' | 'sold_out') => void;
}

export function ObservationTable({ filterMode: externalFilter, onFilterChange }: ObservationTableProps) {
  const [observations, setObservations] = useState<FareObservation[]>([]);
  const [internalFilter, setInternalFilter] = useState<'all' | 'anomalies' | 'sold_out'>('all');

  const currentFilter = externalFilter ?? internalFilter;

  const handleFilterChange = (mode: 'all' | 'anomalies' | 'sold_out') => {
    if (onFilterChange) {
      onFilterChange(mode);
    }
    setInternalFilter(mode);
  };

  useEffect(() => {
    const data = loadObservations();
    setObservations(data);
    console.log(`[AeroStat UI] ObservationTable mounted. Table row count: ${data.length}`);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const anomaliesCount = observations.filter((o) => o.isAnomaly).length;
  const soldOutCount = observations.filter((o) => o.status === 'sold_out').length;

  const displayedObservations = observations.filter((obs) => {
    if (currentFilter === 'anomalies') return obs.isAnomaly;
    if (currentFilter === 'sold_out') return obs.status === 'sold_out';
    return true;
  });

  return (
    <div className="w-full space-y-3">
      {/* MANDATORY PROMINENT BADGE: DEMO DATASET — FIXTURE DATA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-950/40 border-2 border-amber-500/80 p-3 sm:px-4 sm:py-2.5 rounded shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-amber-300 font-black text-xs sm:text-sm tracking-[0.2em] uppercase font-mono">
              DEMO DATASET — FIXTURE DATA
            </span>
            <span className="text-amber-200/80 text-[11px] font-mono">
              (Synthetic price observations • No external network calls)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-amber-300/90 tracking-wider">
          <span>TOTAL RECORDS: {observations.length}</span>
          <span className="text-amber-500">•</span>
          <span className="text-amber-400">ANOMALIES: {anomaliesCount}</span>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0F0F11] border border-[#222] px-3 py-2 rounded">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-300">View Filter:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              currentFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#18181D] text-zinc-400 hover:text-white hover:bg-[#222228]'
            }`}
          >
            All Observations ({observations.length})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('anomalies')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              currentFilter === 'anomalies'
                ? 'bg-amber-600 text-black font-black shadow-sm'
                : 'bg-[#18181D] text-amber-400 hover:bg-amber-950/40 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Flagged Anomalies ({anomaliesCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('sold_out')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              currentFilter === 'sold_out'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-[#18181D] text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
            }`}
          >
            <Ban className="w-3 h-3" />
            Sold Out ({soldOutCount})
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER - SCROLLABLE FOR LARGE DATASETS */}
      <div className="border border-[#222] bg-[#0F0F11] rounded overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[#222] bg-[#161618] text-[#71717A] text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold text-zinc-300">#</th>
                <th className="py-3 px-4 font-bold text-zinc-300">Route</th>
                <th className="py-3 px-4 font-bold text-zinc-300">Carrier</th>
                <th className="py-3 px-4 font-bold text-zinc-300 text-center">Lead Time</th>
                <th className="py-3 px-4 font-bold text-zinc-300">Observed Date</th>
                <th className="py-3 px-4 font-bold text-zinc-300 text-right">Base Fare</th>
                <th className="py-3 px-4 font-bold text-zinc-300 text-right">Taxes & Fees</th>
                <th className="py-3 px-4 font-bold text-zinc-300 text-right">Total Fare</th>
                <th className="py-3 px-4 font-bold text-zinc-300 text-center">Quality / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D1D22]">
              {displayedObservations.map((obs, index) => {
                const routeLabel = `${obs.origin}-${obs.destination}`;
                const isAvailable = obs.status === 'available';
                const isAnomaly = Boolean(obs.isAnomaly);
                const observedDate = obs.observedAt.slice(0, 10);

                return (
                  <tr
                    key={obs.id}
                    className={`transition-colors group ${
                      isAnomaly
                        ? 'border-l-4 border-l-amber-500 bg-amber-950/20 hover:bg-amber-950/35'
                        : 'hover:bg-[#18181D]'
                    }`}
                  >
                    <td className="py-2 px-4 text-zinc-500 text-[10px]">
                      {String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="py-2 px-4 font-bold text-[#60A5FA] tracking-wide whitespace-nowrap">
                      {routeLabel}
                    </td>
                    <td className="py-2 px-4 text-zinc-200 font-medium whitespace-nowrap">
                      {obs.carrier}
                    </td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#202028] text-zinc-300 border border-[#2D2D38]">
                        {obs.leadTimeDays}d
                      </span>
                    </td>
                    <td className="py-2 px-4 text-zinc-400 whitespace-nowrap text-[11px]">
                      {observedDate}
                    </td>
                    <td className="py-2 px-4 text-right text-zinc-400 whitespace-nowrap">
                      {formatCurrency(obs.baseFare)}
                    </td>
                    <td className="py-2 px-4 text-right text-zinc-500 whitespace-nowrap">
                      {formatCurrency(obs.taxes)}
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <span className={`font-bold ${isAnomaly ? 'text-amber-300' : 'text-white'}`}>
                          {formatCurrency(obs.totalFare)}
                        </span>
                        {isAnomaly && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-500/80"
                            title="Statistical anomaly: fare exceeds IQR 1.5x threshold"
                          >
                            IQR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isAvailable
                              ? 'bg-emerald-950/60 text-[#10B981] border border-emerald-800/60'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {obs.status}
                        </span>
                        {isAnomaly && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Anomaly
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#222] bg-[#0A0A0C] px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-zinc-500">
          <div>
            Showing <span className="font-bold text-zinc-300">{displayedObservations.length}</span> of{' '}
            <span className="font-bold text-zinc-300">{observations.length}</span> verified fixture observations
            {currentFilter !== 'all' && (
              <span className="text-amber-400 ml-1.5 font-bold">({currentFilter} filter active)</span>
            )}
          </div>
          <div className="text-[10px] text-zinc-600">
            Source: <span className="font-mono text-zinc-400">/src/data/fixtures/sampleObservations.json</span>
          </div>
        </div>
      </div>
    </div>
  );
}
