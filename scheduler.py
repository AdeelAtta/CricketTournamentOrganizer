
from itertools import combinations
from typing import List, Dict
from models import TournamentInput

def generate_matches(data: TournamentInput) -> List[Dict]:
    teams = [team.name for team in data.teams]
    matches = []

    if data.format == "round_robin":
        for t1, t2 in combinations(teams, 2):
            matches.append({"team1": t1, "team2": t2})

    elif data.format == "league":
        for t1, t2 in combinations(teams, 2):
            matches.append({"team1": t1, "team2": t2})
            matches.append({"team1": t2, "team2": t1})

    elif data.format == "knockout":
        it = iter(teams)
        for t1 in it:
            try:
                t2 = next(it)
            except StopIteration:
                t2 = "BYE"
            matches.append({"team1": t1, "team2": t2})
    else:
        raise ValueError("Unsupported tournament format")

    return matches


def generate_schedule(data: TournamentInput) -> List[Dict]:
    matches = generate_matches(data)
    schedule = []
    rest_gap = data.constraints.rest_gap if data.constraints else 1
    max_matches_per_day = data.constraints.max_matches_per_day if data.constraints else None
    
    # Track last match slot (as day index) for each team
    team_last_match_day = {}
    
    day_index = 0
    venue_index = 0
    match_queue = list(matches)

    while match_queue:
        # Get or generate the time slot for the current day
        if day_index < len(data.time_slots):
            current_slot = data.time_slots[day_index]
        else:
            # Generate additional days if needed (e.g., Day2, Day3, etc.)
            base_slot = data.time_slots[0] if data.time_slots else "Day1-Morning"
            # Extract day number and period
            if "-" in base_slot:
                period = base_slot.split("-")[1]
                current_slot = f"Day{day_index + 1}-{period}"
            else:
                current_slot = f"Day{day_index + 1}"
        
        teams_in_current_day = set()
        day_matches = []
        remaining_matches = []
        
        # Try to schedule matches for current day
        for match in match_queue:
            team1, team2 = match['team1'], match['team2']
            
            # Check if max matches per day constraint is met
            if max_matches_per_day and len(day_matches) >= max_matches_per_day:
                remaining_matches.append(match)
                continue
            
            can_schedule = True
            
            # Check if team already playing on current day
            if team1 in teams_in_current_day or team2 in teams_in_current_day:
                can_schedule = False
            
            # Check rest gap constraint (days between matches)
            if team1 in team_last_match_day:
                if day_index - team_last_match_day[team1] < rest_gap + 1:
                    can_schedule = False
            
            if team2 in team_last_match_day and team2 != "BYE":
                if day_index - team_last_match_day[team2] < rest_gap + 1:
                    can_schedule = False
            
            if can_schedule:
                day_matches.append(match)
                teams_in_current_day.add(team1)
                if team2 != "BYE":
                    teams_in_current_day.add(team2)
                team_last_match_day[team1] = day_index
                if team2 != "BYE":
                    team_last_match_day[team2] = day_index
            else:
                remaining_matches.append(match)
        
        # Schedule the matches for this day
        for match in day_matches:
            schedule.append({
                "match": f"{match['team1']} vs {match['team2']}",
                "time_slot": current_slot,
                "venue": data.venues[venue_index % len(data.venues)].name
            })
            venue_index += 1
        
        match_queue = remaining_matches
        
        # Move to next day only if we scheduled something or still have matches
        if day_matches or match_queue:
            day_index += 1
        
        # Prevent infinite loops - failsafe after very long schedule
        if day_index > len(matches) * 10:
            break

    return schedule
