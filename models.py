
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Team(BaseModel):
    name: str

class Venue(BaseModel):
    name: str

class Constraints(BaseModel):
    rest_gap: int = 1
    max_matches_per_day: Optional[int] = None
    max_matches_per_team_per_day: int = 1
    min_matches_gap_same_team: int = 1
    min_venue_rest_gap: int = 0
    max_matches_per_venue: Optional[int] = None
    balance_venue_usage: bool = True
    avoid_same_matchup_gap: int = 4
    blackout_dates: List[str] = []
    balance_matches_per_team: bool = True
    prefer_even_distribution: bool = True
    max_concurrent_matches: int = 3
    priority_matches: List[List[str]] = []

class TournamentInput(BaseModel):
    teams: List[Team]
    venues: List[Venue]
    format: str
    time_slots: List[str]
    start_date: Optional[str] = None
    constraints: Optional[Constraints] = Constraints()

class MatchResult(BaseModel):
    match_id: int
    winner: str

class KnockoutRoundRequest(BaseModel):
    tournament_id: str
    current_round: int
    match_results: List[MatchResult]
    venues: List[Venue]
    time_slots: List[str]
    start_date: Optional[str] = None
    constraints: Optional[Constraints] = Constraints()

class KnockoutBracketRequest(BaseModel):
    tournament_id: str
    num_teams: int
    venues: List[Venue]
    time_slots: List[str]
    start_date: Optional[str] = None
    constraints: Optional[Constraints] = Constraints()
