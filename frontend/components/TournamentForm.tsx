'use client';

import { useState, useCallback, useEffect } from 'react';
import { TournamentInput, Match, BracketRound } from '@/types/tournament';
import apiClient from '@/lib/api/client';
import { useTournamentStore } from '@/store/tournament';
import TournamentCard from './TournamentCard';
import RoundRobinCard from './RoundRobinCard';
import LeagueCard from './LeagueCard';

interface TournamentFormProps {
  tournamentId?: string; // Used to reset state when switching tournaments
  initialSchedule?: Match[];
  initialBracket?: BracketRound[];
  initialRawOutput?: any;
  initialFormat?: 'round_robin' | 'league' | 'knockout';
  onScheduleGenerated?: (data: {
    format: 'round_robin' | 'league' | 'knockout';
    schedule?: Match[];
    bracket?: BracketRound[];
    rawOutput?: any;
  }) => void;
}

export default function TournamentForm({ tournamentId, initialSchedule, initialBracket, initialRawOutput, initialFormat, onScheduleGenerated }: TournamentFormProps) {
  const {
    setTournamentInput, setScheduledMatches, setBracketData, setCurrentRound,
    setLoading, setError, setSuccess, setRawOutput, scheduledMatches,
    bracketData, isLoading, error, success, rawOutput, reset
  } = useTournamentStore();

  // Load tournament-specific data when tournament changes
  useEffect(() => {
    // Reset and load this tournament's data
    reset();
    if (initialBracket && initialBracket.length > 0) {
      setBracketData(initialBracket);
    }
    if (initialSchedule && initialSchedule.length > 0) {
      setScheduledMatches(initialSchedule);
    }
    if (initialRawOutput) {
      setRawOutput(initialRawOutput);
    }
    if (initialFormat) {
      setFormat(initialFormat);
    }
  }, [tournamentId]);

  // Form States
  const [format, setFormat] = useState<'round_robin' | 'league' | 'knockout'>(initialFormat || 'knockout');
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
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
        // Notify parent component
        onScheduleGenerated?.({
          format,
          bracket: response.data.schedule?.bracket || [],
          rawOutput: response.data,
        });
      } else {
        setScheduledMatches(Array.isArray(response.data.schedule) ? response.data.schedule : []);
        // Notify parent component
        onScheduleGenerated?.({
          format,
          schedule: Array.isArray(response.data.schedule) ? response.data.schedule : [],
          rawOutput: response.data,
        });
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

  const applyPreset = useCallback((preset: 'psl_league') => {
    if (preset === 'psl_league') {
      setFormat('knockout');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      alert(tomorrow.toISOString().split('T')[0]);
      setStartDate(tomorrow.toISOString().split('T')[0]);
      setTeams(['Lahore Qalandars', 'Karachi Kings', 'Islamabad United', 'Peshawar Zalmi', 'Multan Sultans', 'Quetta Gladiators', 'Hyderabad', 'Sialkot']);
      setVenues(['Gaddafi Stadium', 'National Bank Arena', 'Multan Cricket Stadium', 'Pindi Cricket Stadium']);
      setTimeSlots(['Afternoon (2 PM)', 'Evening Blast (7 PM)']);
      setBlackoutDates([]);
      setRestGap(1);
      setMaxMatchesPerDay(1);
    }
  }, [setFormat, setStartDate, setTeams, setVenues, setTimeSlots, setBlackoutDates, setRestGap, setMaxMatchesPerDay]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-350 mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg">
              🏏
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Schedule Configuration</h1>
              <p className="text-sm text-slate-500">Configure teams, venues, and constraints</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearForm}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-white transition"
            >
              Reset
            </button>
            <button
              form="tournament-form"
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-slate-400 border-t-black rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="bg-[#111] border border-slate-800 rounded-xl p-4 mb-6 backdrop-blur-xl relative z-20">
          <div className="flex flex-wrap items-center gap-16">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500">FORMAT</span>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['round_robin', 'knockout'] as const).map((fmt) => (
                  <div key={fmt} className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${format === fmt
                        ? 'bg-white text-black'
                        : 'text-slate-500 hover:text-white'
                        }`}
                    >
                      {fmt === 'round_robin' ? 'League' : 'Knockout'}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#1a1a1a] border border-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl text-center">
                      {fmt === 'round_robin'
                        ? 'Every team plays every other team once. Points table determines the rank.'
                        : 'Single elimination bracket. Winners advance, losers go home until the Final.'}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a1a1a]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden md:block" />

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500">START</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0a0a0a] border border-slate-800 rounded-lg px-4 py-1.5 text-sm text-white focus:outline-none focus:border-slate-600 transition [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
              />
            </div>

            <div className={`relative ${showSettings ? 'z-[1000]' : ''}`}>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all text-sm font-medium ${showSettings
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
                <span className={`transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`}>▾</span>
              </button>

              {showSettings && (
                <div className="absolute top-full left-0 mt-3 w-[350px] bg-[#111] border border-slate-800 rounded-xl shadow-2xl z-[999] p-6 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-white">Scheduling Settings</h3>
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

            <div className="h-8 w-px bg-slate-800 hidden md:block" />

            <div className="hidden lg:flex items-center gap-3">
              <span className="text-xs text-slate-600">Preset:</span>
              <button
                type="button"
                onClick={() => applyPreset('psl_league')}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                PSL Sample
              </button>
            </div>
          </div>
        </div>

        <form id="tournament-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Teams */}
            <div className="bg-[#111] border border-slate-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Teams</h3>
                  <p className="text-xs text-slate-500">Participating teams</p>
                  {format === 'knockout' && (
                    <p className="text-[10px] text-blue-400 mt-1">
                      Use 2, 4, 8, or 16 for a perfect bracket
                    </p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${teams.length < 2 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {teams.length}
                </span>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={teamInput}
                  onChange={(e) => setTeamInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeam())}
                  placeholder="Team name..."
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={addTeam}
                  className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-white hover:bg-slate-200 text-black rounded-md text-xs font-medium transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {teams.map((team) => (
                  <div key={team} className="group flex items-center gap-2 bg-slate-800/50 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="text-sm text-slate-300">{team}</span>
                    <button type="button" onClick={() => removeTeam(team)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stadiums */}
            <div className="bg-[#111] border border-slate-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Venues</h3>
                  <p className="text-xs text-slate-500">Match locations</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${venues.length < 1 ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {venues.length}
                </span>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={venueInput}
                  onChange={(e) => setVenueInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVenue())}
                  placeholder="Venue name..."
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={addVenue}
                  className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-white hover:bg-slate-200 text-black rounded-md text-xs font-medium transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {venues.map((venue) => (
                  <div key={venue} className="group flex items-center gap-2 bg-slate-800/50 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm">
                    <span className="text-slate-300">{venue}</span>
                    <button type="button" onClick={() => removeVenue(venue)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-[#111] border border-slate-800 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Time Slots</h3>
                  <p className="text-xs text-slate-500">Daily match timings</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${timeSlots.length < 1 ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {timeSlots.length}
                </span>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={timeSlotInput}
                  onChange={(e) => setTimeSlotInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTimeSlot())}
                  placeholder="e.g., Morning"
                  className="w-full bg-[#0a0a0a] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-white hover:bg-slate-200 text-black rounded-md text-xs font-medium transition"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {timeSlots.map((slot) => (
                  <div key={slot} className="group flex items-center gap-2 bg-slate-800/50 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm">
                    <span className="text-slate-300">{slot}</span>
                    <button type="button" onClick={() => removeTimeSlot(slot)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Info Section */}
          <div className="space-y-4">
            <div className="bg-[#111] border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-slate-400">
                <span className="text-white font-medium">{format === 'round_robin' ? 'League' : 'Knockout'}</span> format with{' '}
                <span className="text-white font-medium">{teams.length}</span> teams,{' '}
                <span className="text-white font-medium">{venues.length}</span> venues,{' '}
                <span className="text-white font-medium">{timeSlots.length}</span> time slots starting{' '}
                <span className="text-white font-medium">{startDate || '—'}</span>
              </div>
            </div>

            {/* Status Messages */}
            {(error || success) && (
              <div className={`p-4 rounded-xl border ${error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} text-sm flex items-center gap-3`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {error || success}
              </div>
            )}
          </div>
        </form>

        {/* Results Pane */}
        {(rawOutput || isLoading || bracketData.length > 0 || scheduledMatches.length > 0) && (
          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-white">Generated Schedule</h2>
              <div className="h-px flex-1 bg-slate-800" />
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