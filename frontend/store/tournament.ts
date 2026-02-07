import { create } from 'zustand';
import { TournamentInput, Match, BracketRound } from '@/types/tournament';

interface TournamentState {
  tournamentInput: TournamentInput | null;
  scheduledMatches: Match[];
  bracketData: BracketRound[];
  currentRound: number;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  rawOutput: any | null;

  setTournamentInput: (input: TournamentInput) => void;
  setScheduledMatches: (matches: Match[]) => void;
  setBracketData: (bracket: BracketRound[]) => void;
  setCurrentRound: (round: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (message: string | null) => void;
  setRawOutput: (raw: any | null) => void;
  reset: () => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  tournamentInput: null,
  scheduledMatches: [],
  bracketData: [],
  currentRound: 1,
  isLoading: false,
  error: null,
  success: null,
  rawOutput: null,

  setTournamentInput: (input) => set({ tournamentInput: input }),
  setScheduledMatches: (matches) => set({ scheduledMatches: matches }),
  setBracketData: (bracket) => set({ bracketData: bracket }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setRawOutput: (raw) => set({ rawOutput: raw }),
  reset: () =>
    set({
      tournamentInput: null,
      scheduledMatches: [],
      bracketData: [],
      currentRound: 1,
      isLoading: false,
      error: null,
      success: null,
      rawOutput: null,
    }),
}));
