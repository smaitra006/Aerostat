import React, { useMemo } from 'react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Calendar, Info } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      indexValue: number;
      baseValue: number;
    };
  }>;
}

function IndexTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const pctChange = ((data.indexValue - 100) / 100) * 100;
  const isPositive = pctChange >= 0;

  return (
    <div className="bg-[#141418] border border-[#2F2F38] px-3.5 py-2.5 rounded shadow-xl font-mono text-xs text-white space-y-1">
      <div className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
        <Calendar className="w-3.5 h-3.5 text-blue-400" />
        <span>{data.date}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-zinc-300">Index Value:</span>
        <span className="text-base font-bold text-blue-400">{data.indexValue.toFixed(2)}</span>
      </div>
      <div className="text-[11px] flex items-center gap-1">
        <span className="text-zinc-400">Delta vs Base (100.00):</span>
        <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}
          {pctChange.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export function IndexTrendChart() {
  const [series, setSeries] = React.useState<Array<{date: string, indexValue: number, baseValue: number}>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    import('@/services/apiClient.ts').then(({ fetchIndexSeries }) => {
      fetchIndexSeries(30).then((res) => {
        setSeries(res.data.series);
        setIsLoading(false);
      });
    });
  }, []);

  const { minVal, maxVal, latestVal, baseDate, latestDate } = useMemo(() => {
    if (series.length === 0) {
      return { minVal: 100, maxVal: 100, latestVal: 100, baseDate: '', latestDate: '' };
    }
    const values = series.map((s) => s.indexValue);
    return {
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
      latestVal: series[series.length - 1].indexValue,
      baseDate: series[0].date,
      latestDate: series[series.length - 1].date,
    };
  }, [series]);

  const pctTotal = ((latestVal - 100) / 100) * 100;

  return (
    <div className="w-full bg-[#0F0F11] border border-[#222] rounded p-4 sm:p-5 font-mono shadow-lg text-xs space-y-4">
      {/* HEADER WITH LIVE BACKEND BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-950/60 border border-blue-500/30 rounded text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                APIx 30-Period Index Trend
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
              Chain-linked weighted geometric mean ({baseDate} → {latestDate})
            </p>
          </div>
        </div>

        {/* STAT PILLS */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <div className="bg-[#1A1A22] border border-[#2B2B38] px-2.5 py-1 rounded flex items-center gap-1.5">
            <span className="text-zinc-400">Base (t=0):</span>
            <span className="font-bold text-zinc-200">100.00</span>
          </div>
          <div className="bg-[#1A1A22] border border-[#2B2B38] px-2.5 py-1 rounded flex items-center gap-1.5">
            <span className="text-zinc-400">Latest (t=29):</span>
            <span className="font-bold text-blue-400">{latestVal.toFixed(2)}</span>
            <span className={`text-[10px] font-bold ${pctTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({pctTotal >= 0 ? '+' : ''}{pctTotal.toFixed(2)}%)
            </span>
          </div>
          <div className="bg-[#1A1A22] border border-[#2B2B38] px-2.5 py-1 rounded flex items-center gap-1.5 text-zinc-400">
            <span>Range:</span>
            <span className="text-zinc-200 font-semibold">{minVal.toFixed(2)} - {maxVal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* RECHARTS LINE CHART */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#52525B"
              tick={{ fontSize: 10, fill: '#71717A' }}
              tickFormatter={(d: string) => d.slice(5)} // Show MM-DD
              dy={6}
            />
            <YAxis
              domain={[Math.floor(minVal) - 1, Math.ceil(maxVal) + 1]}
              stroke="#52525B"
              tick={{ fontSize: 10, fill: '#71717A' }}
              tickFormatter={(v: number) => v.toFixed(1)}
              width={40}
            />
            <Tooltip content={<IndexTooltip />} />
            <ReferenceLine
              y={100}
              stroke="#4B5563"
              strokeDasharray="4 4"
              label={{
                value: 'Base = 100.00',
                fill: '#9CA3AF',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            <Line
              type="monotone"
              dataKey="indexValue"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#3B82F6', stroke: '#1E3A8A' }}
              activeDot={{ r: 5, fill: '#60A5FA', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              name="APIx Index"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER NOTE */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#222] text-[10px] text-zinc-500">
        <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span>
          Horizontal reference marks the base period (100.00 on {baseDate}). Values reflect 30 daily chain-linked price ratios weighted by DGCA passenger volumes.
        </span>
      </div>
    </div>
  );
}
