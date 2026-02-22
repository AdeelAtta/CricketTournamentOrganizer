
from itertools import combinations
from typing import List, Dict, Set, Tuple, Optional
from collections import defaultdict
from datetime import datetime, timedelta
from models import TournamentInput, KnockoutRoundRequest, MatchResult, KnockoutBracketRequest, Constraints

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


def is_team_available(team: str, calendar_day: int, slot_index: int, state: Dict, constraints: Dict) -> bool:
    """Check if a team can play in a specific slot and day."""
    if team == "BYE":
        return True
    
    # 1. Check if already playing in this specific slot (global slot_index)
    if team in state['slots'][slot_index]['teams']:
        return False
        
    # 2. Check matches per team per day
    day_matches = state['team_matches_per_day'][team].get(calendar_day, 0)
    if day_matches >= constraints['max_matches_per_team_per_day']:
        return False
        
    # 3. Check rest gap (in calendar days)
    last_day = state['team_last_match_day'].get(team)
    if last_day is not None:
        if calendar_day - last_day < constraints['rest_gap'] + 1:
            return False
            
    return True

def find_best_venue(match: Dict, calendar_day: int, slot_index: int, state: Dict, constraints: Dict, all_venues: List[str]) -> Optional[str]:
    """Find the best venue according to constraints and usage balance."""
    venues_used_in_slot = state['slots'][slot_index]['venues']
    
    # Filter venues by availability and constraints
    available_venues = []
    for v in all_venues:
        # Venue already used in this specific time slot
        if v in venues_used_in_slot:
            continue
            
        # Max matches per venue constraint
        if constraints['max_matches_per_venue'] and state['venue_total_matches'][v] >= constraints['max_matches_per_venue']:
            continue
            
        # Venue rest gap constraint
        last_used = state['venue_last_used'].get(v)
        if last_used is not None:
            if calendar_day - last_used < constraints['min_venue_rest_gap'] + 1:
                continue
                
        available_venues.append(v)
        
    if not available_venues:
        return None
        
    if constraints['balance_venue_usage']:
        # Sort by total usage, then by last used day (to keep it rotating)
        return min(available_venues, key=lambda v: (state['venue_total_matches'][v], state['venue_last_used'].get(v, -1)))
    else:
        # Just pick the first available one (rotation is handled by list order)
        return available_venues[0]

def generate_schedule(data: TournamentInput) -> Dict:
    matches = generate_matches(data)
    constraints_obj = data.constraints if data.constraints else Constraints()
    
    # Map constraints for easy access
    constraints = {
        'rest_gap': constraints_obj.rest_gap,
        'max_matches_per_day': constraints_obj.max_matches_per_day,
        'max_matches_per_team_per_day': constraints_obj.max_matches_per_team_per_day,
        'min_venue_rest_gap': constraints_obj.min_venue_rest_gap,
        'max_matches_per_venue': constraints_obj.max_matches_per_venue,
        'balance_venue_usage': constraints_obj.balance_venue_usage,
        'avoid_same_matchup_gap': constraints_obj.avoid_same_matchup_gap,
        'blackout_dates': set(constraints_obj.blackout_dates),
        'max_concurrent_matches': constraints_obj.max_concurrent_matches,
        'priority_matches': constraints_obj.priority_matches
    }
    
    if constraints['priority_matches']:
        matches = prioritize_matches(matches, constraints['priority_matches'])
    
    all_venues = [v.name for v in data.venues]
    time_slots = data.time_slots if data.time_slots else ["Default Slot"]
    num_slots_per_day = len(time_slots)
    
    # Tracking State
    state = {
        'team_last_match_day': {}, # team -> calendar_day
        'team_matches_per_day': defaultdict(dict), # team -> {calendar_day: count}
        'venue_last_used': {}, # venue -> calendar_day
        'venue_total_matches': defaultdict(int), # venue -> count
        'matchup_last_played': {}, # (team1, team2) -> calendar_day
        'slots': defaultdict(lambda: {'matches': [], 'venues': set(), 'teams': set()}), # slot_index -> data
        'day_matches_count': defaultdict(int) # calendar_day -> count
    }
    
    # Parse start date
    start_date = None
    if data.start_date:
        try:
            start_date = datetime.strptime(data.start_date, "%Y-%m-%d")
        except:
            pass

    match_queue = list(matches)
    slot_index = 0
    max_iterations = len(matches) * 20 # Safety break
    
    while match_queue and slot_index < max_iterations:
        calendar_day = slot_index // num_slots_per_day
        slot_in_day = slot_index % num_slots_per_day
        
        # Determine slot name and date
        current_date_str = None
        if start_date:
            current_date = start_date + timedelta(days=calendar_day)
            current_date_str = current_date.strftime('%Y-%m-%d')
            slot_name = f"{current_date_str} - {time_slots[slot_in_day]}"
        else:
            slot_name = f"Day {calendar_day + 1} - {time_slots[slot_in_day]}"
            
        # Check blackout dates
        if current_date_str in constraints['blackout_dates'] or slot_name in constraints['blackout_dates']:
            # Skip all slots for this day if the date is blacked out
            # or just skip this specific slot if it's named specifically
            slot_index += 1
            continue
            
        # Try to fit as many matches as possible in this slot
        matches_to_keep = []
        for match in match_queue:
            t1, t2 = match['team1'], match['team2']
            matchup_key = tuple(sorted([t1, t2]))
            
            # 1. Global Slot Constraints
            if len(state['slots'][slot_index]['matches']) >= constraints['max_concurrent_matches']:
                matches_to_keep.append(match)
                continue
                
            # 2. Daily Match Limit
            if constraints['max_matches_per_day'] and state['day_matches_count'][calendar_day] >= constraints['max_matches_per_day']:
                matches_to_keep.append(match)
                continue
                
            # 3. Team Availability
            if not is_team_available(t1, calendar_day, slot_index, state, constraints) or \
               not is_team_available(t2, calendar_day, slot_index, state, constraints):
                matches_to_keep.append(match)
                continue
                
            # 4. Matchup Gap Constraint
            last_matchup = state['matchup_last_played'].get(matchup_key)
            if last_matchup is not None:
                if calendar_day - last_matchup < constraints['avoid_same_matchup_gap'] + 1:
                    matches_to_keep.append(match)
                    continue
                    
            # 5. Venue Selection
            venue = find_best_venue(match, calendar_day, slot_index, state, constraints, all_venues)
            if not venue:
                matches_to_keep.append(match)
                continue
                
            # SUCCESS - Schedule the match
            schedule_item = {
                "match": f"{t1} vs {t2}",
                "team1": t1,
                "team2": t2,
                "time_slot": slot_name,
                "venue": venue
            }
            if 'match_id' in match: schedule_item["match_id"] = match['match_id']
            if 'round' in match: schedule_item["round"] = match['round']
            
            # Update State
            state['slots'][slot_index]['matches'].append(schedule_item)
            state['slots'][slot_index]['teams'].add(t1)
            state['slots'][slot_index]['teams'].add(t2)
            state['slots'][slot_index]['venues'].add(venue)
            
            state['team_last_match_day'][t1] = calendar_day
            state['team_last_match_day'][t2] = calendar_day
            state['team_matches_per_day'][t1][calendar_day] = state['team_matches_per_day'][t1].get(calendar_day, 0) + 1
            state['team_matches_per_day'][t2][calendar_day] = state['team_matches_per_day'][t2].get(calendar_day, 0) + 1
            
            state['venue_last_used'][venue] = calendar_day
            state['venue_total_matches'][venue] += 1
            state['day_matches_count'][calendar_day] += 1
            state['matchup_last_played'][matchup_key] = calendar_day
            
        match_queue = matches_to_keep
        slot_index += 1

    # Flatten schedule
    schedule = []
    for i in range(slot_index):
        schedule.extend(state['slots'][i].get('matches', []))
        
    # Fallback for unscheduled matches
    if match_queue:
        fallback_day = (slot_index // num_slots_per_day) + 1
        for match in match_queue:
            t1, t2 = match['team1'], match['team2']
            if start_date:
                curr_date = start_date + timedelta(days=fallback_day)
                slot_name = f"{curr_date.strftime('%Y-%m-%d')} - {time_slots[0]}"
            else:
                slot_name = f"Day {fallback_day + 1} - {time_slots[0]}"
                
            schedule.append({
                "match": f"{t1} vs {t2}",
                "team1": t1,
                "team2": t2,
                "time_slot": slot_name,
                "venue": all_venues[0] if all_venues else "TBD"
            })
            fallback_day += 1

    # For knockout format, also generate the full bracket structure

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
                
                # Find the actual scheduled match for first round
                if round_num == 1:
                    actual_match = next((m for m in schedule if m.get('match_id') == match_id and m.get('round') == 1), None)
                    match_str = actual_match["match"] if actual_match else "TBD vs TBD"
                    team1_str = actual_match["team1"] if actual_match else "TBD"
                    team2_str = actual_match["team2"] if actual_match else "TBD"
                    time_slot_str = actual_match["time_slot"] if actual_match else time_slot
                    venue_str = actual_match["venue"] if actual_match else venue
                else:
                    match_str = "TBD vs TBD"
                    team1_str = "TBD"
                    team2_str = "TBD"
                    time_slot_str = time_slot
                    venue_str = venue

                round_bracket.append({
                    "match_id": match_id,
                    "round": round_num,
                    "match": match_str,
                    "team1": team1_str,
                    "team2": team2_str,
                    "time_slot": time_slot_str,
                    "venue": venue_str,
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
