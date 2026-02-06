
from fastapi import FastAPI
from models import TournamentInput, KnockoutRoundRequest, KnockoutBracketRequest
from scheduler import generate_schedule, generate_knockout_next_round, generate_knockout_bracket

app = FastAPI(title="AI Cricket Tournament Scheduler")

@app.get("/")
def root():
    return {"message": "AI Cricket Scheduler API is running"}

@app.post("/schedule")
def schedule_tournament(data: TournamentInput):
    try:
        schedule = generate_schedule(data)
        return {"schedule": schedule}
    except ValueError as e:
        return {"error": str(e)}

@app.post("/knockout-bracket")
def knockout_bracket(request: KnockoutBracketRequest):
    try:
        result = generate_knockout_bracket(request)
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/knockout-next-round")
def knockout_next_round(request: KnockoutRoundRequest):
    try:
        result = generate_knockout_next_round(request)
        return result
    except Exception as e:
        return {"error": str(e)}
