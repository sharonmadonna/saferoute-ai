import pandas as pd
import numpy as np
import os
from datetime import datetime


class SafetyScorer:
    """
    Calculates comprehensive safety scores for locations and routes based on:
    - Crime frequency by location
    - Street lighting availability
    - Time of day impact
    - Route intersection safety
    """

    def __init__(self, location_safety_path='data/processed/location_safety_scores.csv',
                 time_slots_path='data/processed/time_slot_safety.csv'):
        """
        Initialize the safety scorer with preprocessed data.

        Args:
            location_safety_path (str): Path to location safety scores CSV
            time_slots_path (str): Path to time slot safety CSV
        """
        self.location_scores = None
        self.time_slots = None
        self.location_index = {}
        self.load_data(location_safety_path, time_slots_path)

    def load_data(self, location_safety_path, time_slots_path):
        """Load preprocessed safety data."""
        try:
            self.location_scores = pd.read_csv(location_safety_path)
            self.time_slots = pd.read_csv(time_slots_path)

            # Remove locations with NaN safety scores
            self.location_scores = self.location_scores.dropna(subset=['Location_Safety_Score'])

            # Create location index for quick lookup
            for idx, row in self.location_scores.iterrows():
                location_name = row['Place'].strip().lower()
                self.location_index[location_name] = idx

            print(f"✓ Safety data loaded: {len(self.location_scores)} valid locations (time periods: {len(self.time_slots)})")
            return True
        except FileNotFoundError as e:
            print(f"✗ Error loading safety data: {e}")
            print(f"   Make sure to run data_preprocessor.py first to generate processed data")
            return False

    def get_time_period(self, hour):
        """
        Get time period for a given hour (0-23).

        Args:
            hour (int): Hour of day (0-23)

        Returns:
            tuple: (time_period_name, safety_score)
        """
        if 0 <= hour < 6:
            period = "Early Morning"
        elif 6 <= hour < 12:
            period = "Morning"
        elif 12 <= hour < 18:
            period = "Afternoon"
        else:
            period = "Evening"

        time_row = self.time_slots[self.time_slots['Time Bucket'] == period]
        if not time_row.empty:
            safety_score = time_row.iloc[0]['Safety Score (1-10)']
            return period, float(safety_score)
        return period, 5.0

    def get_location_safety_score(self, location_name):
        """
        Get base safety score for a location.

        Args:
            location_name (str): Name of the location

        Returns:
            float: Safety score (0-10) or None if location not found
        """
        location_key = location_name.strip().lower()

        if location_key in self.location_index:
            idx = self.location_index[location_key]
            score = self.location_scores.iloc[idx]['Location_Safety_Score']
            return float(score)

        # Fuzzy match if exact match not found
        for loc_key in self.location_index.keys():
            if location_key in loc_key or loc_key in location_key:
                idx = self.location_index[loc_key]
                score = self.location_scores.iloc[idx]['Location_Safety_Score']
                print(f"  (Matched '{location_name}' to '{loc_key}')")
                return float(score)

        print(f"✗ Location '{location_name}' not found in database")
        return None

    def get_time_adjusted_score(self, location_name, hour):
        """
        Get safety score for a location at a specific time.

        Args:
            location_name (str): Name of the location
            hour (int): Hour of day (0-23)

        Returns:
            float: Time-adjusted safety score (0-10)
        """
        location_score = self.get_location_safety_score(location_name)
        if location_score is None:
            return None

        time_period, time_score = self.get_time_period(hour)

        # Combine scores: location baseline (70%) + time factor (30%)
        combined_score = (location_score * 0.7) + (time_score * 0.3)
        return round(combined_score, 2)

    def get_route_safety_score(self, locations, hour=None):
        """
        Calculate safety score for a route (sequence of locations).

        Args:
            locations (list): List of location names in route order
            hour (int): Hour of day (0-23). If None, uses current time

        Returns:
            dict: Route safety analysis
        """
        if hour is None:
            hour = datetime.now().hour

        time_period, _ = self.get_time_period(hour)

        route_scores = []
        location_details = []

        for location in locations:
            score = self.get_time_adjusted_score(location, hour)
            if score is not None:
                route_scores.append(score)
                location_details.append({
                    'location': location,
                    'safety_score': score
                })

        if not route_scores:
            return {'error': 'No valid locations in route'}

        avg_score = np.mean(route_scores)
        min_score = np.min(route_scores)
        max_score = np.max(route_scores)

        # Risk assessment
        if avg_score >= 7:
            risk_level = "Low Risk"
        elif avg_score >= 5:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"

        return {
            'route_locations': locations,
            'time_period': time_period,
            'hour': hour,
            'location_scores': location_details,
            'average_safety_score': round(avg_score, 2),
            'min_safety_score': round(min_score, 2),
            'max_safety_score': round(max_score, 2),
            'risk_level': risk_level,
            'recommendations': self._get_recommendations(avg_score, hour)
        }

    def compare_routes(self, routes, hour=None):
        """
        Compare safety scores for multiple routes.

        Args:
            routes (list): List of routes, each route is a list of locations
            hour (int): Hour of day (0-23)

        Returns:
            list: Sorted routes by safety score (best first)
        """
        route_analyses = []

        for i, route in enumerate(routes):
            analysis = self.get_route_safety_score(route, hour)
            analysis['route_id'] = i + 1
            route_analyses.append(analysis)

        # Sort by average safety score (descending)
        route_analyses.sort(key=lambda x: x['average_safety_score'], reverse=True)

        return route_analyses

    def get_safest_locations(self, top_n=10):
        """
        Get the safest locations in the city.

        Args:
            top_n (int): Number of top locations to return

        Returns:
            DataFrame: Top N safest locations
        """
        return self.location_scores.nlargest(top_n, 'Location_Safety_Score')[
            ['Place', 'Location_Safety_Score', 'Total_Crimes', 'Lighting_Efficiency']
        ]

    def get_most_dangerous_locations(self, top_n=10):
        """
        Get the most dangerous locations in the city.

        Args:
            top_n (int): Number of dangerous locations to return

        Returns:
            DataFrame: Top N most dangerous locations
        """
        return self.location_scores.nsmallest(top_n, 'Location_Safety_Score')[
            ['Place', 'Location_Safety_Score', 'Total_Crimes', 'Lighting_Efficiency']
        ]

    def get_time_based_recommendations(self):
        """Get safety recommendations for each time period."""
        recommendations = []
        for _, row in self.time_slots.iterrows():
            recommendations.append({
                'time_period': row['Time Bucket'],
                'hours': row['Hours'],
                'incident_count': row['Incident Count'],
                'safety_score': row['Safety Score (1-10)'],
                'note': row['Notes']
            })
        return recommendations

    @staticmethod
    def _get_recommendations(avg_score, hour):
        """Generate recommendations based on safety score and time."""
        recommendations = []

        if avg_score < 5:
            recommendations.append("⚠️  CAUTION: Route passes through high-risk areas")
            recommendations.append("   Consider taking a different route or traveling with others")

        if avg_score < 3:
            recommendations.append("❌ NOT RECOMMENDED: Route has very high risk")
            recommendations.append("   Strongly suggest using alternative routes")

        if hour < 6:
            recommendations.append("⚠️  Early morning travel: Highest crime period. Exercise extra caution")
        elif hour >= 18:
            recommendations.append("⚠️  Evening travel: Increased crime risk after dark")
        elif 12 <= hour < 18:
            recommendations.append("✓ Afternoon travel: Safest time period")

        if not recommendations:
            recommendations.append("✓ Generally safe to travel this route at this time")

        return recommendations


if __name__ == '__main__':
    # Example usage
    print("=" * 60)
    print("SafeRoute AI - Safety Scorer")
    print("=" * 60)

    scorer = SafetyScorer()

    # Test 1: Get safest locations
    print("\n📍 Top 5 Safest Locations:")
    print(scorer.get_safest_locations(5))

    # Test 2: Get most dangerous locations
    print("\n⚠️  Top 5 Most Dangerous Locations:")
    print(scorer.get_most_dangerous_locations(5))

    # Test 3: Compare routes
    print("\n🛣️  Comparing Routes (2:00 PM):")
    routes = [
        ["Teynampet", "Porur", "Besant Nagar"],
        ["Sholinganallur", "Tambaram", "Chromepet"],
        ["Guindy", "T Nagar", "Ambattur"]
    ]
    route_comparisons = scorer.compare_routes(routes, hour=14)
    for route in route_comparisons:
        print(f"\n  Route {route['route_id']}: {' → '.join(route['route_locations'])}")
        print(f"  Safety Score: {route['average_safety_score']}/10 ({route['risk_level']})")
        for rec in route['recommendations']:
            print(f"  {rec}")

    # Test 4: Time-based recommendations
    print("\n⏰ Safety by Time Period:")
    print(scorer.get_time_based_recommendations())
