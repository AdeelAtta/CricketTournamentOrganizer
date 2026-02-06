
from itertools import combinations
from typing import List, Dict, Set, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
from models import TournamentInput, KnockoutRoundRequest, MatchResult, KnockoutBracketRequest

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
        match_id = 1
        for t1 in it:
            try:
                t2 = next(it)
            except StopIteration:
                t2 = "BYE"
            matches.append({"match_id": match_id, "team1": t1, "team2": t2, "round": 1})
            match_id += 1
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


def generate_knockout_bracket(request: KnockoutBracketRequest) -> Dict:
    """Generate entire knockout tournament bracket with all rounds (teams as TBD)"""
    num_teams = request.num_teams
    
    # Calculate number of rounds needed
    import math
    num_rounds = math.ceil(math.log2(num_teams)) if num_teams > 1 else 1
    
    all_rounds = []
    matches_per_round = num_teams // 2
    
    # Generate all rounds
    for round_num in range(1, num_rounds + 1):
        round_schedule = []
        day_offset = (round_num - 1) * 2  # Offset days for each round
        
        for match_id in range(1, matches_per_round + 1):
            # Calculate which day this match should be scheduled
            day_index = day_offset + (match_id - 1)
            venue_index = (match_id - 1) % len(request.venues)
            
            if day_index < len(request.time_slots):
                base_slot = request.time_slots[day_index]
            else:
                base_slot = request.time_slots[0] if request.time_slots else "Morning"
            
            if request.start_date:
                start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
                current_date = start_date + timedelta(days=day_index)
                time_slot = f"{current_date.strftime('%Y-%m-%d')} - {base_slot}"
            else:
                time_slot = f"Round {round_num} - {base_slot}"
            
            venue = request.venues[venue_index].name
            
            round_schedule.append({
                "match_id": match_id,
                "round": round_num,
                "match": "TBD vs TBD",
                "team1": "TBD",
                "team2": "TBD",
                "time_slot": time_slot,
                "venue": venue,
                "from_matches": {
                    "winner_1": f"Round {round_num - 1}, Match {(match_id - 1) * 2 + 1}" if round_num > 1 else None,
                    "winner_2": f"Round {round_num - 1}, Match {(match_id - 1) * 2 + 2}" if round_num > 1 else None
                }
            })
        
        all_rounds.append({
            "round": round_num,
            "total_matches": len(round_schedule),
            "matches": round_schedule
        })
        
        matches_per_round = matches_per_round // 2
        if matches_per_round == 0:
            break
    
    return {
        "tournament_id": request.tournament_id,
        "total_rounds": num_rounds,
        "total_teams": num_teams,
        "bracket": all_rounds
    }


def generate_knockout_next_round(request: KnockoutRoundRequest) -> Dict:
    """Generate next round of knockout tournament from previous round results"""
    # Create mapping of match_id to winner
    winners_map = {result.match_id: result.winner for result in request.match_results}
    
    # Generate next round matches by pairing winners
    next_matches = []
    winners = sorted(winners_map.items())  # Sort by match_id to maintain bracket order
    
    for i in range(0, len(winners), 2):
        if i + 1 < len(winners):
            team1 = winners[i][1]
            team2 = winners[i + 1][1]
            match_id = (i // 2) + 1
            next_matches.append({
                "match_id": match_id,
                "team1": team1,
                "team2": team2,
                "from_matches": [winners[i][0], winners[i + 1][0]],
                "round": request.current_round + 1
            })
        else:
            # Odd team gets bye to next round
            next_matches.append({
                "match_id": (i // 2) + 1,
                "team1": winners[i][1],
                "team2": "BYE",
                "from_matches": [winners[i][0]],
                "round": request.current_round + 1
            })
    
    # Schedule these matches
    schedule = []
    day_index = 0
    venue_index = 0
    all_venues = [venue.name for venue in request.venues]
    
    # Parse start date
    start_date = None
    if request.start_date:
        try:
            start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        except:
            start_date = None
    
    # Extract constraints
    constraints = request.constraints if request.constraints else {}
    rest_gap = constraints.rest_gap if hasattr(constraints, 'rest_gap') else 1
    max_matches_per_day = constraints.max_matches_per_day if hasattr(constraints, 'max_matches_per_day') else None
    
    for match in next_matches:
        if day_index < len(request.time_slots):
            base_slot = request.time_slots[day_index]
        else:
            base_slot = request.time_slots[0] if request.time_slots else "Morning"
        
        if start_date:
            current_date = start_date + timedelta(days=day_index)
            current_slot = f"{current_date.strftime('%Y-%m-%d')} - {base_slot}"
        else:
            current_slot = f"Round {request.current_round + 1} - Match {match['match_id']}"
        
        venue = all_venues[venue_index % len(all_venues)]
        
        schedule.append({
            "match_id": match['match_id'],
            "round": match['round'],
            "match": f"{match['team1']} vs {match['team2']}",
            "time_slot": current_slot,
            "venue": venue,
            "from_matches": match['from_matches']
        })
        
        venue_index += 1
        if max_matches_per_day and len(schedule) % max_matches_per_day == 0:
            day_index += 1
    
    return {
        "tournament_id": request.tournament_id,
        "current_round": request.current_round + 1,
        "total_matches": len(schedule),
        "schedule": schedule
    }


def generate_schedule(data: TournamentInput) -> Dict:
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
            schedule_item = {
                "match": f"{match['team1']} vs {match['team2']}",
                "time_slot": current_slot,
                "venue": match.get('scheduled_venue', all_venues[venue_index % len(all_venues)])
            }
            
            # Add match_id and round if they exist (knockout format)
            if 'match_id' in match:
                schedule_item["match_id"] = match['match_id']
            if 'round' in match:
                schedule_item["round"] = match['round']
            
            schedule.append(schedule_item)
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

    # For knockout format, also generate the full bracket structure
    if data.format == "knockout":
        num_teams = len(data.teams)
        import math
        num_rounds = math.ceil(math.log2(num_teams)) if num_teams > 1 else 1
        
        all_rounds = []
        matches_per_round = num_teams // 2
        
        # Generate bracket for all rounds
        for round_num in range(1, num_rounds + 1):
            round_bracket = []
            day_offset = (round_num - 1) * 2
            
            for match_id in range(1, matches_per_round + 1):
                day_index = day_offset + (match_id - 1)
                venue_index_bracket = (match_id - 1) % len(data.venues)
                
                if day_index < len(data.time_slots):
                    base_slot = data.time_slots[day_index]
                else:
                    base_slot = data.time_slots[0] if data.time_slots else "Morning"
                
                if start_date:
                    current_date = start_date + timedelta(days=day_index)
                    time_slot = f"{current_date.strftime('%Y-%m-%d')} - {base_slot}"
                else:
                    time_slot = f"Round {round_num} - {base_slot}"
                
                venue = data.venues[venue_index_bracket].name
                
                round_bracket.append({
                    "match_id": match_id,
                    "round": round_num,
                    "match": "TBD vs TBD" if round_num > 1 else schedule[match_id - 1]["match"],
                    "team1": "TBD" if round_num > 1 else schedule[match_id - 1]["match"].split(" vs ")[0],
                    "team2": "TBD" if round_num > 1 else schedule[match_id - 1]["match"].split(" vs ")[1],
                    "time_slot": time_slot,
                    "venue": venue,
                    "from_matches": {
                        "winner_1": f"Round {round_num - 1}, Match {(match_id - 1) * 2 + 1}" if round_num > 1 else None,
                        "winner_2": f"Round {round_num - 1}, Match {(match_id - 1) * 2 + 2}" if round_num > 1 else None
                    }
                })
            
            all_rounds.append({
                "round": round_num,
                "total_matches": len(round_bracket),
                "matches": round_bracket
            })
            
            matches_per_round = matches_per_round // 2
            if matches_per_round == 0:
                break
        
        return {
            "format": "knockout",
            "total_rounds": num_rounds,
            "total_teams": num_teams,
            "bracket": all_rounds,
            "current_round_schedule": schedule
        }
    
    return {"schedule": schedule}
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
            schedule_item = {
                "match": f"{match['team1']} vs {match['team2']}",
                "time_slot": current_slot,
                "venue": match.get('scheduled_venue', all_venues[venue_index % len(all_venues)])
            }
            
            # Add match_id and round if they exist (knockout format)
            if 'match_id' in match:
                schedule_item["match_id"] = match['match_id']
            if 'round' in match:
                schedule_item["round"] = match['round']
            
            schedule.append(schedule_item)
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
