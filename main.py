
from fastapi import FastAPI
from models import TournamentInput
from scheduler import generate_schedule

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
