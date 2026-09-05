import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { fetchTickerData } from '../services/apiClient';

export function LiveDataTicker() {
  const [routes, setRoutes] = useState([
    { route: 'Loading...', price: '₹--', change: 0 },
  ]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const res = await fetchTickerData();
        if (isMounted && res.status === 'success' && res.data) {
          setRoutes(res.data);
        }
      } catch (error) {
        console.error('Failed to load ticker data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full bg-zinc-900/60 border-b border-white/5 backdrop-blur-md overflow-hidden flex items-center h-12 px-4 sm:px-6 text-sm font-sans select-none relative z-40">
      <div className="flex items-center gap-2 text-indigo-400 font-bold mr-6 shrink-0 border-r border-white/10 pr-6">
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="uppercase tracking-widest text-[11px] font-bold">Live Scraping</span>
      </div>
      
      {/* Ticker Animation */}
      <div className="flex-1 overflow-hidden relative mask-image-edges">
        <div className="flex gap-10 whitespace-nowrap animate-marquee">
          {/* Double the list to create a seamless loop */}
          {[...routes, ...routes].map((item, i) => {
            const isPos = item.change > 0;
            const isNeg = item.change < 0;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className="font-semibold text-zinc-300">{item.route}</span>
                <span className="text-white font-bold font-mono">{item.price}</span>
                {item.change !== 0 ? (
                  <span className={`text-xs font-bold font-mono ${isPos ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ({isPos ? '+' : ''}{item.change}%)
                  </span>
                ) : (
                  <span className="text-xs font-bold font-mono text-zinc-500">(0.0%)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .mask-image-edges {
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
      `}</style>
    </div>
  );
}
