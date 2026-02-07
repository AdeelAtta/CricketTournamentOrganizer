'use client';

import { useState, useCallback } from 'react';
import { TournamentInput } from '@/types/tournament';
import apiClient from '@/lib/api/client';
import { useTournamentStore } from '@/store/tournament';
import TournamentCard from './TournamentCard';
import RoundRobinCard from './RoundRobinCard';
import LeagueCard from './LeagueCard';

export default function TournamentForm() {
  const { setTournamentInput, setScheduledMatches, setBracketData, setCurrentRound, setLoading, setError, setSuccess, setRawOutput, scheduledMatches, bracketData, isLoading, error, success, rawOutput } =
    useTournamentStore();

  // Form States
  const [format, setFormat] = useState<'round_robin' | 'league' | 'knockout'>('knockout');
  const [startDate, setStartDate] = useState('2026-02-20');
  const [teams, setTeams] = useState<string[]>(['India', 'Australia', 'England', 'Pakistan']);
  const [teamInput, setTeamInput] = useState('');
  const [venues, setVenues] = useState<string[]>(['MCG Melbourne', 'SCG Sydney']);
  const [venueInput, setVenueInput] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>(['Morning', 'Evening']);
  const [timeSlotInput, setTimeSlotInput] = useState('Afternoon');

  // Constraints
  const [restGap, setRestGap] = useState(1);
  const [maxMatchesPerDay, setMaxMatchesPerDay] = useState(2);
  const [maxMatchesPerTeamPerDay, setMaxMatchesPerTeamPerDay] = useState(1);
  const [balanceVenue, setBalanceVenue] = useState(true);
  const [minMatchesGapSameTeam, setMinMatchesGapSameTeam] = useState(1);
  const [minVenueRestGap, setMinVenueRestGap] = useState(1);
  const [maxMatchesPerVenue, setMaxMatchesPerVenue] = useState(5);
  const [avoidSameMatchupGap, setAvoidSameMatchupGap] = useState(4);
  const [balanceMatchesPerTeam, setBalanceMatchesPerTeam] = useState(true);
  const [preferEvenDistribution, setPreferEvenDistribution] = useState(true);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutInput, setBlackoutInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const addTeam = useCallback(() => {
    if (teamInput.trim() && !teams.includes(teamInput.trim())) {
      setTeams([...teams, teamInput.trim()]);
      setTeamInput('');
    }
  }, [teamInput, teams]);

  const removeTeam = useCallback((team: string) => {
    setTeams(teams.filter((t) => t !== team));
  }, [teams]);

  const addVenue = useCallback(() => {
    if (venueInput.trim() && !venues.includes(venueInput.trim())) {
      setVenues([...venues, venueInput.trim()]);
      setVenueInput('');
    }
  }, [venueInput, venues]);

  const removeVenue = useCallback((venue: string) => {
    setVenues(venues.filter((v) => v !== venue));
  }, [venues]);

  const addTimeSlot = useCallback(() => {
    if (timeSlotInput.trim() && !timeSlots.includes(timeSlotInput.trim())) {
      setTimeSlots([...timeSlots, timeSlotInput.trim()]);
      setTimeSlotInput('');
    }
  }, [timeSlotInput, timeSlots]);

  const removeTimeSlot = useCallback((slot: string) => {
    setTimeSlots(timeSlots.filter((t) => t !== slot));
  }, [timeSlots]);

  const addBlackoutDate = useCallback(() => {
    if (blackoutInput && !blackoutDates.includes(blackoutInput)) {
      setBlackoutDates([...blackoutDates, blackoutInput].sort());
      setBlackoutInput('');
    }
  }, [blackoutInput, blackoutDates]);

  const removeBlackoutDate = useCallback((date: string) => {
    setBlackoutDates(blackoutDates.filter((d) => d !== date));
  }, [blackoutDates]);

  const isFormInvalid = teams.length < 2 || venues.length < 1 || timeSlots.length < 1 || !startDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFormInvalid) {
      setError('Please add at least 2 teams, 1 venue, 1 time slot and a start date');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const input: TournamentInput = {
        teams: teams.map((name) => ({ name })),
        venues: venues.map((name) => ({ name })),
        format,
        time_slots: timeSlots,
        start_date: startDate,
        constraints: {
          rest_gap: restGap,
          max_matches_per_day: maxMatchesPerDay,
          max_matches_per_team_per_day: maxMatchesPerTeamPerDay,
          balance_venue_usage: balanceVenue,
          min_matches_gap_same_team: minMatchesGapSameTeam,
          min_venue_rest_gap: minVenueRestGap,
          max_matches_per_venue: maxMatchesPerVenue,
          avoid_same_matchup_gap: avoidSameMatchupGap,
          balance_matches_per_team: balanceMatchesPerTeam,
          prefer_even_distribution: preferEvenDistribution,
          blackout_dates: blackoutDates,
          priority_matches: [], // Placeholder for now
        },
      };

      setTournamentInput(input);

      const response = await apiClient.post('/schedule', input);

      if (format === 'knockout') {
        setBracketData(response.data.schedule?.bracket || []);
        setScheduledMatches(response.data.schedule?.current_round_schedule || []);
        setCurrentRound(1);
      } else {
        setScheduledMatches(Array.isArray(response.data.schedule) ? response.data.schedule : []);
      }
      // store raw API response for exact output/debug
      setRawOutput(response.data);

      setSuccess('Tournament schedule generated successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate schedule';
      setError(errorMsg);
      setRawOutput(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = useCallback(() => {
    setFormat('knockout');
    setStartDate('');
    setTeams([]);
    setTeamInput('');
    setVenues([]);
    setVenueInput('');
    setTimeSlots([]);
    setTimeSlotInput('');
    setRestGap(1);
    setMaxMatchesPerDay(2);
    setMaxMatchesPerTeamPerDay(1);
    setBalanceVenue(true);
    setMinMatchesGapSameTeam(1);
    setMinVenueRestGap(1);
    setMaxMatchesPerVenue(5);
    setAvoidSameMatchupGap(4);
    setBalanceMatchesPerTeam(true);
    setPreferEvenDistribution(true);
    setBlackoutDates([]);
    setBlackoutInput('');
    
    // Clear Store
    setScheduledMatches([]);
    setBracketData([]);
    setError(null);
    setSuccess(null);
    setRawOutput(null);
  }, [setScheduledMatches, setBracketData, setError, setSuccess, setRawOutput]);

  const applyPreset = useCallback((preset: 'world_cup' | 'local_league' | 'quick_knockout' | 'psl_league') => {
    if (preset === 'psl_league') {
      setFormat('league');
      setStartDate('2026-02-14');
      setTeams(['Lahore Qalandars', 'Karachi Kings', 'Islamabad United', 'Peshawar Zalmi', 'Multan Sultans', 'Quetta Gladiators']);
      setVenues(['Gaddafi Stadium', 'National Bank Arena', 'Multan Cricket Stadium', 'Pindi Cricket Stadium']);
      setTimeSlots(['Evening Blast (7 PM)', 'Double Header (2 PM)']);
      setBlackoutDates([]);
      setRestGap(1);
      setMaxMatchesPerDay(2);
    } else if (preset === 'world_cup') {
      setFormat('round_robin');
      setStartDate('2026-10-05');
      setTeams(['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand', 'Afghanistan', 'Sri Lanka', 'Bangladesh', 'Netherlands']);
      setVenues(['Wankhede Stadium', 'Narendra Modi Stadium', 'Eden Gardens', 'Chinnaswamy']);
      setTimeSlots(['Day Match (10 AM)', 'Day/Night (2 PM)']);
      setBlackoutDates(['2026-10-24']); // Diwali break
      setRestGap(2);
      setMaxMatchesPerDay(2);
    } else if (preset === 'local_league') {
      setFormat('round_robin');
      setStartDate('2026-04-01');
      setTeams(['Club A', 'Club B', 'Club C', 'Club D', 'Club E', 'Club F']);
      setVenues(['Local Ground 1', 'Local Ground 2']);
      setTimeSlots(['Morning Slot', 'Afternoon Slot', 'Evening Slot']);
      setBlackoutDates([]);
      setRestGap(1);
      setMaxMatchesPerDay(3);
    } else {
      setFormat('knockout');
      setStartDate('2026-06-12');
      setTeams(['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta']);
      setVenues(['City Stadium']);
      setTimeSlots(['Evening Blast']);
      setBlackoutDates([]);
      setRestGap(1);
      setMaxMatchesPerDay(1);
    }
  }, []);

  return (
    <div className="min-h-screen theme-coal p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              🏏
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">AI Cricket Scheduler</h1>
              <p className="text-sm theme-muted">Generate professional cricket tournament schedules in seconds</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={clearForm}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Reset
            </button>
            <button 
              form="tournament-form"
              type="submit"
              disabled={isLoading}
              className="btn-primary shadow-lg shadow-blue-500/20 px-6 py-2.5 flex items-center gap-2 group transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="group-hover:translate-x-0.5 transition-transform">✨</span>
              )}
              {isLoading ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="theme-panel border rounded-2xl p-4 mb-6  z-10 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-400">FORMAT</span>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                {(['round_robin', 'league', 'knockout'] as const).map((fmt) => (
                  <div key={fmt} className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        format === fmt
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fmt === 'round_robin' ? 'League Stage' : fmt === 'league' ? 'Double League' : 'Knockout Stage'}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-white/10 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl text-center">
                      {fmt === 'round_robin' 
                        ? 'Every team plays every other team once. Points table determines the rank.' 
                        : fmt === 'league' 
                          ? 'Every team plays every other team twice (Home & Away). Standard PSL/IPL format.' 
                          : 'Single elimination bracket. Winners advance, losers go home until the Final.'}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-400">START DATE</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all text-sm font-medium ${
                  showSettings 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>⚙️</span>
                <span>Settings</span>
                <span className={`transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {showSettings && (
                <div className="absolute top-full left-0 mt-3 w-[350px] theme-panel border rounded-2xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Scheduling Engine</h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">×</button>
                  </div>
                  
                  <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>REST GAP (DAYS)</span>
                          <span className="text-blue-400">{restGap}</span>
                        </div>
                        <input
                          type="range" min="0" max="5" value={restGap}
                          onChange={(e) => setRestGap(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>DAILY MATCH LIMIT</span>
                          <span className="text-blue-400">{maxMatchesPerDay}</span>
                        </div>
                        <input
                          type="range" min="1" max="10" value={maxMatchesPerDay}
                          onChange={(e) => setMaxMatchesPerDay(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>MATCHES PER TEAM/DAY</span>
                          <span className="text-blue-400">{maxMatchesPerTeamPerDay}</span>
                        </div>
                        <input
                          type="range" min="1" max="3" value={maxMatchesPerTeamPerDay}
                          onChange={(e) => setMaxMatchesPerTeamPerDay(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>MIN MATCH GAP (SAME TEAM)</span>
                          <span className="text-blue-400">{minMatchesGapSameTeam}</span>
                        </div>
                        <input
                          type="range" min="1" max="5" value={minMatchesGapSameTeam}
                          onChange={(e) => setMinMatchesGapSameTeam(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>MIN VENUE REST GAP</span>
                          <span className="text-blue-400">{minVenueRestGap}</span>
                        </div>
                        <input
                          type="range" min="0" max="3" value={minVenueRestGap}
                          onChange={(e) => setMinVenueRestGap(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>MAX MATCHES PER VENUE</span>
                          <span className="text-blue-400">{maxMatchesPerVenue}</span>
                        </div>
                        <input
                          type="range" min="1" max="20" value={maxMatchesPerVenue}
                          onChange={(e) => setMaxMatchesPerVenue(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                          <span>AVOID SAME MATCHUP GAP</span>
                          <span className="text-blue-400">{avoidSameMatchupGap}</span>
                        </div>
                        <input
                          type="range" min="1" max="10" value={avoidSameMatchupGap}
                          onChange={(e) => setAvoidSameMatchupGap(Number(e.target.value))}
                          className="w-full accent-blue-600 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <label className="flex items-center justify-between group cursor-pointer">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition uppercase">Balance Venue Usage</span>
                        <div className="relative">
                          <input type="checkbox" checked={balanceVenue} onChange={(e) => setBalanceVenue(e.target.checked)} className="peer sr-only" />
                          <div className="w-10 h-5 bg-white/10 rounded-full transition peer-checked:bg-blue-600" />
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-5" />
                        </div>
                      </label>

                      <label className="flex items-center justify-between group cursor-pointer">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition uppercase">Balance Matches/Team</span>
                        <div className="relative">
                          <input type="checkbox" checked={balanceMatchesPerTeam} onChange={(e) => setBalanceMatchesPerTeam(e.target.checked)} className="peer sr-only" />
                          <div className="w-10 h-5 bg-white/10 rounded-full transition peer-checked:bg-blue-600" />
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-5" />
                        </div>
                      </label>

                      <label className="flex items-center justify-between group cursor-pointer">
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition uppercase">Prefer Even Distribution</span>
                        <div className="relative">
                          <input type="checkbox" checked={preferEvenDistribution} onChange={(e) => setPreferEvenDistribution(e.target.checked)} className="peer sr-only" />
                          <div className="w-10 h-5 bg-white/10 rounded-full transition peer-checked:bg-blue-600" />
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-5" />
                        </div>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <span className="text-xs font-bold text-slate-400 block mb-3 uppercase">Blackout Dates</span>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="date"
                          value={blackoutInput}
                          onChange={(e) => setBlackoutInput(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition shadow-inner"
                        />
                        <button type="button" onClick={addBlackoutDate} className="px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {blackoutDates.map((date) => (
                          <div key={date} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg">
                            <span className="text-xs text-red-400 font-mono">{date}</span>
                            <button type="button" onClick={() => removeBlackoutDate(date)} className="text-red-400 hover:text-red-300">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presets</span>
              <button 
                type="button"
                onClick={() => applyPreset('psl_league')} 
                className="text-xs px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition shadow-lg shadow-blue-500/10 flex items-center gap-2 font-bold"
              >
                <span>⚡</span>
                <span>Fill All (PSL)</span>
              </button>
            </div>
          </div>
        </div>

        <form id="tournament-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Teams */}
            <div className="theme-panel border rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Teams</h3>
                  <p className="text-xs theme-muted">Select participating teams</p>
                  {format === 'knockout' && (
                    <p className="text-[10px] text-blue-400 mt-1 italic animate-pulse">
                      💡 Tip: Use 2, 4, 8, or 16 for a perfect bracket
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${teams.length < 2 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {teams.length} Added
                </span>
              </div>

              <div className="relative mb-6">
                <input
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeam())}
                  placeholder="Type team name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
                />
                <button 
                  type="button" 
                  onClick={addTeam}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {teams.map((team) => (
                  <div key={team} className="group flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all">
                    <span className="text-sm text-slate-200">{team}</span>
                    <button type="button" onClick={() => removeTeam(team)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-bold">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stadiums */}
            <div className="theme-panel border rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Stadiums</h3>
                  <p className="text-xs theme-muted">Select match locations</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${venues.length < 1 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {venues.length} Added
                </span>
              </div>

              <div className="relative mb-6">
                <input
                  type="text"
                  value={venueInput}
                  onChange={(e) => setVenueInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVenue())}
                  placeholder="Type stadium name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
                />
                <button 
                  type="button" 
                  onClick={addVenue}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {venues.map((venue) => (
                  <div key={venue} className="group flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all text-sm">
                    <span className="text-slate-200">{venue}</span>
                    <button type="button" onClick={() => removeVenue(venue)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-bold">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="theme-panel border rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Match Timings</h3>
                  <p className="text-xs theme-muted">Defining daily play slots</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${timeSlots.length < 1 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {timeSlots.length} Active
                </span>
              </div>
                
              <div className="relative mb-6">
                <input
                  type="text"
                  value={timeSlotInput}
                  onChange={(e) => setTimeSlotInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTimeSlot())}
                  placeholder="e.g., Morning"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
                />
                <button 
                  type="button" 
                  onClick={addTimeSlot}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {timeSlots.map((slot) => (
                  <div key={slot} className="group flex items-center gap-2 bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all text-sm">
                    <span className="text-slate-200">{slot}</span>
                    <button type="button" onClick={() => removeTimeSlot(slot)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-bold">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Info Section */}
          <div className="space-y-6">
            <div className="theme-panel border rounded-2xl p-4 bg-blue-500/5 border-blue-500/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">ℹ️</div>
              <div className="text-sm">
                <span className="text-slate-400">Currently configuring a </span>
                <span className="text-white font-bold uppercase tracking-tight">{format.replace('_', ' ')}</span>
                <span className="text-slate-400"> tournament with </span>
                <span className="text-white font-bold">{teams.length} teams</span>,{' '}
                <span className="text-white font-bold">{venues.length} stadiums</span>, and{' '}
                <span className="text-white font-bold">{timeSlots.length} timings</span>
                <span className="text-slate-400"> starting on </span>
                <span className="text-white font-bold">{startDate || 'Selection Pending'}</span>.
              </div>
            </div>

            {/* Status Messages */}
            {(error || success) && (
              <div className={`p-4 rounded-2xl border ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'} text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2`}>
                <div className="w-2 h-2 rounded-full animate-pulse bg-current" />
                {error || success}
              </div>
            )}
          </div>
        </form>

        {/* Results Pane */}
        {(rawOutput || isLoading) && (
          <div className="mt-12 pt-12 border-t border-white/5 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-bold text-white">Generated Blueprint</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            {format === 'round_robin' ? (
              <RoundRobinCard format={format} rawOutput={rawOutput} status={{ isLoading, error, success }} />
            ) : format === 'league' ? (
              <LeagueCard format={format} rawOutput={rawOutput} status={{ isLoading, error, success }} />
            ) : (
              <TournamentCard format={format} bracketData={bracketData} scheduledMatches={scheduledMatches} status={{ isLoading, error, success }} rawOutput={rawOutput} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}