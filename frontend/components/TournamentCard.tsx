"use client";

import React from 'react';
import { BracketRound, Match } from '@/types/tournament';
import KnockoutFlow from './KnockoutFlow';

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
  const totalRounds = rawOutput?.schedule?.total_rounds ?? (bracket ? bracket.length : undefined);
  const totalTeams = rawOutput?.schedule?.total_teams ?? undefined;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <label className="text-xl font-bold text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm shadow-lg shadow-blue-500/20">🏆</span>
          Tournament Bracket
        </label>
        {format ? (
          <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
            {format === 'knockout' ? 'Knockout Stage' : format}
          </span>
        ) : null}
      </div>

      <div className="theme-panel border rounded-3xl p-1 text-white bg-slate-900/40 backdrop-blur-xl">
        {status?.isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <div className="text-sm text-slate-400 font-medium">Architecting Bracket...</div>
          </div>
        ) : null}
        
        {status?.error ? <div className="p-6 text-sm text-red-400 bg-red-500/5 rounded-2xl m-3 border border-red-500/10">{status.error}</div> : null}

        {!status?.isLoading && bracket && bracket.length > 0 ? (
          <div className="p-2">
            <KnockoutFlow bracket={bracket} />
          </div>
        ) : !status?.isLoading && (
          <div className="p-12 text-center text-slate-500 text-sm">
            No bracket data available. Try generating a schedule.
          </div>
        )}

        <div className="p-6 bg-slate-900/50 rounded-b-[22px] border-t border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Upcoming Matches
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              {scheduled?.length || 0} Matches Total
            </div>
          </div>

          {scheduled && scheduled.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduled.map((m: any, idx: number) => (
                <div key={m.match_id || m.match || `${m.team1}-${m.team2}-${idx}`} className="group bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 p-4 rounded-2xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-bold text-blue-500/80 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                      Round {m.round || 1}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded-md">
                      {m.venue}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {m.match || `${m.team1} vs ${m.team2}`}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="opacity-50">📅</span>
                    {m.time_slot}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic py-4">No scheduled matches yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
