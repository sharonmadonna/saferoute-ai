"""
SafeRoute AI - Main Application Interface
Coordinates data preprocessing, safety scoring, and route optimization
"""

from data_preprocessor import DataPreprocessor
from safety_scorer import SafetyScorer
from route_engine import RouteEngine
from location_detector import LocationDetector, SimpleLocationProvider
from datetime import datetime
import json


class SafeRouteAI:
    """
    Main interface for SafeRoute AI application.
    Provides methods for route recommendations, safety queries, and data analysis.
    """

    def __init__(self):
        """Initialize SafeRoute AI with all components."""
        self.preprocessor = None
        self.safety_scorer = None
        self.route_engine = None
        self.location_detector = LocationDetector()
        self.location_provider = SimpleLocationProvider(self.location_detector)
        self.is_initialized = False

    def initialize(self):
        """
        Initialize all components: data preprocessing, safety scoring, and routing.

        Returns:
            bool: True if initialization successful, False otherwise
        """
        print("\n" + "=" * 60)
        print("SafeRoute AI - Initializing System")
        print("=" * 60)

        try:
            # Step 1: Check if processed data exists
            import os
            if not os.path.exists('data/processed/location_safety_scores.csv'):
                print("\n📊 Step 1: Preprocessing Raw Data...")
                self.preprocessor = DataPreprocessor('data/raw')
                if not self.preprocessor.process():
                    print("✗ Data preprocessing failed")
                    return False
                self.preprocessor.save_processed_data()
            else:
                print("✓ Step 1: Processed data already exists, skipping preprocessing")

            # Step 2: Initialize safety scorer
            print("\n🎯 Step 2: Initializing Safety Scorer...")
            self.safety_scorer = SafetyScorer()
            if self.safety_scorer.location_scores is None:
                print("✗ Safety scorer initialization failed")
                return False
            print("✓ Safety Scorer initialized")

            # Step 3: Initialize route engine
            print("\n🛣️  Step 3: Initializing Route Engine...")
            self.route_engine = RouteEngine(self.safety_scorer)
            print(f"✓ Route Engine initialized with {len(self.route_engine.locations)} locations")

            # Step 4: Auto-detect live location
            print("\n📍 Step 4: Detecting Your Live Location...")
            location_result = self.location_detector.auto_detect_live_location()
            if location_result.get('success'):
                print(f"✓ Location auto-detected! You are in {location_result['nearest_saferoute_location']} area")
            else:
                print("⚠️  Could not auto-detect location. You can set it manually later (Option 3)")

            self.is_initialized = True
            print("\n✓ System fully initialized and ready!")
            print("=" * 60 + "\n")
            return True

        except Exception as e:
            print(f"✗ Initialization error: {e}")
            return False

    def get_route_recommendation(self, start_location, end_location, hour=None):
        """
        Get the safest route recommendation between two locations.

        Args:
            start_location (str): Starting location
            end_location (str): Ending location
            hour (int): Hour of day (0-23). If None, uses current time

        Returns:
            dict: Route recommendation with safety metrics
        """
        if not self.is_initialized:
            return {'error': 'System not initialized. Call initialize() first.'}

        if hour is None:
            hour = datetime.now().hour

        print(f"\n🔍 Finding safest route from '{start_location}' to '{end_location}'")
        print(f"   Time: {hour}:00 ({self._get_time_description(hour)})")

        route = self.route_engine.find_safest_route_dijkstra(start_location, end_location, hour)

        if 'error' in route:
            print(f"✗ {route['error']}")
            return route

        return self._format_route_output(route, hour)

    def get_alternative_routes(self, start_location, end_location, num_routes=3, hour=None):
        """
        Get multiple alternative routes ranked by safety.

        Args:
            start_location (str): Starting location
            end_location (str): Ending location
            num_routes (int): Number of alternatives to find
            hour (int): Hour of day (0-23)

        Returns:
            list: List of alternative routes
        """
        if not self.is_initialized:
            return [{'error': 'System not initialized. Call initialize() first.'}]

        if hour is None:
            hour = datetime.now().hour

        print(f"\n🔄 Finding {num_routes} alternative routes from '{start_location}' to '{end_location}'")

        routes = self.route_engine.find_alternative_routes(
            start_location, end_location, num_routes, hour
        )

        formatted_routes = []
        for i, route in enumerate(routes, 1):
            if 'error' not in route:
                formatted_route = self._format_route_output(route, hour)
                formatted_route['route_number'] = i
                formatted_routes.append(formatted_route)

        if not formatted_routes:
            print("✗ No alternative routes found")
            return [{'error': 'Could not find alternative routes'}]

        print(f"✓ Found {len(formatted_routes)} safe routes")
        return formatted_routes

    def check_location_safety(self, location_name, hour=None):
        """
        Check safety score for a specific location at a given time.

        Args:
            location_name (str): Name of the location
            hour (int): Hour of day (0-23). If None, uses current time

        Returns:
            dict: Safety information for the location
        """
        if not self.is_initialized:
            return {'error': 'System not initialized'}

        if hour is None:
            hour = datetime.now().hour

        print(f"\n🔍 Checking safety for '{location_name}' at {hour}:00")

        score = self.safety_scorer.get_time_adjusted_score(location_name, hour)
        if score is None:
            return {'error': f'Location "{location_name}" not found in database'}

        time_period, _ = self.safety_scorer.get_time_period(hour)

        if score >= 7:
            risk_level = "Low Risk ✓"
        elif score >= 5:
            risk_level = "Moderate Risk ⚠️"
        else:
            risk_level = "High Risk ❌"

        return {
            'location': location_name,
            'hour': hour,
            'time_period': time_period,
            'safety_score': score,
            'max_score': 10,
            'risk_level': risk_level,
            'timestamp': datetime.now().isoformat()
        }

    def get_safest_locations(self, top_n=10):
        """
        Get the safest locations in the city.

        Args:
            top_n (int): Number of locations to return

        Returns:
            list: List of safest locations
        """
        if not self.is_initialized:
            return {'error': 'System not initialized'}

        print(f"\n📍 Finding {top_n} safest locations in Chennai...")

        safest = self.safety_scorer.get_safest_locations(top_n)

        results = []
        for idx, row in safest.iterrows():
            results.append({
                'rank': len(results) + 1,
                'location': row['Place'],
                'safety_score': float(row['Location_Safety_Score']),
                'total_crimes': int(row['Total_Crimes']),
                'lighting_efficiency_percent': float(row['Lighting_Efficiency'])
            })

        print(f"✓ Found {len(results)} safest locations")
        return results

    def get_dangerous_locations(self, top_n=10):
        """
        Get the most dangerous locations in the city.

        Args:
            top_n (int): Number of locations to return

        Returns:
            list: List of most dangerous locations
        """
        if not self.is_initialized:
            return {'error': 'System not initialized'}

        print(f"\n⚠️  Finding {top_n} most dangerous locations...")

        dangerous = self.safety_scorer.get_most_dangerous_locations(top_n)

        results = []
        for idx, row in dangerous.iterrows():
            results.append({
                'rank': len(results) + 1,
                'location': row['Place'],
                'safety_score': float(row['Location_Safety_Score']),
                'total_crimes': int(row['Total_Crimes']),
                'lighting_efficiency_percent': float(row['Lighting_Efficiency'])
            })

        print(f"✓ Found {len(results)} dangerous locations")
        return results

    def get_safest_time_periods(self):
        """
        Get safety information for each time period of the day.

        Returns:
            list: Safety info for each time period
        """
        if not self.is_initialized:
            return {'error': 'System not initialized'}

        print("\n⏰ Safety by Time Period:")

        time_periods = self.safety_scorer.get_time_based_recommendations()

        results = []
        for period in time_periods:
            results.append({
                'time_period': period['time_period'],
                'hours': period['hours'],
                'incident_count': int(period['incident_count']),
                'safety_score': float(period['safety_score']),
                'description': period['note']
            })

        return results

    def search_locations(self, search_term):
        """
        Search for locations by partial name match.

        Args:
            search_term (str): Partial location name

        Returns:
            list: Matching locations
        """
        if not self.is_initialized:
            return {'error': 'System not initialized'}

        matches = self.route_engine.get_location_suggestions(search_term)

        if not matches:
            print(f"✗ No locations found matching '{search_term}'")
            return {'error': f'No matches for "{search_term}"'}

        print(f"✓ Found {len(matches)} locations matching '{search_term}':")
        for match in matches:
            print(f"  - {match}")

        return {'matches': matches, 'count': len(matches)}

    def get_system_status(self):
        """Get current system status and statistics."""
        if not self.is_initialized:
            return {'status': 'NOT INITIALIZED', 'message': 'Call initialize() first'}

        current_loc_status = "Not set"
        if self.location_detector.is_location_set():
            current_loc_status = self.location_detector.get_current_location()

        return {
            'status': 'READY',
            'locations_available': len(self.route_engine.locations),
            'current_location': current_loc_status,
            'time': datetime.now().isoformat(),
            'components': {
                'data_preprocessor': 'Ready',
                'safety_scorer': 'Ready',
                'route_engine': 'Ready',
                'location_detector': 'Ready'
            }
        }

    def auto_detect_current_location(self):
        """
        Automatically detect and set user's live location using GPS/IP geolocation.
        Requires internet connection. Works on any device.

        Returns:
            dict: Location detection result
        """
        result = self.location_detector.auto_detect_live_location()
        if result.get('success'):
            print(f"\n✓ Success! Your current location set to: {result['nearest_saferoute_location']}")
            print(f"  (Detected from {result['detected_location']})")
            return result
        else:
            print(f"\n✗ Auto-detection failed: {result.get('reason')}")
            print("You can manually set location using Option 3")
            return result

    def set_current_location(self):
        """Let user set their current location interactively."""
        print("\n📍 Set Your Current Location")
        print("=" * 50)
        print("1. Select from list")
        print("2. Search by name")
        print("3. Enter GPS coordinates")
        choice = input("Choose option (1-3): ").strip()

        if choice == '1':
            location = self.location_provider.select_from_list()
            print(f"✓ Current location set to: {location}")
            return location
        elif choice == '2':
            search_term = input("Enter location name: ").strip()
            suggestions = self.location_detector.get_location_suggestions(search_term, limit=5)
            if suggestions:
                for i, loc in enumerate(suggestions, 1):
                    print(f"{i}. {loc}")
                idx = int(input("Select location: ")) - 1
                if 0 <= idx < len(suggestions):
                    location = suggestions[idx]
                    self.location_detector.set_current_location_by_name(location)
                    print(f"✓ Current location set to: {location}")
                    return location
            else:
                print("✗ No locations found")
                return None
        elif choice == '3':
            try:
                lat = float(input("Enter latitude: "))
                lon = float(input("Enter longitude: "))
                result = self.location_detector.set_current_location_by_coordinates(lat, lon)
                if result:
                    print(f"✓ Nearest location: {result['location']} ({result['distance_km']}km away)")
                    return result['location']
            except ValueError:
                print("✗ Invalid coordinates")
                return None
        return None

    def get_route_from_current_location(self, end_location, hour=None):
        """
        Get route from current location to destination.

        Args:
            end_location (str): Destination location
            hour (int): Hour of day

        Returns:
            dict: Route information
        """
        if not self.is_initialized:
            return {'error': 'System not initialized'}

        if not self.location_detector.is_location_set():
            return {'error': 'Current location not set. Use set_current_location() first.'}

        start_location = self.location_detector.get_current_location()
        print(f"\n📍 Starting from: {start_location}")
        return self.get_route_recommendation(start_location, end_location, hour)

    def get_current_location_info(self):
        """Display current location information."""
        if not self.location_detector.is_location_set():
            print("✗ Current location not set")
            return {'error': 'Current location not set'}

        current_loc = self.location_detector.get_current_location()
        coords = self.location_detector.get_current_coordinates()

        print(f"\n📍 Current Location: {current_loc}")
        print(f"   Coordinates: {coords}")

        # Show nearby locations
        if coords:
            nearby = self.location_detector.find_nearest_location(coords[0], coords[1], limit=3)
            print(f"\n   Nearby locations:")
            for loc_info in nearby:
                if loc_info['location'] != current_loc:
                    print(f"   - {loc_info['location']}: {loc_info['distance_km']}km")

        return {
            'current_location': current_loc,
            'coordinates': coords
        }

    @staticmethod
    def _format_route_output(route, hour):
        """Format route output for display."""
        output = {
            'route': route['route_locations'],
            'distance': len(route['route_locations']) - 1,
            'safety_metrics': {
                'average_score': route['average_safety_score'],
                'min_score': route['min_safety_score'],
                'max_score': route['max_safety_score'],
                'max_possible': 10
            },
            'risk_assessment': route['risk_level'],
            'time_period': route['time_period'],
            'hour': hour,
            'recommendations': route['recommendations'],
            'location_breakdown': [
                {
                    'location': loc['location'],
                    'safety_score': loc['safety_score']
                }
                for loc in route['location_scores']
            ]
        }
        return output

    @staticmethod
    def _get_time_description(hour):
        """Get human-readable time description."""
        if 0 <= hour < 6:
            return "Early Morning (High Risk)"
        elif 6 <= hour < 12:
            return "Morning (Moderate Risk)"
        elif 12 <= hour < 18:
            return "Afternoon (Safest)"
        else:
            return "Evening (Moderate-High Risk)"


def main():
    """Main entry point for SafeRoute AI system."""
    print("\n" + "=" * 60)
    print("SafeRoute AI - Safe Route Recommendation System")
    print("=" * 60)

    # Initialize system
    app = SafeRouteAI()
    if not app.initialize():
        print("Failed to initialize system")
        return

    # Interactive menu
    while True:
        print("\n" + "=" * 60)
        print("MENU")
        print("=" * 60)
        print("1. Get Route Recommendation")
        print("2. Get Alternative Routes")
        print("3. Auto-Detect Live Location (GPS/IP)")
        print("4. Manually Set Current Location")
        print("5. Get Route from Current Location")
        print("6. Check Location Safety")
        print("7. View Current Location Info")
        print("8. View Safest Locations")
        print("9. View Most Dangerous Locations")
        print("10. View Safety by Time Period")
        print("11. Search Locations")
        print("12. System Status")
        print("13. Exit")
        print("=" * 60)

        choice = input("Select option (1-13): ").strip()

        if choice == '1':
            start = input("Start location: ").strip()
            end = input("End location: ").strip()
            hour_input = input("Hour (0-23, or press Enter for current): ").strip()
            hour = int(hour_input) if hour_input else None
            result = app.get_route_recommendation(start, end, hour)
            print("\n" + json.dumps(result, indent=2))

        elif choice == '2':
            start = input("Start location: ").strip()
            end = input("End location: ").strip()
            num = int(input("Number of alternatives (default 3): ") or "3")
            hour_input = input("Hour (0-23, or press Enter for current): ").strip()
            hour = int(hour_input) if hour_input else None
            routes = app.get_alternative_routes(start, end, num, hour)
            print("\n" + json.dumps(routes, indent=2))

        elif choice == '3':
            result = app.auto_detect_current_location()
            print("\n" + json.dumps(result, indent=2))

        elif choice == '4':
            app.set_current_location()

        elif choice == '5':
            end = input("Destination location: ").strip()
            hour_input = input("Hour (0-23, or press Enter for current): ").strip()
            hour = int(hour_input) if hour_input else None
            result = app.get_route_from_current_location(end, hour)
            print("\n" + json.dumps(result, indent=2))

        elif choice == '6':
            location = input("Location: ").strip()
            hour_input = input("Hour (0-23, or press Enter for current): ").strip()
            hour = int(hour_input) if hour_input else None
            result = app.check_location_safety(location, hour)
            print("\n" + json.dumps(result, indent=2))

        elif choice == '7':
            app.get_current_location_info()

        elif choice == '8':
            num = int(input("Number of locations (default 10): ") or "10")
            result = app.get_safest_locations(num)
            print("\n" + json.dumps(result, indent=2))

        elif choice == '9':
            num = int(input("Number of locations (default 10): ") or "10")
            result = app.get_dangerous_locations(num)
            print("\n" + json.dumps(result, indent=2))

        elif choice == '10':
            result = app.get_safest_time_periods()
            print("\n" + json.dumps(result, indent=2))

        elif choice == '11':
            search_term = input("Search term: ").strip()
            result = app.search_locations(search_term)
            print("\n" + json.dumps(result, indent=2))

        elif choice == '12':
            result = app.get_system_status()
            print("\n" + json.dumps(result, indent=2))

        elif choice == '13':
            print("\nThank you for using SafeRoute AI!")
            break

        else:
            print("Invalid option. Please try again.")


if __name__ == '__main__':
    main()
