import osmnx as ox
import networkx as nx
import numpy as np
from pathlib import Path
from safety_scorer import SafetyScorer

PROC = Path("data/processed")

# Bounding box for Chennai — used to verify coordinates are in city
CHENNAI_BOUNDS = (12.7, 13.25, 79.9, 80.35)  # min_lat, max_lat, min_lon, max_lon


class RouteEngine:
    def __init__(self, scorer: SafetyScorer):
        self.scorer = scorer
        self._graph = None

    def _load_graph(self):
        if self._graph is None:
            path = PROC / "osm_graph_chennai.graphml"
            print("Loading Chennai OSM graph...")
            self._graph = ox.load_graphml(str(path))
        return self._graph

    def _apply_weights(self, G, hour: int):
        for u, v, key, data in G.edges(keys=True, data=True):
            node = G.nodes[u]
            lat, lon = node["y"], node["x"]
            result = self.scorer.score(lat, lon, hour)
            safety = result["safety_score"]
            dist = data.get("length", 50)
            # Safe road: cost ≈ distance. Dangerous road: up to 4× distance.
            data["safety_cost"]  = dist * (1 + 3.0 * (1 - safety))
            data["safety_score"] = safety
            data["breakdown"]    = result["breakdown"]

    def _route_stats(self, G, nodes: list) -> dict:
        scores, lengths = [], []
        for i in range(len(nodes) - 1):
            u, v = nodes[i], nodes[i + 1]
            edge = min(G[u][v].values(), key=lambda d: d.get("length", 999))
            scores.append(edge.get("safety_score", 0.7))
            lengths.append(edge.get("length", 50))
        return {
            "avg_safety":    round(float(np.mean(scores)), 2) if scores else 0.7,
            "distance_m":    round(sum(lengths)),
            "est_walk_min":  round(sum(lengths) / 80),
        }

    def _to_geojson(self, G, nodes: list, label: str, stats: dict) -> dict:
        coords = [(G.nodes[n]["x"], G.nodes[n]["y"]) for n in nodes]
        color = "#22c55e" if stats["avg_safety"] >= 0.75 else \
                "#f59e0b" if stats["avg_safety"] >= 0.50 else "#ef4444"
        return {
            "type": "Feature",
            "properties": {**stats, "label": label, "color": color},
            "geometry":   {"type": "LineString", "coordinates": coords},
        }

    def get_routes(self, orig_lat, orig_lon, dest_lat, dest_lon, hour: int) -> dict:
        G = self._load_graph()
        self._apply_weights(G, hour)

        orig = ox.nearest_nodes(G, orig_lon, orig_lat)
        dest = ox.nearest_nodes(G, dest_lon, dest_lat)

        # 1. Safest — minimize danger-penalized cost
        safe_nodes  = nx.shortest_path(G, orig, dest, weight="safety_cost")
        safe_stats  = self._route_stats(G, safe_nodes)

        # 2. Fastest — minimize raw distance
        fast_nodes  = nx.shortest_path(G, orig, dest, weight="length")
        fast_stats  = self._route_stats(G, fast_nodes)

        # 3. Balanced — equal blend
        for u, v, key, data in G.edges(keys=True, data=True):
            data["balanced_cost"] = (data.get("length", 50) + data.get("safety_cost", 50)) / 2
        bal_nodes  = nx.shortest_path(G, orig, dest, weight="balanced_cost")
        bal_stats  = self._route_stats(G, bal_nodes)

        return {
            "city": "chennai",
            "hour": hour,
            "routes": {
                "safest":   self._to_geojson(G, safe_nodes, "safest",   safe_stats),
                "fastest":  self._to_geojson(G, fast_nodes, "fastest",  fast_stats),
                "balanced": self._to_geojson(G, bal_nodes,  "balanced", bal_stats),
            }
        }
