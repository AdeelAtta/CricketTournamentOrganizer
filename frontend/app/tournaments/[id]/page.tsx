'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournamentsStore } from '@/store/tournaments';
import TournamentForm from '@/components/TournamentForm';
import { Match, BracketRound } from '@/types/tournament';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  
  const { getTournament, saveSchedule, saveBracket } = useTournamentsStore();
  const tournament = getTournament(tournamentId);

  const handleScheduleGenerated = useCallback((data: {
    format: 'round_robin' | 'league' | 'knockout';
    schedule?: Match[];
    bracket?: BracketRound[];
    rawOutput?: any;
  }) => {
    if (data.format === 'knockout' && data.bracket) {
      saveBracket(tournamentId, data.bracket, data.rawOutput);
    } else if (data.schedule) {
      saveSchedule(tournamentId, data.schedule, data.format, data.rawOutput);
    }
  }, [tournamentId, saveSchedule, saveBracket]);

  if (!tournament) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Tournament not found</h2>
          <p className="text-slate-500 text-sm mb-6">This tournament may have been deleted</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Tournament Header */}
      <div className="border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-white truncate">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-sm text-slate-500 truncate">{tournament.description}</p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-medium ${
            tournament.status === 'draft' ? 'bg-amber-500/10 text-amber-500' :
            tournament.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
            tournament.status === 'in_progress' ? 'bg-emerald-500/10 text-emerald-400' :
            'bg-slate-500/10 text-slate-400'
          }`}>
            {tournament.status === 'in_progress' ? 'In Progress' : tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Existing Tournament Form */}
      <TournamentForm 
        tournamentId={tournamentId}
        initialSchedule={tournament.schedule}
        initialBracket={tournament.bracket}
        initialRawOutput={tournament.rawOutput}
        initialFormat={tournament.format}
        onScheduleGenerated={handleScheduleGenerated} 
      />
    </main>
  );
}
