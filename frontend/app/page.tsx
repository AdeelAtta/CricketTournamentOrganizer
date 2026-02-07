'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentsStore, Tournament } from '@/store/tournaments';

export default function Home() {
  const router = useRouter();
  const { tournaments, addTournament, deleteTournament } = useTournamentsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
  });

  const handleCreateTournament = () => {
    if (!newTournament.name.trim()) return;
    
    const id = addTournament({
      name: newTournament.name,
      description: newTournament.description,
      format: 'knockout', // Default format, user selects in scheduler
    });
    
    setShowCreateModal(false);
    setNewTournament({ name: '', description: '' });
    router.push(`/tournaments/${id}`);
  };

  // Show landing page when no tournaments
  if (tournaments.length === 0) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative">
          {/* Navigation */}
          <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <span className="text-lg">🏏</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">CricketScheduler</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Create Tournament
            </button>
          </nav>

          {/* Hero */}
          <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-8">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Now with AI-powered scheduling
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Tournament scheduling,
              <br />
              <span className="text-slate-500">simplified.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto mb-12 leading-relaxed">
              From 4 teams to 64. Knockout to round-robin. 
              Create professional tournament brackets in under a minute.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-100 transition-all text-base"
              >
                Create tournament
              </button>
              {/* <button className="w-full sm:w-auto px-8 py-4 text-slate-400 hover:text-white font-medium transition-colors text-base flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch demo
              </button> */}
            </div>
          </div>

          {/* Product Preview */}
          <div className="max-w-5xl mx-auto px-6 pb-24">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-50" />
              
              {/* Preview card */}
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full max-w-md mx-auto h-7 bg-slate-800 rounded-lg" />
                  </div>
                </div>
                
                {/* Mock schedule UI */}
                <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Match cards preview */}
                    {[
                      { t1: 'India', t2: 'Australia', venue: 'Mumbai', date: 'Mar 15' },
                      { t1: 'England', t2: 'Pakistan', venue: 'London', date: 'Mar 16' },
                      { t1: 'South Africa', t2: 'New Zealand', venue: 'Cape Town', date: 'Mar 17' },
                    ].map((match, i) => (
                      <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="text-xs text-slate-500 mb-3">Match {i + 1} • {match.date}</div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">{match.t1}</span>
                          <span className="text-slate-600 text-xs">vs</span>
                          <span className="font-medium text-sm">{match.t2}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {match.venue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features - minimal */}
          <div className="max-w-5xl mx-auto px-6 py-24 border-t border-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              <div>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Every format</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Knockout, round-robin, league, or hybrid. Configure exactly how you want.
                </p>
              </div>
              
              <div>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant generation</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  AI handles rest days, venue rotation, and travel constraints automatically.
                </p>
              </div>
              
              <div>
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Live brackets</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Beautiful interactive brackets. Update results and share with your community.
                </p>
              </div>
            </div>
          </div>

          {/* Social proof - minimal */}
          {/* <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center md:text-left">
              <div>
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm text-slate-500">Tournaments created</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-slate-800" />
              <div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-slate-500">Matches scheduled</div>
              </div>
              <div className="hidden md:block w-px h-12 bg-slate-800" />
              <div>
                <div className="text-3xl font-bold">120+</div>
                <div className="text-sm text-slate-500">Countries</div>
              </div>
            </div>
          </div> */}

          {/* Final CTA */}
          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start organizing today</h2>
            <p className="text-slate-500 mb-8">No account required. Your data stays on your device.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-100 transition-all"
            >
              Create your first tournament
            </button>
          </div>

          {/* Footer */}
          <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-slate-900">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span>🏏</span>
                <span>CricketScheduler</span>
              </div>
              <div className="flex items-center gap-6">
                <span>Privacy</span>
                <span>Terms</span>
                <span>GitHub</span>
              </div>
            </div>
          </footer>
        </div>

        {/* Create Tournament Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
            <div className="bg-[#1a1a1a] border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-white mb-1">New tournament</h2>
              <p className="text-sm text-slate-500 mb-6">Give your tournament a name to get started</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    placeholder="Premier League 2026"
                    autoFocus
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Description <span className="text-slate-600">(optional)</span></label>
                  <textarea
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                    placeholder="Add some context about your tournament..."
                    rows={2}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTournament}
                  disabled={!newTournament.name.trim()}
                  className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Dashboard view when tournaments exist
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-sm">🏏</span>
            </div>
            <span className="font-semibold tracking-tight">CricketScheduler</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Tournaments</h1>
          <p className="text-slate-500 text-sm">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-[#111] border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-[#151515] transition-all group cursor-pointer"
              onClick={() => router.push(`/tournaments/${tournament.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white truncate">
                    {tournament.name}
                  </h3>
                  {tournament.description && (
                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">{tournament.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this tournament?')) {
                      deleteTournament(tournament.id);
                    }
                  }}
                  className="ml-2 p-1.5 text-slate-600 hover:text-red-400 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  tournament.status === 'draft' ? 'bg-amber-500/10 text-amber-500' :
                  tournament.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                  tournament.status === 'in_progress' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                  {tournament.status === 'in_progress' ? 'In Progress' : tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </span>
                <span className="text-xs text-slate-600">
                  {new Date(tournament.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1a1a1a] border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-1">New tournament</h2>
            <p className="text-sm text-slate-500 mb-6">Give your tournament a name to get started</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Name</label>
                <input
                  type="text"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  placeholder="Premier League 2026"
                  autoFocus
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Description <span className="text-slate-600">(optional)</span></label>
                <textarea
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  placeholder="Add context about your tournament..."
                  rows={2}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTournament}
                disabled={!newTournament.name.trim()}
                className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
           
