"use client";

import React from 'react';
import { BracketRound, Match } from '@/types/tournament';
import KnockoutFlow from './KnockoutFlow';
import LeagueFlow from './LeagueFlow';

type Props = {
  bracketData: BracketRound[];
  scheduledMatches: Match[];
  format?: 'round_robin' | 'league' | 'knockout' | string;
  rawOutput?: any;
  status?: { isLoading?: boolean; error?: string | null; success?: string | null };
};

export default function TournamentCard({ bracketData, scheduledMatches, format, rawOutput, status }: Props) {
  // fallback to rawOutput (API) if props are not populated
  const bracket = bracketData && bracketData.length > 0 ? bracketData : rawOutput?.schedule?.bracket ?? [];
  const scheduled = scheduledMatches && scheduledMatches.length > 0 ? scheduledMatches : rawOutput?.schedule?.current_round_schedule ?? rawOutput?.schedule?.schedule ?? [];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">Tournament Bracket</span>
        </div>
        {format && (
          <span className="text-xs px-2.5 py-1 rounded text-blue-400 bg-blue-500/10 font-medium">
            {format === 'knockout' ? 'Knockout' : format}
          </span>
        )}
      </div>

      <div className="bg-[#111] border border-slate-800 rounded-xl overflow-hidden">
        {status?.isLoading && (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm text-slate-500">Building bracket...</div>
          </div>
        )}
        
        {status?.error && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {status.error}
          </div>
        )}

        {!status?.isLoading && bracket && bracket.length > 0 ? (
          <div className="p-4">
            <KnockoutFlow bracket={bracket} />
          </div>
        ) : !status?.isLoading && (format === 'league' || format === 'round_robin') && scheduled && scheduled.length > 0 ? (
          <div className="p-4">
             <LeagueFlow matches={scheduled} />
          </div>
        ) : !status?.isLoading && !status?.error && (
          <div className="p-12 text-center text-slate-600 text-sm">
            No bracket data. Generate a schedule to see the bracket.
          </div>
        )}

        {/* Matches List */}
        {scheduled && scheduled.length > 0 && (
          <div className="p-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">Scheduled Matches</span>
              </div>
              <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">{scheduled.length} matches</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduled.map((m: any, idx: number) => {
                const teams = m.match ? m.match.split(' vs ') : [m.team1, m.team2];
                const team1 = teams[0] || 'TBD';
                const team2 = teams[1] || 'TBD';
                
                return (
                  <div 
                    key={m.match_id || m.match || `${m.team1}-${m.team2}-${idx}`} 
                    className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
                  >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          R{m.round || 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate max-w-[100px]">{m.venue}</span>
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                            {team1.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white flex-1 truncate">{team1}</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-[10px] text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded">VS</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                            {team2.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white flex-1 truncate">{team2}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-800/50">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-slate-400">{m.time_slot}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
