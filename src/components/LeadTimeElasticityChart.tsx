import React, { useMemo, useState } from 'react';
import { getElasticitySeries } from '@/services/dataStore.ts';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, ArrowRight, Info } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function ElasticityTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-[#141418] border border-[#2F2F38] px-3.5 py-2.5 rounded shadow-xl font-mono text-xs text-white space-y-2">
      <div className="text-zinc-400 font-bold border-b border-[#2A2A35] pb-1">
        Lead Time: <span className="text-white">{label}</span>
      </div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-zinc-300 font-semibold">{entry.name}:</span>
            </div>
            <span className="font-bold text-white">
              ₹{Number(entry.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeadTimeElasticityChart() {
  const rawSeries = useMemo(() => getElasticitySeries(), []);
  const [sortOrder, setSortOrder] = useState<'approaching' | 'numeric'>('approaching');

  // "approaching" orders 45d -> 30d -> 15d -> 7d -> 1d so price rises from left-to-right as departure approaches
  const displayData = useMemo(() => {
    const list = [...rawSeries];
    if (sortOrder === 'approaching') {
      return list.reverse().map((item) => ({
        ...item,
        displayLabel: item.leadTimeDays === 1 ? '1d (Dept Eve)' : `${item.leadTimeDays}d`,
      }));
    }
    return list.map((item) => ({
      ...item,
      displayLabel: item.leadTimeDays === 1 ? '1d (Dept Eve)' : `${item.leadTimeDays}d`,
    }));
  }, [rawSeries, sortOrder]);

  return (
    <div className="w-full h-full p-4 sm:p-5 font-mono text-xs space-y-4 flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                Lead-Time Elasticity Curve
              </h2>
              <span className="bg-emerald-950/50 border border-emerald-600/60 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                LIVE BACKEND
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Average total fare escalation across 1, 7, 15, 30, and 45-day advance purchase windows
            </p>
          </div>
        </div>

        {/* ORDER TOGGLE */}
        <div className="flex items-center gap-1.5 bg-[#14141A] p-1 rounded border border-[#222]">
          <button
            type="button"
            onClick={() => setSortOrder('approaching')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              sortOrder === 'approaching'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>45d → 1d (Approaching Departure)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setSortOrder('numeric')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              sortOrder === 'numeric'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            1d → 45d (Ascending)
          </button>
        </div>
      </div>

      {/* RECHARTS ELASTICITY LINE CHART */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="displayLabel"
              stroke="#52525B"
              tick={{ fontSize: 10, fill: '#71717A' }}
              dy={6}
            />
            <YAxis
              stroke="#52525B"
              tick={{ fontSize: 10, fill: '#71717A' }}
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              domain={[2000, 18000]}
              width={45}
            />
            <Tooltip content={<ElasticityTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              formatter={(value) => <span className="text-zinc-300 font-bold mr-3">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="DEL-BLR"
              name="DEL-BLR"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#10B981', stroke: '#064E3B' }}
              activeDot={{ r: 6, fill: '#34D399', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="DEL-BOM"
              name="DEL-BOM"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#3B82F6', stroke: '#1E3A8A' }}
              activeDot={{ r: 6, fill: '#60A5FA', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="BOM-BLR"
              name="BOM-BLR"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#F59E0B', stroke: '#78350F' }}
              activeDot={{ r: 6, fill: '#FBBF24', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER CALLOUT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#222] text-[10px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            Elasticity curves reflect average fare escalation: DEL-BLR fares increase by +277% from 45-day advance (₹4,305) to eve-of-departure (₹16,244).
          </span>
        </div>
        <div className="text-zinc-400">
          DEL-BOM: +266% • BOM-BLR: +248%
        </div>
      </div>
    </div>
  );
}
