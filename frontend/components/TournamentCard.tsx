"use client";

import React from 'react';
import { BracketRound, Match } from '@/types/tournament';

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
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-white block">🏏 Knockout Bracket</label>
        {format ? (
          <span className="text-xs px-3 py-1 rounded-full bg-white/6 text-white border border-slate-700">
            {format === 'round_robin' ? 'League Stage' : format === 'league' ? 'Double League' : format === 'knockout' ? 'Knockout Stage' : format}
          </span>
        ) : null}
      </div>
      <div className="theme-panel border rounded-lg p-4 text-white">
        {status?.isLoading ? <div className="text-sm theme-muted">Generating...</div> : null}
        {status?.error ? <div className="text-sm text-red-400 mb-3">{status.error}</div> : null}
        {status?.success ? <div className="text-sm text-green-400 mb-3">{status.success}</div> : null}

        {(typeof totalRounds !== 'undefined' || typeof totalTeams !== 'undefined') && (
          <div className="text-xs text-slate-300 mb-3 flex gap-4">
            {typeof totalRounds !== 'undefined' ? <div>Total rounds: <span className="font-semibold text-slate-100">{totalRounds}</span></div> : null}
            {typeof totalTeams !== 'undefined' ? <div>Total teams: <span className="font-semibold text-slate-100">{totalTeams}</span></div> : null}
          </div>
        )}

        <div className="overflow-x-auto py-2">
          <div className="flex gap-4 items-start">
            {bracket && bracket.length > 0 ? (
              bracket.map((round: any) => (
                <div key={round.round} className="min-w-[260px] theme-card border rounded-lg p-3">
                  <div className="text-sm font-bold text-white mb-2">Round {round.round} — {round.total_matches} match{round.total_matches !== 1 ? 'es' : ''}</div>
                  <div className="flex flex-col gap-3">
                    {round.matches.map((m: any) => (
                      <div key={`${round.round}-${m.match_id}`} className="theme-card border rounded-md p-3">
                        <div className="text-sm font-semibold text-white">{m.match}</div>
                        <div className="text-xs theme-muted mt-1">{m.team1} • {m.team2}</div>
                        <div className="text-xs theme-muted mt-2">{m.time_slot}</div>
                        <div className="text-xs theme-muted">{m.venue}</div>
                        {m.from_matches && (m.from_matches.winner_1 || m.from_matches.winner_2) ? (
                          <div className="text-xs theme-muted mt-2 italic">From: {m.from_matches.winner_1 || ''}{m.from_matches.winner_1 && m.from_matches.winner_2 ? ' & ' : ''}{m.from_matches.winner_2 || ''}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm theme-muted">No bracket data available.</div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-200 mb-2">📅 Scheduled Matches</div>
            {scheduled && scheduled.length > 0 ? (
            <div className="grid gap-3">
              {scheduled.map((m: any) => (
                <div key={m.match_id || m.match || `${m.team1}-${m.team2}`} className="theme-card border rounded-md p-3 flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-white">{m.match || `${m.team1} vs ${m.team2}`}</div>
                    <div className="text-xs theme-muted">{m.time_slot}</div>
                    <div className="text-xs theme-muted">{m.venue}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-400">No scheduled matches yet.</div>
          )}
        </div>
{/* 
        <div className="mt-6">
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
