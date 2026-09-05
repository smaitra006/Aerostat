import React, { useState } from 'react';
import type { PipelineHealthResult } from '@/services/healthCheck.ts';
import { AlertTriangle, X } from 'lucide-react';

interface HealthCheckBannerProps {
  healthResult: PipelineHealthResult;
}

export function HealthCheckBanner({ healthResult }: HealthCheckBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Silent & completely hidden if the pipeline is healthy or dismissed
  if (healthResult.healthy || dismissed) {
    return null;
  }

  const failedChecks = healthResult.checks.filter((c) => !c.passed);

  return (
    <div
      role="alert"
      className="w-full bg-rose-950/90 border-b border-rose-600/80 text-rose-100 px-4 sm:px-6 py-3 font-mono text-xs shadow-md transition-all animate-in fade-in"
    >
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white tracking-wide flex items-center gap-2">
              <span>PIPELINE HEALTH WARNING:</span>
              <span className="text-rose-300 font-normal">
                {failedChecks.length} invariant check(s) failed at runtime
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200/90">
              {failedChecks.map((check) => (
                <li key={check.name}>
                  <strong className="text-rose-100">{check.name}:</strong>{' '}
                  <span className="text-rose-300">{check.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-900/60 transition shrink-0 cursor-pointer"
          aria-label="Dismiss health check warning"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
