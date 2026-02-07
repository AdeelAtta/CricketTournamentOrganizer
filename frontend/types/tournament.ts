/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Team {
  name: string;
}

export interface Venue {
  name: string;
}

export interface Constraints {
  rest_gap?: number;
  max_matches_per_day?: number;
  max_matches_per_team_per_day?: number;
  balance_venue_usage?: boolean;
  max_concurrent_matches?: number;
  blackout_dates?: string[];
  priority_matches?: string[];
  [key: string]: any;
}

export interface TournamentInput {
  teams: Team[];
  venues: Venue[];
  format: 'round_robin' | 'league' | 'knockout';
  time_slots: string[];
  start_date: string;
  constraints?: Constraints;
}

export interface Match {
  match_id?: string;
  match: string;
  team1: string;
  team2: string;
  time_slot: string;
  venue: string;
  date?: string;
  round?: number;
}

export interface BracketRound {
  round: number;
  total_matches: number;
  matches: Match[];
}
