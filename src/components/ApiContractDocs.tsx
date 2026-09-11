import React, { useState, useMemo } from 'react';
import {
  API_VERSION_TAG,
  API_CONTRACT_NOTE,
  getApiContractExamples,
} from '@/services/apiContract.ts';
import {
  FileCode,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronRight,
  Info,
  ServerOff,
} from 'lucide-react';

interface EndpointDoc {
  id: 'current' | 'series' | 'quality';
  method: 'GET';
  path: string;
  description: string;
  queryParams?: Array<{ name: string; type: string; required: boolean; default?: string; desc: string }>;
  pathParams?: Array<{ name: string; type: string; required: boolean; desc: string }>;
  exampleResponse: unknown;
}

export function ApiContractDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'current' | 'series' | 'quality'>('current');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    current: true,
    series: false,
    quality: false,
  });

  const realExamples = useMemo(() => getApiContractExamples(), []);

  const endpoints: EndpointDoc[] = [
    {
      id: 'current',
      method: 'GET',
      path: '/v1/index/current',
      description:
        'Returns the latest computed APIx airfare index value, base period anchor, calculation methodology, and period-over-period percentage change.',
      exampleResponse: realExamples.currentIndex,
    },
    {
      id: 'series',
      method: 'GET',
      path: '/v1/index/series',
      description:
        'Retrieves the chronological 30-day chain-linked weighted geometric index time series, formatted for downstream charting and econometric modeling.',
      queryParams: [
        {
          name: 'days',
          type: 'integer',
          required: false,
          default: '30',
          desc: 'Number of trailing calendar periods to return (1 to 30).',
        },
      ],
      exampleResponse: realExamples.indexSeries,
    },
    {
      id: 'quality',
      method: 'GET',
      path: '/v1/routes/{route}/quality',
      description:
        'Returns the Data Quality Score (DQS), IQR price anomaly counts, sold-out exclusions, and deduction breakdowns for a specific monitored route sector.',
      pathParams: [
        {
          name: 'route',
          type: 'string',
          required: true,
          desc: 'City-pair sector code formatted as ORIGIN-DEST (e.g. DEL-BOM, DEL-BLR, BOM-BLR).',
        },
      ],
      exampleResponse: realExamples.routeQuality,
    },
  ];

  const activeDoc = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  const handleCopyJson = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full h-full p-4 sm:p-5 font-mono text-xs space-y-4 flex flex-col">
      {/* HEADER WITH VERSION AND EXPLICIT DISCLAIMER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#222]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-950/70 border border-indigo-500/30 rounded text-indigo-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                REST API Specification
              </h2>
              <span className="bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                {API_VERSION_TAG}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Production schema specification for downstream airfare index consumers
            </p>
          </div>
        </div>

        {/* PROMINENT MANDATORY DISCLAIMER - VISIBLE WITHOUT SCROLLING */}
        <div className="bg-[#15151C] border border-amber-500/40 rounded p-2.5 max-w-md flex items-start gap-2 text-[11px] text-amber-200/90 leading-tight">
          <ServerOff className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">NO NETWORK REQUESTS:</strong>
            {API_CONTRACT_NOTE}
          </div>
        </div>
      </div>

      {/* ENDPOINT SELECTOR TABS */}
      <div className="flex flex-wrap gap-2 pt-1">
        {endpoints.map((ep) => {
          const isSelected = selectedEndpoint === ep.id;
          return (
            <button
              key={ep.id}
              onClick={() => setSelectedEndpoint(ep.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors border ${
                isSelected
                  ? 'bg-[#1C1C24] border-indigo-500/60 text-white font-bold shadow'
                  : 'bg-[#121216] border-[#222] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span className="bg-emerald-950 border border-emerald-600/60 text-emerald-400 px-1.5 py-0.2 rounded text-[10px] font-bold">
                {ep.method}
              </span>
              <span>{ep.path}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE ENDPOINT DOCUMENTATION DETAILS */}
      <div className="bg-[#141418] border border-[#262630] rounded p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-950 border border-emerald-600/60 text-emerald-300 px-2 py-0.5 rounded text-xs font-bold">
              {activeDoc.method}
            </span>
            <span className="text-white font-bold text-sm tracking-wide">
              {activeDoc.path}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500">
            Content-Type: application/json; charset=utf-8
          </span>
        </div>

        <p className="text-zinc-300 text-xs leading-relaxed">
          {activeDoc.description}
        </p>

        {/* PARAMETERS SECTION */}
        {(activeDoc.queryParams || activeDoc.pathParams) && (
          <div className="space-y-2 pt-2 border-t border-[#222]">
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Request Parameters
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-[#262630] text-zinc-500 font-bold">
                    <th className="py-1 px-2">Param</th>
                    <th className="py-1 px-2">Type</th>
                    <th className="py-1 px-2">In</th>
                    <th className="py-1 px-2">Required</th>
                    <th className="py-1 px-2">Default</th>
                    <th className="py-1 px-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F28] text-zinc-300">
                  {activeDoc.pathParams?.map((p) => (
                    <tr key={p.name}>
                      <td className="py-1 px-2 font-bold text-cyan-400">{p.name}</td>
                      <td className="py-1 px-2 text-zinc-400">{p.type}</td>
                      <td className="py-1 px-2 text-indigo-400">path</td>
                      <td className="py-1 px-2 text-amber-400 font-bold">Yes</td>
                      <td className="py-1 px-2 text-zinc-500">-</td>
                      <td className="py-1 px-2 text-zinc-300">{p.desc}</td>
                    </tr>
                  ))}
                  {activeDoc.queryParams?.map((p) => (
                    <tr key={p.name}>
                      <td className="py-1 px-2 font-bold text-cyan-400">{p.name}</td>
                      <td className="py-1 px-2 text-zinc-400">{p.type}</td>
                      <td className="py-1 px-2 text-indigo-400">query</td>
                      <td className="py-1 px-2 text-zinc-400">{p.required ? 'Yes' : 'No'}</td>
                      <td className="py-1 px-2 text-amber-300 font-bold">{p.default || '-'}</td>
                      <td className="py-1 px-2 text-zinc-300">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EXAMPLE RESPONSE (GENERATED FROM REAL CURRENT STATE) */}
        <div className="space-y-1.5 pt-2 border-t border-[#222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              <span>Example Response</span>
              <span className="text-emerald-400">(Dynamic: Generated from live app state)</span>
            </div>
            <button
              onClick={() => handleCopyJson(activeDoc.exampleResponse)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 transition"
              title="Copy JSON to clipboard"
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

          <div className="relative bg-[#0A0A0E] border border-[#222] rounded p-3 text-[11px] overflow-x-auto max-h-72">
            <pre className="text-emerald-400/90 whitespace-pre">
              {JSON.stringify(activeDoc.exampleResponse, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
