import React, { useState, useEffect } from 'react';
import { Bot, Zap, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchScraperHealth, triggerLiveScrape } from '@/services/apiClient';

export function ScraperHealthPanel() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = () => {
      fetchScraperHealth().then(res => {
        if (isMounted && res.status === 'success') {
          setNodes(res.data);
        }
      }).catch(err => console.error(err));
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleTrigger = async () => {
    setIsScraping(true);
    try {
      await triggerLiveScrape();
      window.location.reload(); 
    } catch (e) {
      console.error(e);
    }
    setIsScraping(false);
  };

  return (
    <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-5 shadow-lg font-sans space-y-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wider text-white uppercase">
                Scraping Node Monitor
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Live Playwright Chromium Instances
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
          <div className="flex items-center gap-2 bg-zinc-800/60 border border-white/5 px-3 py-1.5 rounded-lg shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">System Nominal</span>
          </div>
          <button 
            onClick={handleTrigger}
            disabled={isScraping}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-md shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
            {isScraping ? 'Scraping...' : 'Force Live Scrape'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {nodes.map((node) => (
          <div key={node.id} className="bg-zinc-800/40 border border-white/5 rounded-xl p-3 flex flex-col gap-3 shadow-inner hover:bg-zinc-800/60 transition-colors">
            <div className="flex justify-between items-start">
              <div className="font-bold text-zinc-200 text-xs">{node.name}</div>
              {node.status === 'healthy' ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-medium flex items-center gap-1"><Zap className="w-3 h-3"/> Latency</span>
                <span className={`font-semibold font-mono ${node.latency > 300 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {node.latency}ms
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-500 font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Last Scrape</span>
                <span className="text-zinc-300 font-semibold font-mono">{node.lastScrape}s ago</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
