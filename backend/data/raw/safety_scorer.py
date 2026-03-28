import pickle
import json
import numpy as np
import pandas as pd
from pathlib import Path

PROC = Path("data/processed")

# Which factors matter more at each time slot
# Weights must sum to 1.0 for each slot
SLOT_WEIGHTS = {
    "early_morning": {"crime": 0.30, "dark": 0.50, "time": 0.20},
    "morning":       {"crime": 0.45, "dark": 0.10, "time": 0.45},
    "afternoon":     {"crime": 0.45, "dark": 0.05, "time": 0.50},
    "evening":       {"crime": 0.35, "dark": 0.35, "time": 0.30},
}

def hour_to_slot(hour: int) -> str:
    """Match your TimeBucket CSV exactly."""
    if  0 <= hour <= 5:  return "early_morning"   # 00:00–06:00
    if  6 <= hour <= 11: return "morning"           # 06:01–12:00
    if 12 <= hour <= 17: return "afternoon"         # 12:01–18:00
    return "evening"                                 # 18:01–23:59


class SafetyScorer:
    def __init__(self):
        with open(PROC / "safety_index.pkl", "rb") as f:
            data = pickle.load(f)
        self.grid: pd.DataFrame = data["grid"]
        self.tree = data["tree"]

        with open(PROC / "hour_risk.json") as f:
            self.hour_risk: dict = json.load(f)
        with open(PROC / "slot_risk.json") as f:
            self.slot_risk: dict = json.load(f)

    def _nearest_places(self, lat: float, lon: float, k: int = 3) -> pd.DataFrame:
        k = min(k, len(self.grid))
        dists, idxs = self.tree.query([lat, lon], k=k)
        rows = self.grid.iloc[idxs].copy()
        rows["dist"] = dists if k > 1 else [dists]
        # Inverse-distance weights — closer place counts more
        rows["w"] = 1.0 / (rows["dist"] + 1e-6)
        rows["w"] /= rows["w"].sum()
        return rows

    def score(self, lat: float, lon: float, hour: int) -> dict:
        slot   = hour_to_slot(hour)
        wts    = SLOT_WEIGHTS[slot]
        rows   = self._nearest_places(lat, lon)

        crime_score = float((rows["crime_score"] * rows["w"]).sum())
        dark_score  = float((rows["dark_score"]  * rows["w"]).sum())

        # Hourly risk from your timestamp CSV (0–1)
        hour_risk_val = self.hour_risk.get(str(hour), 0.5)

        # Slot risk from your TimeBucket CSV (already normalized to 0–1 in preprocessor)
        slot_risk_val = self.slot_risk.get(slot, 0.5)

        # Combined time risk = average of hour-level and slot-level
        time_risk = (hour_risk_val + slot_risk_val) / 2.0

        danger = (
            wts["crime"] * crime_score +
            wts["dark"]  * dark_score  +
            wts["time"]  * time_risk
        )
        safety = round(1.0 - min(danger, 1.0), 3)

        return {
            "safety_score": safety,
            "danger_score": round(danger, 3),
            "slot": slot,
            "nearest_place": rows.iloc[0]["Place"],
            "breakdown": {
                "crime_risk":    round(crime_score, 3),
                "lighting_safety": round(1.0 - dark_score, 3),
                "time_risk":     round(time_risk, 3),
            }
        }