import React, { useState } from 'react';
import {
  simulateGetCurrentIndex,
  simulateGetIndexSeries,
  simulateGetRouteQuality,
  isDataLoaded,
  SIMULATION_LABEL,
  VALID_ROUTES,
  type ValidRoute,
  type SimulationResult,
} from '@/services/apiContract.ts';
import {
  Terminal,
  Play,
  Copy,
  CheckCircle2,
  Cpu,
  Clock,
  AlertCircle,
  ServerOff,
  Zap,
} from 'lucide-react';

type EndpointType = 'current' | 'series' | 'quality';

export function ApiExplorerPanel() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointType>('current');
  const [seriesDays, setSeriesDays] = useState<number>(30);
  const [selectedRoute, setSelectedRoute] = useState<ValidRoute>('DEL-BOM');
  const [copied, setCopied] = useState(false);

  // Initialize with real simulated response so user sees immediate live data
  const [lastResult, setLastResult] = useState<SimulationResult<unknown> | null>(() => {
    return simulateGetCurrentIndex();
  });

  const handleSimulateRequest = () => {
    let result: SimulationResult<unknown>;

    if (selectedEndpoint === 'current') {
      result = simulateGetCurrentIndex();
    } else if (selectedEndpoint === 'series') {
      result = simulateGetIndexSeries(seriesDays);
    } else {
      result = simulateGetRouteQuality(selectedRoute);
    }

    setLastResult(result);
  };

  const handleCopy = () => {
    if (!lastResult) return;
    navigator.clipboard.writeText(JSON.stringify(lastResult.response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const dataAvailable = isDataLoaded();

  return (
    <div className="w-full bg-[#0F0F11] border border-[#222] rounded p-4 sm:p-5 font-mono shadow-lg text-xs space-y-4">
      {/* HEADER WITH PROMINENT NO-NETWORK DISCLAIMER (VISIBLE WITHOUT SCROLLING) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#222]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-950/70 border border-emerald-500/30 rounded text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                Interactive Local API Explorer
              </h2>
              <span className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                In-Memory Simulation
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Execute live simulated queries against normalized state — 100% synchronous, zero network requests
            </p>
          </div>
        </div>

        {/* PROMINENT LABEL VISIBLE WITHOUT SCROLLING */}
        <div className="bg-[#15151C] border border-emerald-600/40 rounded p-2.5 max-w-md flex items-start gap-2 text-[11px] text-emerald-200/90 leading-tight">
          <ServerOff className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-300 font-bold block mb-0.5">ZERO NETWORK CALLS:</strong>
            {SIMULATION_LABEL}
          </div>
        </div>
      </div>

      {/* DATA NOT LOADED GUARD */}
      {!dataAvailable && (
        <div className="p-3 bg-amber-950/40 border border-amber-600/60 rounded text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Underlying airfare dataset has not been initialized. Please wait for memory fixtures to load.</span>
        </div>
      )}

      {/* REQUEST CONFIGURATION CONTROLS */}
      <div className="bg-[#141418] border border-[#262630] rounded p-3.5 space-y-3">
        <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
          1. Select Endpoint &amp; Parameters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedEndpoint('current')}
            className={`flex flex-col text-left p-2.5 rounded border transition ${
              selectedEndpoint === 'current'
                ? 'bg-[#1C1C26] border-indigo-500/70 text-white shadow'
                : 'bg-[#111115] border-[#222] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 rounded">GET</span>
              <span className="text-xs">/v1/index/current</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1">Latest APIx value &amp; anchor</span>
          </button>

          <button
            onClick={() => setSelectedEndpoint('series')}
            className={`flex flex-col text-left p-2.5 rounded border transition ${
              selectedEndpoint === 'series'
                ? 'bg-[#1C1C26] border-indigo-500/70 text-white shadow'
                : 'bg-[#111115] border-[#222] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 rounded">GET</span>
              <span className="text-xs">/v1/index/series</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1">30-day chained series</span>
          </button>

          <button
            onClick={() => setSelectedEndpoint('quality')}
            className={`flex flex-col text-left p-2.5 rounded border transition ${
              selectedEndpoint === 'quality'
                ? 'bg-[#1C1C26] border-indigo-500/70 text-white shadow'
                : 'bg-[#111115] border-[#222] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1 rounded">GET</span>
              <span className="text-xs">/v1/routes/{'{route}'}/quality</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1">Route DQS &amp; anomaly breakdown</span>
          </button>
        </div>

        {/* PARAMETERS SUB-BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1F1F28]">
          <div className="flex flex-wrap items-center gap-3">
            {selectedEndpoint === 'series' && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">Query Param [days]:</span>
                <select
                  value={seriesDays}
                  onChange={(e) => setSeriesDays(Number(e.target.value))}
                  className="bg-[#1A1A22] border border-[#333] text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={7}>7 days</option>
                  <option value={15}>15 days</option>
                  <option value={30}>30 days (full series)</option>
                </select>
              </div>
            )}

            {selectedEndpoint === 'quality' && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-xs">Path Param [route]:</span>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value as ValidRoute)}
                  className="bg-[#1A1A22] border border-[#333] text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {VALID_ROUTES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedEndpoint === 'current' && (
              <span className="text-zinc-400 text-[11px]">
                No additional parameters required for current index snapshot.
              </span>
            )}
          </div>

          {/* SIMULATE BUTTON */}
          <button
            onClick={handleSimulateRequest}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md hover:shadow-emerald-950/50 cursor-pointer active:translate-y-0.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate Request</span>
          </button>
        </div>
      </div>

      {/* SIMULATED RESPONSE DISPLAY PANEL */}
      {lastResult && (
        <div className="bg-[#141418] border border-[#262630] rounded p-4 space-y-3">
          {/* RESPONSE HEADER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#222]">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  lastResult.statusCode === 200
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                }`}
              >
                {lastResult.statusCode} OK
              </span>
              <span className="font-bold text-white text-xs">{lastResult.endpoint}</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              {/* VISIBLE HONEST COMPUTE TIME INDICATOR */}
              <div className="flex items-center gap-1 bg-[#1A1A24] border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>computed in {lastResult.computeTimeMs.toFixed(2)}ms</span>
              </div>

              <div className="flex items-center gap-1 text-zinc-400">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{lastResult.simulatedAt.slice(11, 19)} UTC</span>
              </div>
            </div>
          </div>

          {/* SIMULATED LOCAL RESPONSE CALLOUT BANNER */}
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-[11px]">
            <div className="flex items-center gap-2 text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-zinc-400 font-semibold">
                {SIMULATION_LABEL}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition px-2 py-0.5 rounded bg-zinc-850 hover:bg-zinc-750"
              title="Copy response JSON"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>

          {/* RESPONSE BODY PRE */}
          <div className="relative bg-[#0A0A0E] border border-[#222] rounded p-3 text-[11px] overflow-x-auto max-h-80">
            <pre className="text-emerald-400/95 whitespace-pre leading-relaxed">
              {JSON.stringify(lastResult.response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
