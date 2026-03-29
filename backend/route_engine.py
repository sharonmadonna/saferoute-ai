import heapq
import numpy as np
from collections import defaultdict
from itertools import combinations
import pandas as pd


class RouteEngine:
    """
    Route optimization engine that finds the safest path between two locations
    using graph algorithms and safety scoring.
    """

    def __init__(self, safety_scorer):
        """
        Initialize the route engine with a safety scorer.

        Args:
            safety_scorer: SafetyScorer instance with location data
        """
        self.safety_scorer = safety_scorer
        self.graph = self._build_graph()
        self.locations = self._get_all_locations()

    def _build_graph(self):
        """
        Build a complete graph where nodes are locations and edges have safety weights.

        Returns:
            dict: Adjacency list representation of the graph
        """
        graph = defaultdict(list)
        locations = self._get_all_locations()

        # Create edges between all location pairs
        for loc_a, loc_b in combinations(locations, 2):
            # Distance heuristic (could be replaced with actual distances)
            # For now, we use inverse of average safety score as "distance"
            score_a = self.safety_scorer.get_location_safety_score(loc_a)
            score_b = self.safety_scorer.get_location_safety_score(loc_b)

            if score_a is not None and score_b is not None:
                avg_score = (score_a + score_b) / 2
                # Convert to edge weight (lower = safer, but normalized)
                edge_weight = (10 - avg_score) / 10
                graph[loc_a].append((loc_b, edge_weight, avg_score))
                graph[loc_b].append((loc_a, edge_weight, avg_score))

        return graph

    def _get_all_locations(self):
        """Get all unique locations from the safety scorer."""
        if self.safety_scorer.location_scores is not None:
            return self.safety_scorer.location_scores['Place'].str.strip().tolist()
        return []

    def find_safest_route_dijkstra(self, start_location, end_location, hour=None):
        """
        Find the safest route between two locations using Dijkstra's algorithm.
        Prioritizes safety over shortest path.

        Args:
            start_location (str): Starting location name
            end_location (str): Ending location name
            hour (int): Hour of day (0-23) for time-adjusted scoring

        Returns:
            dict: Route information including path, safety metrics, and recommendations
        """
        if hour is None:
            from datetime import datetime
            hour = datetime.now().hour

        start = self._find_location_match(start_location)
        end = self._find_location_match(end_location)

        if not start or not end:
            return {
                'error': f'Could not find valid locations. Start: {start}, End: {end}'
            }

        # Dijkstra's algorithm: find path with minimum risk (maximum safety)
        distances = {loc: float('inf') for loc in self.locations}
        distances[start] = 0
        previous = {loc: None for loc in self.locations}
        visited = set()

        pq = [(0, start)]

        while pq:
            current_dist, current_loc = heapq.heappop(pq)

            if current_loc in visited:
                continue

            visited.add(current_loc)

            if current_loc == end:
                break

            # Check neighbors in graph
            if current_loc in self.graph:
                for neighbor, edge_weight, _ in self.graph[current_loc]:
                    if neighbor not in visited:
                        # Adjust edge weight based on time of day
                        time_factor = self._get_time_safety_factor(neighbor, hour)
                        adjusted_weight = edge_weight * (1 - time_factor / 10)

                        new_dist = current_dist + adjusted_weight
                        if new_dist < distances[neighbor]:
                            distances[neighbor] = new_dist
                            previous[neighbor] = current_loc
                            heapq.heappush(pq, (new_dist, neighbor))

        # Reconstruct path
        if distances[end] == float('inf'):
            return {
                'error': f'No route found between {start} and {end}'
            }

        path = []
        current = end
        while current is not None:
            path.append(current)
            current = previous[current]
        path.reverse()

        return self._analyze_route(path, hour)

    def find_alternative_routes(self, start_location, end_location, num_routes=3, hour=None):
        """
        Find multiple alternative routes and rank by safety.

        Args:
            start_location (str): Starting location
            end_location (str): Ending location
            num_routes (int): Number of alternative routes to find
            hour (int): Hour of day (0-23)

        Returns:
            list: Multiple routes ranked by safety score
        """
        if hour is None:
            from datetime import datetime
            hour = datetime.now().hour

        start = self._find_location_match(start_location)
        end = self._find_location_match(end_location)

        if not start or not end:
            return [{'error': 'Invalid start or end location'}]

        # Find multiple paths using KNN approach
        all_routes = self._find_k_shortest_paths(start, end, k=num_routes, hour=hour)

        return all_routes

    def _find_k_shortest_paths(self, start, end, k=3, hour=None):
        """
        Find K shortest (safest) paths between two nodes.

        Args:
            start: Start node
            end: End node
            k: Number of paths to find
            hour: Hour of day

        Returns:
            list: K best routes analyzed
        """
        routes_found = []
        blocked_edges = set()

        for _ in range(k):
            # Find best route with previously found edges penalized
            path = self._dijkstra_with_penalties(start, end, blocked_edges, hour)

            if path and len(path) > 1:
                # Block edges in this path for next iteration
                for i in range(len(path) - 1):
                    blocked_edges.add((min(path[i], path[i + 1]), max(path[i], path[i + 1])))

                route_info = self._analyze_route(path, hour)
                routes_found.append(route_info)

        return routes_found

    def _dijkstra_with_penalties(self, start, end, blocked_edges, hour):
        """Modified Dijkstra with edge penalties for alternative routes."""
        distances = {loc: float('inf') for loc in self.locations}
        distances[start] = 0
        previous = {loc: None for loc in self.locations}
        visited = set()

        pq = [(0, start)]

        while pq:
            current_dist, current_loc = heapq.heappop(pq)

            if current_loc in visited:
                continue

            visited.add(current_loc)

            if current_loc == end:
                break

            if current_loc in self.graph:
                for neighbor, edge_weight, _ in self.graph[current_loc]:
                    if neighbor not in visited:
                        edge_tuple = (min(current_loc, neighbor), max(current_loc, neighbor))
                        penalty = 2.0 if edge_tuple in blocked_edges else 0
                        time_factor = self._get_time_safety_factor(neighbor, hour)
                        adjusted_weight = (edge_weight + penalty) * (1 - time_factor / 10)

                        new_dist = current_dist + adjusted_weight
                        if new_dist < distances[neighbor]:
                            distances[neighbor] = new_dist
                            previous[neighbor] = current_loc
                            heapq.heappush(pq, (new_dist, neighbor))

        # Reconstruct path
        if distances[end] == float('inf'):
            return None

        path = []
        current = end
        while current is not None:
            path.append(current)
            current = previous[current]
        path.reverse()

        return path

    def _find_location_match(self, location_name):
        """Find best matching location from available locations."""
        location_key = location_name.strip().lower()

        # Exact match
        for loc in self.locations:
            if loc.lower() == location_key:
                return loc

        # Fuzzy match
        for loc in self.locations:
            if location_key in loc.lower() or loc.lower() in location_key:
                return loc

        return None

    def _get_time_safety_factor(self, location, hour):
        """Get time-adjusted safety factor for a location."""
        score = self.safety_scorer.get_time_adjusted_score(location, hour)
        return score if score is not None else 5.0

    def _analyze_route(self, path, hour):
        """Analyze a route and return metrics."""
        route_analysis = self.safety_scorer.get_route_safety_score(path, hour)
        route_analysis['path_length'] = len(path)
        return route_analysis

    def get_location_suggestions(self, partial_name, limit=5):
        """
        Get location suggestions based on partial name match.

        Args:
            partial_name (str): Partial location name
            limit (int): Maximum suggestions to return

        Returns:
            list: Matching locations
        """
        partial_key = partial_name.strip().lower()
        matches = []

        for loc in self.locations:
            if partial_key in loc.lower():
                matches.append(loc)

        return matches[:limit]

    def get_route_summary(self, start, end, hour=None):
        """
        Get a quick summary of safety between two locations.

        Args:
            start: Start location
            end: End location
            hour: Hour of day

        Returns:
            dict: Quick summary
        """
        route = self.find_safest_route_dijkstra(start, end, hour)
        if 'error' in route:
            return route

        summary = {
            'start': start,
            'end': end,
            'safest_path': route['route_locations'],
            'safety_score': route['average_safety_score'],
            'risk_level': route['risk_level'],
            'stops': len(route['route_locations']),
            'key_recommendation': route['recommendations'][0] if route['recommendations'] else "No data"
        }

        return summary


if __name__ == '__main__':
    # Example usage (requires running data_preprocessor.py first)
    from safety_scorer import SafetyScorer

    print("=" * 60)
    print("SafeRoute AI - Route Engine")
    print("=" * 60)

    scorer = SafetyScorer()
    engine = RouteEngine(scorer)

    # Test 1: Find safest route
    print("\n🛣️  Finding Safest Route (2:00 PM):")
    route = engine.find_safest_route_dijkstra("Teynampet", "Tambaram", hour=14)
    if 'error' not in route:
        print(f"  Path: {' → '.join(route['route_locations'])}")
        print(f"  Safety Score: {route['average_safety_score']}/10")
        print(f"  Risk Level: {route['risk_level']}")
        for rec in route['recommendations']:
            print(f"  {rec}")

    # Test 2: Find alternative routes
    print("\n🔄 Finding Alternative Routes:")
    alternatives = engine.find_alternative_routes("Porur", "Guindy", num_routes=2, hour=20)
    for i, alt_route in enumerate(alternatives):
        if 'error' not in alt_route:
            print(f"\n  Route {i + 1}: {' → '.join(alt_route['route_locations'])}")
            print(f"  Safety Score: {alt_route['average_safety_score']}/10")

    # Test 3: Route summary
    print("\n📋 Route Summary:")
    summary = engine.get_route_summary("Sholinganallur", "T Nagar", hour=18)
    if 'error' not in summary:
        print(f"  {summary['start']} → {summary['end']}")
        print(f"  Risk Level: {summary['risk_level']} (Score: {summary['safety_score']}/10)")
