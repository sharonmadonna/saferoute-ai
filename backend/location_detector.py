"""
Location Detection Module for SafeRoute AI
Handles user geolocation and finds nearest SafeRoute locations
"""

import pandas as pd
from geopy.distance import geodesic
import os
import geocoder
import warnings
warnings.filterwarnings('ignore')


class LocationDetector:
    """
    Detects user's current location and finds nearest SafeRoute locations.
    """

    # Approximate coordinates for Chennai neighborhoods (demo data)
    LOCATION_COORDINATES = {
        'Adyar': (13.0033, 80.2418),
        'Anna Nagar': (13.0879, 80.2128),
        'Chromepet': (13.1439, 80.2761),
        'Guindy': (13.0019, 80.2258),
        'Kodambakkam': (13.0462, 80.1758),
        'Mylapore': (13.0327, 80.2724),
        'Nungambakkam': (13.0596, 80.2264),
        'Perambur': (13.1039, 80.1928),
        'Porur': (13.0558, 80.1389),
        'Royapettah': (13.0413, 80.2573),
        'Sholinganallur': (12.9689, 80.2431),
        'T Nagar': (13.0328, 80.2197),
        'Tambaram': (12.9252, 80.1368),
        'Velachery': (12.9789, 80.2224)
    }

    def __init__(self):
        """Initialize location detector."""
        self.current_location = None
        self.current_coordinates = None

    def auto_detect_live_location(self):
        """
        Automatically detect user's live location using IP geolocation.
        This works without manual input - just needs internet connection.

        Returns:
            dict: Location info with coordinates and nearest SafeRoute location
        """
        print("\n🔍 Detecting your live location...")
        
        try:
            # Try to get location from IP address (works everywhere with internet)
            print("   Using IP geolocation to find your location...")
            g = geocoder.ip('me')
            
            if g.ok:
                latitude = g.lat
                longitude = g.lng
                city = g.city or "Unknown"
                
                print(f"✓ Location detected: {city}")
                print(f"   Coordinates: ({latitude:.4f}, {longitude:.4f})")
                
                # Set coordinates and find nearest SafeRoute location
                nearest = self.set_current_location_by_coordinates(latitude, longitude)
                
                if nearest:
                    print(f"✓ Nearest SafeRoute area: {nearest['location']} ({nearest['distance_km']}km away)")
                    return {
                        'success': True,
                        'detected_location': city,
                        'detected_coordinates': (latitude, longitude),
                        'nearest_saferoute_location': nearest['location'],
                        'distance_km': nearest['distance_km']
                    }
            else:
                print("✗ Could not get location from IP")
                return {'success': False, 'reason': 'IP geolocation failed'}
                
        except Exception as e:
            print(f"✗ Auto-detection error: {e}")
            print("  You can manually set location using Option 3")
            return {'success': False, 'reason': str(e)}

    def set_current_location_by_name(self, location_name):
        """
        Set current location by name.

        Args:
            location_name (str): Name of the location

        Returns:
            bool: True if location set successfully
        """
        location_key = location_name.strip().lower()

        for loc, coords in self.LOCATION_COORDINATES.items():
            if loc.lower() == location_key:
                self.current_location = loc
                self.current_coordinates = coords
                return True

        return False

    def set_current_location_by_coordinates(self, latitude, longitude):
        """
        Set current location by GPS coordinates and find nearest SafeRoute location.

        Args:
            latitude (float): Latitude coordinate
            longitude (float): Longitude coordinate

        Returns:
            dict: Info about nearest location
        """
        self.current_coordinates = (latitude, longitude)
        nearest = self.find_nearest_location(latitude, longitude, limit=1)

        if nearest:
            self.current_location = nearest['location'] if isinstance(nearest, dict) else nearest[0]['location']
            return nearest
        return None

    def find_nearest_location(self, latitude, longitude, limit=3):
        """
        Find nearest SafeRoute location to given coordinates.

        Args:
            latitude (float): User latitude
            longitude (float): User longitude
            limit (int): Number of nearest locations to return

        Returns:
            dict or list: Nearest location(s) with distance
        """
        user_coords = (latitude, longitude)
        distances = []

        for location, coords in self.LOCATION_COORDINATES.items():
            # Calculate distance in kilometers
            distance_km = geodesic(user_coords, coords).kilometers
            distances.append({
                'location': location,
                'coordinates': coords,
                'distance_km': round(distance_km, 2)
            })

        # Sort by distance
        distances.sort(key=lambda x: x['distance_km'])

        if limit == 1:
            return distances[0] if distances else None

        return distances[:limit]

    def get_current_location(self):
        """Get current location name."""
        return self.current_location

    def get_current_coordinates(self):
        """Get current location coordinates."""
        return self.current_coordinates

    def is_location_set(self):
        """Check if current location is set."""
        return self.current_location is not None

    def get_all_available_locations(self):
        """Get list of all available SafeRoute locations."""
        return list(self.LOCATION_COORDINATES.keys())

    def get_location_suggestions(self, search_term, limit=5):
        """
        Get location suggestions based on search term.

        Args:
            search_term (str): Search term
            limit (int): Max suggestions

        Returns:
            list: Matching locations
        """
        search_key = search_term.strip().lower()
        matches = []

        for location in self.LOCATION_COORDINATES.keys():
            if search_key in location.lower() or location.lower().startswith(search_key):
                matches.append(location)

        return matches[:limit]

    def format_distance(self, distance_km):
        """Format distance for display."""
        if distance_km < 1:
            meters = int(distance_km * 1000)
            return f"{meters}m"
        return f"{distance_km}km"


class SimpleLocationProvider:
    """
    Fallback location provider when GPS not available.
    Allows user to select from preset locations.
    """

    def __init__(self, detector):
        """
        Initialize with LocationDetector instance.

        Args:
            detector (LocationDetector): Location detector instance
        """
        self.detector = detector

    def select_from_list(self):
        """
        Display list of locations and let user select.

        Returns:
            str: Selected location name
        """
        locations = self.detector.get_all_available_locations()
        locations.sort()

        print("\n📍 Available SafeRoute Locations:")
        print("=" * 40)
        for i, loc in enumerate(locations, 1):
            print(f"{i:2d}. {loc}")
        print("=" * 40)

        while True:
            try:
                choice = int(input("Select location number (or 0 to search): "))
                if 1 <= choice <= len(locations):
                    selected = locations[choice - 1]
                    self.detector.set_current_location_by_name(selected)
                    return selected
                elif choice == 0:
                    return self._search_location()
                else:
                    print("Invalid selection. Please try again.")
            except ValueError:
                print("Please enter a valid number.")

    def _search_location(self):
        """Search for location by name."""
        search_term = input("Enter location name (partial match OK): ").strip()
        suggestions = self.detector.get_location_suggestions(search_term, limit=10)

        if not suggestions:
            print(f"No locations found containing '{search_term}'")
            return self.select_from_list()

        print(f"\n🔍 Found {len(suggestions)} matching locations:")
        for i, loc in enumerate(suggestions, 1):
            print(f"{i}. {loc}")

        choice = int(input("Select location number: ")) - 1
        if 0 <= choice < len(suggestions):
            selected = suggestions[choice]
            self.detector.set_current_location_by_name(selected)
            return selected

        return self.select_from_list()


if __name__ == '__main__':
    # Test location detector
    print("SafeRoute AI - Location Detector Test")
    print("=" * 50)

    detector = LocationDetector()

    # Test 1: Set by name
    print("\nTest 1: Set location by name")
    if detector.set_current_location_by_name('Adyar'):
        print(f"✓ Current location: {detector.get_current_location()}")
        print(f"  Coordinates: {detector.get_current_coordinates()}")

    # Test 2: Find nearest
    print("\nTest 2: Find nearest locations to coordinates (13.0, 80.2)")
    nearest = detector.find_nearest_location(13.0, 80.2, limit=3)
    for loc_info in nearest:
        print(f"  {loc_info['location']}: {loc_info['distance_km']}km away")

    # Test 3: Get all locations
    print(f"\nTest 3: All available locations ({len(detector.get_all_available_locations())})")
    print(f"  {', '.join(detector.get_all_available_locations())}")
