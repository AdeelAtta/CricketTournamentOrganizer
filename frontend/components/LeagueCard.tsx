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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">Double League Schedule</span>
        </div>
        {format && (
          <span className="text-xs px-2.5 py-1 rounded text-purple-400 bg-purple-500/10 font-medium">
            {format === 'league' ? 'Double League' : format}
          </span>
        )}
      </div>

      <div className="bg-[#111] border border-slate-800 rounded-xl overflow-hidden">
        {status?.isLoading && (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-purple-400 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-slate-500">Generating schedule...</div>
          </div>
        )}
        
        {status?.error && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {status.error}
          </div>
        )}

        {groupedByDate ? (
          <div className="divide-y divide-slate-800/50">
            {Object.keys(groupedByDate)
              .sort()
              .map((date) => (
                <div key={date} className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-white">{date}</span>
                    <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full ml-auto">{groupedByDate[date].length} matches</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedByDate[date].map((m: any, idx: number) => {
                      const teams = m.match ? m.match.split(' vs ') : ['TBD', 'TBD'];
                      const team1 = teams[0] || 'TBD';
                      const team2 = teams[1] || 'TBD';
                      
                      return (
                        <div key={`${date}-${idx}`} className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-slate-800/80 hover:border-purple-500/30 rounded-xl overflow-hidden transition-all duration-300">
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              {/* Team 1 */}
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
                                  {team1.substring(0, 3).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-white truncate">{team1}</span>
                              </div>
                              
                              {/* VS Badge */}
                              <div className="px-3">
                                <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-1 rounded-md font-medium">VS</span>
                              </div>
                              
                              {/* Team 2 */}
                              <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
                                <span className="text-sm font-medium text-white truncate text-right">{team2}</span>
                                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-purple-400 shrink-0">
                                  {team2.substring(0, 3).toUpperCase()}
                                </div>
                              </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate max-w-[120px]">{m.venue}</span>
                              </div>
                              <span className="text-xs text-slate-600">
                                {m.time_slot.includes(' - ') ? m.time_slot.split(' - ')[1] : m.time_slot}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        ) : !status?.isLoading && (
          <div className="p-8 text-center text-sm text-slate-600">No schedule available</div>
        )}
      </div>
    </div>
  );
}
