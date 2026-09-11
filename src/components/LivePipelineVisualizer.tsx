import React from 'react';
import { motion } from 'motion/react';
import { Globe, Cpu, LineChart, Server, Database } from 'lucide-react';

export function LivePipelineVisualizer() {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6 flex flex-col items-center">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light tracking-tight text-white mb-3">Live Indexing Engine</h2>
        <p className="text-zinc-500 font-medium tracking-wide">Continuous ingestion, normalization, and geometric scaling.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-0 relative">
        
        {/* Node 1: Sources */}
        <div className="flex flex-col items-center z-10 w-32">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-xl">
            <Globe className="w-6 h-6 text-zinc-400" />
          </div>
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Live OTAs</span>
          <span className="text-[10px] text-zinc-600 mt-1 text-center">Continuous Scraping</span>
        </div>

        {/* Animated Connecting Line 1 */}
        <div className="hidden md:flex flex-1 items-center justify-center relative h-16 -mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800 border-dashed"></div>
          </div>
          <motion.div 
            className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20 absolute"
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Node 2: Database / Pipeline */}
        <div className="flex flex-col items-center z-10 w-40">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
            <div className="w-20 h-20 rounded-2xl bg-black border border-blue-900/50 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(30,58,138,0.2)] relative z-10 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Database className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">AeroStat Core</span>
          <span className="text-[10px] text-zinc-600 mt-1 text-center">PostgreSQL &bull; IQR Cleaning</span>
        </div>

        {/* Animated Connecting Line 2 */}
        <div className="hidden md:flex flex-1 items-center justify-center relative h-16 -mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800 border-dashed"></div>
          </div>
          <motion.div 
            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] z-20 absolute"
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1.25 }}
          />
        </div>

        {/* Node 3: The Index */}
        <div className="flex flex-col items-center z-10 w-32">
          <div className="relative">
            <motion.div 
              className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-emerald-900/50 flex items-center justify-center mb-4 shadow-xl relative z-10">
              <LineChart className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">APIx</span>
          <span className="text-[10px] text-zinc-600 mt-1 text-center">Geometric Mean</span>
        </div>

      </div>
    </div>
  );
}
