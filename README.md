# SafeRoute AI

SafeRoute AI is a Python-based safety-first route recommendation system for Chennai.

It combines:
- crime frequency by area,
- street lighting quality,
- time-of-day risk,
- and location-aware routing

to suggest safer travel routes.

## What the application does

The application performs five major tasks:

1. Data preprocessing
- Loads raw CSV datasets from `backend/data/raw/`.
- Cleans and normalizes crime, lighting, and time-slot data.
- Produces processed safety datasets in `backend/data/processed/`.

2. Safety scoring
- Computes a location safety score (0-10) for each valid area.
- Applies time adjustments for morning/afternoon/evening risk windows.
- Classifies risk levels as Low, Moderate, or High.

3. Route optimization
- Builds a weighted graph of known locations.
- Uses Dijkstra-based search to find safest routes.
- Supports alternative route generation and route comparison.

4. Live location support
- Auto-detects current location using IP geolocation.
- Maps detected coordinates to the nearest supported SafeRoute area.
- Allows manual location override by name/list/GPS.

5. Interactive CLI
- Provides a menu-driven console interface for all major features.

## Project structure

```
saferoute-ai/
  backend/
    main.py
    data_preprocessor.py
    safety_scorer.py
    route_engine.py
    location_detector.py
    requirements.txt
    data/
      raw/
      processed/
```

## Data sources used

Raw input files currently used:
- `crime_data_chennai.csv`
- `crime_timestamps_chennai.csv`
- `street_lighting_chennai.csv`
- `time_slots_chennai.csv`

Processed outputs generated:
- `location_safety_scores.csv`
- `time_slot_safety.csv`

## How scoring works

## 1) Base location score
For each area, the system computes:
- Crime score (safer if crime count is lower)
- Lighting score (safer if lighting efficiency is higher)

Then combines them into:
- `Location_Safety_Score = Crime_Score + Lighting_Score` (0-10 range)

## 2) Time-adjusted score
For a requested hour, the system maps to one of:
- Early Morning: 00:00-05:59
- Morning: 06:00-11:59
- Afternoon: 12:00-17:59
- Evening: 18:00-23:59

Then computes:
- `Final_Safety = 0.7 * Location_Score + 0.3 * Time_Score`

## 3) Route safety
For each candidate route:
- safety is computed per location,
- aggregated to average/min/max,
- and translated to a risk label.

## Setup and run

## Prerequisites
- Python 3.10+ recommended
- Internet connection (for auto location detection)

## Installation
From the project root:

```bash
cd backend
pip install -r requirements.txt
```

## Run the app

```bash
cd backend
python main.py
```

On startup, the system:
1. checks/creates processed data,
2. loads scoring and routing modules,
3. auto-detects your live location,
4. starts the interactive menu.

## CLI usage guide

When you run `python main.py`, you get this menu:

1. Get Route Recommendation
2. Get Alternative Routes
3. Auto-Detect Live Location (GPS/IP)
4. Manually Set Current Location
5. Get Route from Current Location
6. Check Location Safety
7. View Current Location Info
8. View Safest Locations
9. View Most Dangerous Locations
10. View Safety by Time Period
11. Search Locations
12. System Status
13. Exit

## Typical flow

1. Launch app.
2. Use Option 3 to auto-detect location (or Option 4 to set manually).
3. Use Option 5 to route from your current location.
4. Use Option 2 for alternatives.
5. Use Option 6/8/9/10 for safety analysis.

## Supported locations

Current routing/scoring dataset includes these areas:
- Adyar
- Anna Nagar
- Chromepet
- Guindy
- Kodambakkam
- Mylapore
- Nungambakkam
- Perambur
- Porur
- Royapettah
- Sholinganallur
- T Nagar
- Tambaram
- Velachery

If a location outside this set is entered, route lookup may fail.
Use Option 11 (Search Locations) to find valid names.

## Key modules

- `main.py`
  - Main app orchestration and CLI.
- `data_preprocessor.py`
  - Reads and transforms raw data into processed safety datasets.
- `safety_scorer.py`
  - Computes location/time/route safety and risk labels.
- `route_engine.py`
  - Builds route graph and finds safest path(s).
- `location_detector.py`
  - Handles auto/manual location setting and nearest-area mapping.

## Troubleshooting

## Error: "Could not find valid locations"
Possible reasons:
- area name not in supported dataset,
- typo in location name,
- current location not set.

Fix:
- Use Option 11 to search valid location names.
- Use Option 3 or 4 to set current location.
- Check Option 12 (System Status).

## Auto-detect did not work
Possible reasons:
- no internet connection,
- geolocation provider unavailable.

Fix:
- Use Option 4 to set location manually.

## Dependencies not found
Run:

```bash
cd backend
pip install -r requirements.txt
```

## Current limitations

- Routing uses a heuristic complete-graph model, not real road network distances.
- Live location uses IP geolocation (approximate), not device GPS sensor integration.
- The system currently supports the locations present in processed Chennai datasets.

## Future improvements

- Integrate real map APIs and road graph distances.
- Add FastAPI/Flask service and frontend.
- Add model tuning and dynamic incident feed ingestion.
- Add unit tests and CI pipeline.

## Quick start example (Python API)

```python
from main import SafeRouteAI

app = SafeRouteAI()
app.initialize()

# Auto-detect live location again (optional)
app.auto_detect_current_location()

# Route from current location to destination
result = app.get_route_from_current_location("Adyar", hour=14)
print(result)
```

---

If you want, I can also generate a second README inside `backend/` focused only on developer/API usage for each class and method.
