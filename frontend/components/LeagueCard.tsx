"use client";

import React from 'react';

type Props = {
  rawOutput?: any;
  status?: { isLoading?: boolean; error?: string | null; success?: string | null };
  format?: string;
};

export default function LeagueCard({ rawOutput, status, format }: Props) {
  const leagueRaw: any[] | null = rawOutput?.schedule?.schedule ?? null;

  const groupedByDate: Record<string, any[]> | null = leagueRaw
    ? leagueRaw.reduce((acc: Record<string, any[]>, m: any) => {
        const date = (m.time_slot || '').split(' - ')[0] || 'TBD';
        if (!acc[date]) acc[date] = [];
        acc[date].push(m);
        return acc;
      }, {})
    : null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-white block">🏏 Double League Schedule</label>
        {format ? (
          <span className="text-xs px-3 py-1 rounded-full bg-white/6 text-white border border-slate-700">
            {format === 'league' ? 'Double League' : format}
          </span>
        ) : null}
      </div>

      <div className="theme-panel border rounded-lg p-4 text-white">
        {status?.isLoading ? <div className="text-sm theme-muted">Generating...</div> : null}
        {status?.error ? <div className="text-sm text-red-400 mb-3">{status.error}</div> : null}
        {status?.success ? <div className="text-sm text-green-400 mb-3">{status.success}</div> : null}

        {groupedByDate ? (
          <div className="grid gap-4">
            {Object.keys(groupedByDate)
              .sort()
              .map((date) => (
                <div key={date} className="theme-card border rounded-lg p-3">
                  <div className="text-sm font-bold text-white mb-2">{date}</div>
                  <div className="flex flex-col gap-3">
                    {groupedByDate[date].map((m: any, idx: number) => (
                      <div key={`${date}-${idx}`} className="theme-card border rounded-md p-3 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold text-white">{m.match}</div>
                          <div className="text-xs theme-muted">
                            {m.time_slot.includes(' - ') ? m.time_slot.split(' - ')[1] : m.time_slot} • {m.venue}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No league schedule available.</div>
        )}

        {/* <div className="mt-6">
          <div className="text-sm font-semibold text-white mb-2">🔽 Raw Output</div>
          <div className="theme-card border rounded-md p-3">
            <pre className="whitespace-pre-wrap font-mono text-xs max-h-72 overflow-auto text-white">
{JSON.stringify(rawOutput ?? {}, null, 2)}
            </pre>
          </div>
        </div> */}
      </div>
    </div>
  );
}
