'use client';

import { useTournamentStore } from '@/store/tournament';
import TournamentForm from '@/components/TournamentForm';

export default function Home() {
  const { scheduledMatches, bracketData, error, success, isLoading } = useTournamentStore();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <TournamentForm />

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 text-center">
            <div className="animate-spin inline-flex mb-4">⚙️</div>
            <p className="text-white font-semibold">Generating tournament schedule...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-8 right-8 max-w-md bg-red-600/90 backdrop-blur rounded-xl p-6 text-white shadow-lg animate-pulse z-50">
          <p className="font-semibold mb-2">❌ Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="fixed bottom-8 right-8 max-w-md bg-green-600/90 backdrop-blur rounded-xl p-6 text-white shadow-lg z-50">
          <p className="font-semibold mb-2">✅ Success</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* {(scheduledMatches.length > 0 || bracketData.length > 0) && (
        <div className="max-w-5xl mx-auto p-8">
          <div className="bg-slate-700/50 backdrop-blur rounded-2xl border border-slate-600 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Tournament Schedule Generated</h2>
            <p className="text-slate-300">
              {bracketData.length > 0 ? `Knockout bracket with ${bracketData.length} rounds created` : `${scheduledMatches.length} matches scheduled`}
            </p>
          </div>
        </div>
      )} */}
    </main>
  );
}
           
