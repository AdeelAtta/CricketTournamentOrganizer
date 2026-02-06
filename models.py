
from pydantic import BaseModel
from typing import List, Optional

class Team(BaseModel):
    name: str

class Venue(BaseModel):
    name: str

class Constraints(BaseModel):
    rest_gap: int = 1
    max_matches_per_day: Optional[int] = None

class TournamentInput(BaseModel):
    teams: List[Team]
    venues: List[Venue]
    format: str  # "round_robin", "league", "knockout"
    time_slots: List[str]
    constraints: Optional[Constraints] = Constraints()
