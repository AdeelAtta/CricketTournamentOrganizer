
# AI Cricket Tournament Scheduler (FastAPI)

This FastAPI REST API generates cricket tournament schedules based on the selected tournament format: round-robin, league, or knockout.

## Features
- Users choose tournament format
- Teams and venues provided by user
- Matches automatically generated
- Conflict-free scheduling (placeholder for AC-3 / CSP)
- Runtime-only (no database)
- Deployable on Vercel

## Run Locally

1. Install dependencies
```bash
pip install -r requirements.txt
```

2. Start server
```bash
uvicorn main:app --reload
```

3. Open API docs
```
http://127.0.0.1:8000/docs
```

## Example Request

POST `/schedule`
```json
{
  "teams": [
    {"name": "A"},
    {"name": "B"},
    {"name": "C"},
    {"name": "D"},
    {"name": "E"},
    {"name": "F"}
  ],
  "venues": [
    {"name": "Stadium 1"},
    {"name": "Stadium 2"},
    {"name": "Stadium 3"}
  ],
  "format": "round_robin", // "round_robin" //"league" // "knockout"
  "time_slots": ["Morning"],
  "start_date": "2026-02-10",
  "constraints": {
    "rest_gap": 1,
    "max_matches_per_day": 3,
    "max_matches_per_team_per_day": 1,
    "min_matches_gap_same_team": 1,
    "min_venue_rest_gap": 1,
    "max_matches_per_venue": 5,
    "balance_venue_usage": true,
    "avoid_same_matchup_gap": 4,
    "blackout_dates": ["2026-02-13","2026-02-14","2026-02-15","2026-02-16","2026-02-17"],
    "balance_matches_per_team": true,
    "prefer_even_distribution": true,
    // "max_concurrent_matches": 3,
    "priority_matches": [["A", "C"], ["C", "D"]]
  }
}
```

## Deploy on Vercel
```bash
npm i -g vercel
vercel
```

---

Next improvements:
- Replace placeholder scheduler with AC-3 + CSP for real AI scheduling
- Add support for soft constraints & preferences
- Optional persistence for multiple tournaments
