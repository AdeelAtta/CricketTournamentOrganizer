import sys
import os
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scheduler import generate_schedule
from models import TournamentInput, Team, Venue, Constraints

def test_rest_gap_and_slots():
    print("Testing Rest Gap with Multiple Slots per Day...")
    data = TournamentInput(
        teams=[Team(name=f"Team {i}") for i in range(4)],
        venues=[Venue(name="Stadium A")],
        format="round_robin",
        time_slots=["Morning", "Evening"],
        start_date="2026-03-01",
        constraints=Constraints(
            rest_gap=1,
            max_matches_per_day=4,
            max_matches_per_team_per_day=1
        )
    )
    
    result = generate_schedule(data)
    schedule = result.get('schedule', [])
    
    # Validation
    team_last_date = {}
    for match_item in schedule:
        teams = match_item['match'].split(" vs ")
        # Time slot like "2026-03-01 - Morning"
        date_str = match_item['time_slot'].split(" - ")[0]
        curr_date = datetime.strptime(date_str, "%Y-%m-%d")
        
        for team in teams:
            if team in team_last_date:
                gap = (curr_date - team_last_date[team]).days
                if gap < 2: # 1 day rest means gap must be >= 2 (e.g., Mar 1 to Mar 3)
                    print(f"FAILED: Team {team} played on {team_last_date[team]} and again on {curr_date} (Gap: {gap})")
                    return False
            team_last_date[team] = curr_date
            
    print("PASSED: Rest gap respected.")
    return True

def test_venue_double_booking():
    print("Testing Venue Double Booking...")
    data = TournamentInput(
        teams=[Team(name=f"Team {i}") for i in range(6)],
        venues=[Venue(name="V1")],
        format="round_robin",
        time_slots=["Morning", "Afternoon", "Evening"],
        constraints=Constraints(max_concurrent_matches=1)
    )
    result = generate_schedule(data)
    schedule = result.get('schedule', [])
    
    slot_venue_count = {}
    for item in schedule:
        key = (item['time_slot'], item['venue'])
        slot_venue_count[key] = slot_venue_count.get(key, 0) + 1
        if slot_venue_count[key] > 1:
            print(f"FAILED: Venue {item['venue']} double booked in slot {item['time_slot']}")
            return False
            
    print("PASSED: No venue double booking.")
    return True

if __name__ == "__main__":
    success = True
    success &= test_rest_gap_and_slots()
    success &= test_venue_double_booking()
    
    if success:
        print("\nALL BACKEND REFINEMENT TESTS PASSED!")
    else:
        print("\nSOME TESTS FAILED!")
        sys.exit(1)
