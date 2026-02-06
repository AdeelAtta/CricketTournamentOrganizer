
from itertools import combinations
from typing import List, Dict, Set, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
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


def prioritize_matches(matches: List[Dict], priority_list: List[List[str]]) -> List[Dict]:
    """Reorder matches to schedule priority matches first"""
    priority_matches = []
    regular_matches = []
    
    priority_set = set()
    for p_match in priority_list:
        priority_set.add(tuple(sorted([p_match[0], p_match[1]])))
    
    for match in matches:
        match_tuple = tuple(sorted([match['team1'], match['team2']]))
        if match_tuple in priority_set:
            priority_matches.append(match)
        else:
            regular_matches.append(match)
    
    return priority_matches + regular_matches


def generate_schedule(data: TournamentInput) -> List[Dict]:
    matches = generate_matches(data)
    constraints = data.constraints if data.constraints else {}
    
    # Extract constraint values with defaults
    rest_gap = constraints.rest_gap if hasattr(constraints, 'rest_gap') else 1
    max_matches_per_day = constraints.max_matches_per_day if hasattr(constraints, 'max_matches_per_day') else None
    max_matches_per_team_per_day = constraints.max_matches_per_team_per_day if hasattr(constraints, 'max_matches_per_team_per_day') else 1
    min_venue_rest_gap = constraints.min_venue_rest_gap if hasattr(constraints, 'min_venue_rest_gap') else 0
    max_matches_per_venue = constraints.max_matches_per_venue if hasattr(constraints, 'max_matches_per_venue') else None
    balance_venue_usage = constraints.balance_venue_usage if hasattr(constraints, 'balance_venue_usage') else True
    avoid_same_matchup_gap = constraints.avoid_same_matchup_gap if hasattr(constraints, 'avoid_same_matchup_gap') else 4
    blackout_dates = constraints.blackout_dates if hasattr(constraints, 'blackout_dates') else []
    max_concurrent_matches = constraints.max_concurrent_matches if hasattr(constraints, 'max_concurrent_matches') else 3
    priority_matches_list = constraints.priority_matches if hasattr(constraints, 'priority_matches') else []
    
    # Prioritize matches if specified
    if priority_matches_list:
        matches = prioritize_matches(matches, priority_matches_list)
    
    schedule = []
    
    # Tracking structures
    team_last_match_day = {}  # Last day each team played
    team_matches_per_day = defaultdict(int)  # Matches per team per day
    teams_playing_today = {"day": -1, "set": set()}  # Teams playing on current day
    venue_last_used = defaultdict(lambda: -float('inf'))  # Last day each venue was used
    venue_matches_count = defaultdict(int)  # Total matches at each venue
    matchup_last_played = defaultdict(lambda: -float('inf'))  # Last day specific matchup played
    
    day_index = 0
    venue_index = 0
    match_queue = list(matches)
    
    all_venues = [venue.name for venue in data.venues]
    
    # Parse start date if provided
    start_date = None
    if data.start_date:
        try:
            start_date = datetime.strptime(data.start_date, "%Y-%m-%d")
        except:
            start_date = None
    
    while match_queue:
        # Generate the time slot for the current day
        if day_index < len(data.time_slots):
            base_slot = data.time_slots[day_index]
        else:
            base_slot = data.time_slots[0] if data.time_slots else "Morning"
        
        # Create slot with actual date if start_date provided
        current_date_str = None
        if start_date:
            current_date = start_date + timedelta(days=day_index)
            current_date_str = current_date.strftime('%Y-%m-%d')
            current_slot = f"{current_date_str} - {base_slot}"
        else:
            if day_index < len(data.time_slots):
                current_slot = base_slot
            else:
                if "-" in base_slot:
                    period = base_slot.split("-")[1]
                    current_slot = f"Day{day_index + 1}-{period}"
                else:
                    current_slot = f"Day{day_index + 1}"
        
        # Skip blackout dates (check both full slot and date only)
        is_blackout = current_slot in blackout_dates
        if current_date_str and current_date_str in blackout_dates:
            is_blackout = True
        
        if is_blackout:
            day_index += 1
            continue
        
        # Reset daily counters
        teams_in_current_day = set()
        day_matches = []
        remaining_matches = []
        venues_used_today = defaultdict(int)
        
        # Try to schedule matches for current day
        for match in match_queue:
            team1, team2 = match['team1'], match['team2']
            
            # Stop if max matches per day reached
            if max_matches_per_day and len(day_matches) >= max_matches_per_day:
                remaining_matches.append(match)
                continue
            
            # Stop if max concurrent matches (venues) reached
            if len(venues_used_today) >= max_concurrent_matches:
                remaining_matches.append(match)
                continue
            
            can_schedule = True
            
            # 1. Check if team already playing on current day
            if team1 in teams_in_current_day or team2 in teams_in_current_day:
                can_schedule = False
            
            # 2. Check max matches per team per day
            if team1 in team_matches_per_day:
                if team_matches_per_day[team1] >= max_matches_per_team_per_day:
                    can_schedule = False
            if team2 in team_matches_per_day and team2 != "BYE":
                if team_matches_per_day[team2] >= max_matches_per_team_per_day:
                    can_schedule = False
            
            # 3. Check rest gap constraint
            if team1 in team_last_match_day:
                if day_index - team_last_match_day[team1] < rest_gap + 1:
                    can_schedule = False
            
            if team2 in team_last_match_day and team2 != "BYE":
                if day_index - team_last_match_day[team2] < rest_gap + 1:
                    can_schedule = False
            
            # 4. Check avoid same matchup gap
            matchup_key = tuple(sorted([team1, team2]))
            if matchup_key in matchup_last_played:
                if day_index - matchup_last_played[matchup_key] < avoid_same_matchup_gap + 1:
                    can_schedule = False
            
            if can_schedule:
                # Select best venue
                best_venue = None
                
                if balance_venue_usage:
                    # Use venue with lowest usage
                    min_usage = float('inf')
                    for v in all_venues:
                        current_usage = venue_matches_count[v] + venues_used_today[v]
                        if current_usage < min_usage:
                            min_usage = current_usage
                            best_venue = v
                else:
                    # Use next venue in rotation
                    best_venue = all_venues[venue_index % len(all_venues)]
                
                # Check venue constraints
                if max_matches_per_venue and venue_matches_count[best_venue] >= max_matches_per_venue:
                    can_schedule = False
                
                if day_index - venue_last_used[best_venue] < min_venue_rest_gap + 1:
                    can_schedule = False
                
                if can_schedule:
                    day_matches.append(match)
                    venues_used_today[best_venue] += 1
                    teams_in_current_day.add(team1)
                    if team2 != "BYE":
                        teams_in_current_day.add(team2)
                    
                    team_matches_per_day[team1] += 1
                    if team2 != "BYE":
                        team_matches_per_day[team2] += 1
                    
                    team_last_match_day[team1] = day_index
                    if team2 != "BYE":
                        team_last_match_day[team2] = day_index
                    
                    matchup_last_played[matchup_key] = day_index
                    venue_last_used[best_venue] = day_index
                    venue_matches_count[best_venue] += 1
                    
                    match['scheduled_venue'] = best_venue
                else:
                    remaining_matches.append(match)
            else:
                remaining_matches.append(match)
        
        # Schedule the matches for this day
        for match in day_matches:
            schedule.append({
                "match": f"{match['team1']} vs {match['team2']}",
                "time_slot": current_slot,
                "venue": match.get('scheduled_venue', all_venues[venue_index % len(all_venues)])
            })
            venue_index += 1
        
        # Reset daily counters for next day
        if day_index + 1 < len(data.time_slots) or remaining_matches or day_matches:
            team_matches_per_day.clear()
        
        match_queue = remaining_matches
        
        # Move to next day
        if day_matches or match_queue:
            day_index += 1
        
        # Prevent infinite loops
        if day_index > len(matches) * 10:
            # Fallback: schedule remaining matches
            for match in match_queue:
                schedule.append({
                    "match": f"{match['team1']} vs {match['team2']}",
                    "time_slot": f"Day{day_index + 1}",
                    "venue": all_venues[venue_index % len(all_venues)]
                })
                venue_index += 1
            break

    return schedule
