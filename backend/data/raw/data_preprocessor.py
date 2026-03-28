import pandas as pd
import numpy as np
import pickle
import json
import osmnx as ox
from pathlib import Path
from scipy.spatial import KDTree

RAW  = Path("data/raw")
PROC = Path("data/processed")
PROC.mkdir(parents=True, exist_ok=True)

# Severity weights per crime type — based on your actual Type_of_Crime values
CRIME_SEVERITY = {
    "Murder":                    5,
    "Rape / Sexual Assault":     5,
    "Assault / Attack":          4,
    "Chain Snatching / Theft":   3,
    "Theft / Robbery":           3,
    "Harassment / Cyber-crime":  2,
    "Other Crime":               1,
}

def build_crime_scores() -> pd.DataFrame:
    """
    Reads crime_data_chennai.csv (Place, Type_of_Crime, Year)
    Returns one row per Place with a normalized crime_score (0-1).
    """
    df = pd.read_csv(RAW / "crime_data_chennai.csv")
    df["Place"] = df["Place"].str.strip()
    df["Type_of_Crime"] = df["Type_of_Crime"].str.strip()

    # Map crime type to severity number
    df["severity"] = df["Type_of_Crime"].map(CRIME_SEVERITY).fillna(1)

    # Aggregate per place: weighted incident count
    agg = (df.groupby("Place")
             .agg(incident_count=("severity", "count"),
                  avg_severity=("severity", "mean"))
             .reset_index())

    # Weighted score = count × avg_severity, normalized 0–1
    raw_score = agg["incident_count"] * agg["avg_severity"]
    agg["crime_score"] = raw_score / raw_score.max()

    return agg[["Place", "crime_score", "incident_count"]]


def build_lighting_scores() -> pd.DataFrame:
    """
    Reads street_lighting_chennai.csv (Area, Total_Street_Lights, Working_Lights, Not_Working_Lights)
    Returns one row per Area with dark_score (0=fully lit, 1=fully dark).
    """
    df = pd.read_csv(RAW / "street_lighting_chennai.csv")
    df["Area"] = df["Area"].str.strip()

    # Aggregate multiple rows for same area (dataset has duplicates)
    agg = df.groupby("Area").agg(
        total=("Total_Street_Lights", "sum"),
        working=("Working_Lights", "sum")
    ).reset_index()

    agg["lit_pct"] = (agg["working"] / agg["total"]).clip(0, 1)
    agg["dark_score"] = 1.0 - agg["lit_pct"]   # 1 = very dark = dangerous
    agg.rename(columns={"Area": "Place"}, inplace=True)

    return agg[["Place", "dark_score", "lit_pct"]]


def build_hour_risk() -> dict:
    """
    Reads crime_timestamps_chennai.csv (Date of Occurrence as datetime string).
    Returns {hour: normalized_risk} for 0–23.
    """
    df = pd.read_csv(RAW / "crime_timestamps_chennai.csv")
    df.columns = ["datetime"]
    df["hour"] = pd.to_datetime(df["datetime"], format="%d-%m-%Y %H:%M", errors="coerce").dt.hour
    df = df.dropna(subset=["hour"])

    hour_counts = df["hour"].value_counts().sort_index()
    # Fill missing hours with 0
    all_hours = pd.Series(0, index=range(24))
    all_hours.update(hour_counts)
    # Normalize to 0–1
    normalized = (all_hours / all_hours.max()).round(4)
    return normalized.to_dict()


def build_slot_risks() -> dict:
    """
    Reads time_slots_chennai.csv (Time Bucket, Hours, Incident Count, Safety Score (1-10))
    Returns {"early_morning": risk, "morning": risk, "afternoon": risk, "evening": risk}
    Safety score 1-10 where 10=safe → convert to risk: risk = (10 - score) / 9
    """
    df = pd.read_csv(RAW / "time_slots_chennai.csv")
    df.columns = [c.strip() for c in df.columns]

    slot_map = {
        "Early Morning": "early_morning",
        "Morning":       "morning",
        "Afternoon":     "afternoon",
        "Evening":       "evening",
    }

    result = {}
    for _, row in df.iterrows():
        key = slot_map.get(str(row["Time Bucket"]).strip(), "other")
        score_10 = float(row["Safety Score (1-10)"])
        risk = (10 - score_10) / 9.0   # normalize: score=10 → risk=0, score=1 → risk=1
        result[key] = round(risk, 4)

    return result


def geocode_places(place_names: list, city_query: str) -> dict:
    """Geocode each place name to (lat, lon). Caches result."""
    cache = PROC / "place_coords_chennai.json"
    if cache.exists():
        print("Using cached geocodes.")
        return json.loads(cache.read_text())

    coords = {}
    for place in place_names:
        try:
            lat, lon = ox.geocoder.geocode(f"{place}, {city_query}")
            coords[place] = [lat, lon]
            print(f"  ✓ {place} → ({lat:.4f}, {lon:.4f})")
        except Exception as e:
            print(f"  ✗ {place}: {e}")

    cache.write_text(json.dumps(coords, indent=2))
    return coords


if __name__ == "__main__":
    print("=== Step 1: Building crime scores ===")
    crime_df = build_crime_scores()
    print(crime_df.head())

    print("\n=== Step 2: Building lighting scores ===")
    light_df = build_lighting_scores()
    print(light_df.head())

    print("\n=== Step 3: Building hourly risk profile ===")
    hour_risk = build_hour_risk()
    print("Hour risks (sample):", dict(list(hour_risk.items())[:6]))

    print("\n=== Step 4: Building slot risks ===")
    slot_risk = build_slot_risks()
    print("Slot risks:", slot_risk)

    # Merge crime + lighting on place name
    # Standardize: crime uses "Place", lighting uses "Place" (renamed)
    merged = pd.merge(crime_df, light_df, on="Place", how="outer")
    merged["crime_score"] = merged["crime_score"].fillna(merged["crime_score"].median())
    merged["dark_score"]  = merged["dark_score"].fillna(0.5)
    merged["city"]        = "chennai"

    # Geocode all unique places
    all_places = merged["Place"].unique().tolist()
    print(f"\n=== Step 5: Geocoding {len(all_places)} places ===")
    coords = geocode_places(all_places, "Chennai, Tamil Nadu, India")

    merged["lat"] = merged["Place"].map(lambda p: coords.get(p, [None, None])[0])
    merged["lon"] = merged["Place"].map(lambda p: coords.get(p, [None, None])[1])
    merged = merged.dropna(subset=["lat", "lon"])
    print(f"  {len(merged)} places geocoded successfully")

    # Save merged grid
    merged.to_csv(PROC / "safety_grid.csv", index=False)

    # Save hour + slot risk as JSON (loaded by scorer at runtime)
    with open(PROC / "hour_risk.json", "w") as f:
        json.dump(hour_risk, f)
    with open(PROC / "slot_risk.json", "w") as f:
        json.dump(slot_risk, f)

    # Build KDTree for spatial lookup
    coords_arr = merged[["lat", "lon"]].values
    tree = KDTree(coords_arr)
    with open(PROC / "safety_index.pkl", "wb") as f:
        pickle.dump({"grid": merged, "tree": tree}, f)
    print("✅ safety_index.pkl saved")

    # Download OSM walk graph for Chennai
    graphml_path = PROC / "osm_graph_chennai.graphml"
    if not graphml_path.exists():
        print("\n=== Step 6: Downloading OSM graph for Chennai ===")
        G = ox.graph_from_place("Chennai, Tamil Nadu, India", network_type="walk")
        ox.save_graphml(G, filepath=str(graphml_path))
        print("✅ OSM graph saved")
    else:
        print("\nOSM graph already cached.")

    print("\n✅ All preprocessing done.")