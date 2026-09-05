import React, { useEffect, useState } from 'react';
import { fetchObservations } from '@/services/apiClient';
import type { FareObservation } from '@/types/airfare';
import { AlertTriangle, Ban, Filter } from 'lucide-react';

interface ObservationTableProps {
  filterMode?: 'all' | 'anomalies' | 'sold_out';
  onFilterChange?: (mode: 'all' | 'anomalies' | 'sold_out') => void;
}

export function ObservationTable({ filterMode: externalFilter, onFilterChange }: ObservationTableProps) {
  const [observations, setObservations] = useState<FareObservation[]>([]);
  const [internalFilter, setInternalFilter] = useState<'all' | 'anomalies' | 'sold_out'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const currentFilter = externalFilter ?? internalFilter;

  const handleFilterChange = (mode: 'all' | 'anomalies' | 'sold_out') => {
    if (onFilterChange) {
      onFilterChange(mode);
    }
    setInternalFilter(mode);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchObservations()
      .then((res) => {
        if (isMounted) {
          setObservations(res.data);
          setIsLoading(false);
          console.log(`[AeroStat UI] ObservationTable fetched live data. Row count: ${res.data.length}`);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch observations', err);
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
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
    <div className="w-full space-y-4 font-sans">
      {/* MANDATORY PROMINENT BADGE: LIVE POSTGRESQL DATA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-indigo-400 font-bold text-xs sm:text-sm tracking-[0.1em] uppercase">
              LIVE POSTGRESQL DATA
            </span>
            <span className="text-indigo-300/70 text-xs font-medium">
              Real-time price observations
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-sky-300 tracking-wide">
          <span>TOTAL RECORDS: {observations.length}</span>
          <span className="text-indigo-500/50">•</span>
          <span className="text-amber-400">ANOMALIES: {anomaliesCount}</span>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/50 border border-white/5 px-4 py-3 rounded-xl backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Filter className="w-4 h-4 text-zinc-500" />
          <span className="text-[12px] font-semibold text-zinc-300">View Filter:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              currentFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
            }`}
          >
            All Observations ({observations.length})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('anomalies')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              currentFilter === 'anomalies'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/20'
                : 'bg-zinc-800/50 text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Flagged Anomalies ({anomaliesCount})
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('sold_out')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              currentFilter === 'sold_out'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/20'
                : 'bg-zinc-800/50 text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            Sold Out ({soldOutCount})
          </button>
        </div>
      </div>

      {/* TABLE CONTAINER - SCROLLABLE FOR LARGE DATASETS */}
      <div className="border border-white/5 bg-zinc-900/40 rounded-xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-white/5 bg-zinc-800/80 backdrop-blur-xl text-zinc-400 text-xs uppercase tracking-wider">
                <th className="py-4 px-5 font-semibold">#</th>
                <th className="py-4 px-5 font-semibold">Route</th>
                <th className="py-4 px-5 font-semibold">Carrier</th>
                <th className="py-4 px-5 font-semibold text-center">Lead Time</th>
                <th className="py-4 px-5 font-semibold">Observed Date</th>
                <th className="py-4 px-5 font-semibold text-right">Base Fare</th>
                <th className="py-4 px-5 font-semibold text-right">Taxes & Fees</th>
                <th className="py-4 px-5 font-semibold text-right">Total Fare</th>
                <th className="py-4 px-5 font-semibold text-center">Quality / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Loading live data...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedObservations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500 font-medium">
                    No observations found.
                  </td>
                </tr>
              ) : (
                displayedObservations.map((obs, index) => {
                  const routeLabel = `${obs.origin}-${obs.destination}`;
                  const isAvailable = obs.status === 'available';
                  const isAnomaly = Boolean(obs.isAnomaly);
                  const observedDate = obs.observedAt.slice(0, 10);

                  return (
                    <tr
                      key={obs.id}
                      className={`transition-colors group ${
                        isAnomaly
                          ? 'border-l-4 border-l-amber-500 bg-amber-900/10 hover:bg-amber-900/20'
                          : 'border-l-4 border-l-transparent hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="py-3 px-5 text-zinc-500 text-xs font-mono">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="py-3 px-5 font-semibold text-indigo-400 whitespace-nowrap">
                        {routeLabel}
                      </td>
                      <td className="py-3 px-5 text-zinc-200 font-medium whitespace-nowrap">
                        {obs.carrier}
                      </td>
                      <td className="py-3 px-5 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/5">
                          {obs.leadTimeDays}d
                        </span>
                      </td>
                      <td className="py-3 px-5 text-zinc-400 whitespace-nowrap text-xs font-mono">
                        {observedDate}
                      </td>
                      <td className="py-3 px-5 text-right text-zinc-400 whitespace-nowrap font-mono">
                        {formatCurrency(obs.baseFare)}
                      </td>
                      <td className="py-3 px-5 text-right text-zinc-500 whitespace-nowrap font-mono">
                        {formatCurrency(obs.taxes)}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <span className={`font-semibold font-mono ${isAnomaly ? 'text-amber-400' : 'text-zinc-100'}`}>
                            {formatCurrency(obs.totalFare)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isAvailable
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {obs.status.replace('_', ' ')}
                          </span>
                          {isAnomaly && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Anomaly
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/5 bg-zinc-900/60 px-5 py-3 flex flex-wrap items-center justify-between text-xs text-zinc-500">
          <div>
            Showing <span className="font-semibold text-zinc-300">{displayedObservations.length}</span> of{' '}
            <span className="font-semibold text-zinc-300">{observations.length}</span> live observations
            {currentFilter !== 'all' && (
              <span className="text-indigo-400 ml-2 font-medium">({currentFilter} filter active)</span>
            )}
          </div>
          <div className="text-zinc-500 font-medium">
            Source: Live Postgres DB (via Playwright)
          </div>
        </div>
      </div>
    </div>
  );
}
