
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
  "teams": [{"name": "A"}, {"name": "B"}, {"name": "C"}, {"name": "D"}],
  "venues": [{"name": "Stadium 1"}, {"name": "Stadium 2"}],
  "format": "round_robin",
  "time_slots": ["Day1-Morning", "Day1-Evening", "Day2-Morning"],
  "constraints": {"rest_gap": 1, "max_matches_per_day": 1}
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
