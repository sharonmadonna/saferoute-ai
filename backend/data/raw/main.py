from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from safety_scorer import SafetyScorer
from route_engine import RouteEngine
import json

app = FastAPI(title="SafeRoute AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize once on startup — expensive operations
scorer = SafetyScorer()
engine = RouteEngine(scorer)


class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat:   float
    dest_lon:   float
    hour:       int | None = None    # if None → use server's current hour


@app.post("/route")
def get_route(req: RouteRequest):
    hour = req.hour if req.hour is not None else datetime.now().hour
    return engine.get_routes(
        req.origin_lat, req.origin_lon,
        req.dest_lat,   req.dest_lon,
        hour
    )


@app.get("/safety")
def get_safety(lat: float, lon: float, hour: int | None = None):
    hour = hour if hour is not None else datetime.now().hour
    return scorer.score(lat, lon, hour)


@app.get("/heatmap/{city}")
def get_heatmap(city: str):
    """Return all place safety scores for the heatmap overlay."""
    grid = scorer.grid[scorer.grid["city"] == city]
    hour = datetime.now().hour
    points = []
    for _, row in grid.iterrows():
        s = scorer.score(row["lat"], row["lon"], hour)
        points.append({
            "lat": row["lat"],
            "lon": row["lon"],
            "place": row["place"],
            "safety": s["safety_score"],
            "weight": 1.0 - s["safety_score"],   # heatmap: higher = more danger
        })
    return {"city": city, "points": points, "hour": hour}


@app.websocket("/location")
async def location_ws(ws: WebSocket):
    """WebSocket: receive GPS updates, return real-time safety score."""
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            payload = json.loads(data)
            hour  = datetime.now().hour
            score = scorer.score(payload["lat"], payload["lon"], hour)
            await ws.send_text(json.dumps(score))
    except Exception:
        pass
