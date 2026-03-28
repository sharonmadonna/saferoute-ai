import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { fetchRoute, fetchHeatmap } from "../../services/api";

// Free OSM tiles — no API key needed
const OSM_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Chennai center
const CHENNAI_CENTER = [80.2707, 13.0827];

MapLibreGL.setAccessToken(null);

export default function MapScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [destination, setDest] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [activeRoute, setActive] = useState("safest");
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Get user location and load heatmap on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      try {
        const hm = await fetchHeatmap("chennai");
        setHeatmap(hm.points || []);
      } catch {
        console.warn("Could not load heatmap — is the backend running?");
      }
    })();
  }, []);

  // User taps on the map to set destination
  const handleMapPress = async (e) => {
    if (!location) {
      Alert.alert("Location not ready", "Waiting for your GPS location.");
      return;
    }
    const [lon, lat] = e.geometry.coordinates;
    setDest({ latitude: lat, longitude: lon });
    setRoutes(null);
    setActive("safest");
    setLoading(true);

    try {
      const data = await fetchRoute(
        location.latitude,
        location.longitude,
        lat,
        lon
      );
      setRoutes(data.routes);
    } catch {
      Alert.alert(
        "Could not fetch routes",
        "Make sure your backend server is running and your IP is correct in api.js."
      );
    } finally {
      setLoading(false);
    }
  };

  // Build GeoJSON for heatmap danger circles
  const heatmapGeoJSON = {
    type: "FeatureCollection",
    features: heatmap.map((pt) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [pt.lon, pt.lat] },
      properties: { weight: pt.weight },
    })),
  };

  // All 3 routes as one GeoJSON (inactive ones drawn gray)
  const allRoutesGeoJSON = routes
    ? {
        type: "FeatureCollection",
        features: Object.entries(routes).map(([key, feature]) => ({
          ...feature,
          properties: { ...feature.properties, routeKey: key },
        })),
      }
    : null;

  // Active route drawn separately on top
  const activeGeoJSON =
    routes && routes[activeRoute]
      ? {
          type: "FeatureCollection",
          features: [routes[activeRoute]],
        }
      : null;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={OSM_STYLE}
        onPress={handleMapPress}
        logoEnabled={false}
        attributionEnabled={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={
            location
              ? [location.longitude, location.latitude]
              : CHENNAI_CENTER
          }
          animationMode="flyTo"
          animationDuration={800}
        />

        {/* Live user location dot */}
        <MapLibreGL.UserLocation
          visible={true}
          androidRenderMode="compass"
          renderMode="native"
        />

        {/* Danger heatmap circles */}
        {heatmap.length > 0 && (
          <MapLibreGL.ShapeSource id="heatmapSource" shape={heatmapGeoJSON}>
            <MapLibreGL.CircleLayer
              id="heatmapLayer"
              style={{
                circleRadius: 350,
                circleColor: [
                  "interpolate",
                  ["linear"],
                  ["get", "weight"],
                  0.0, "rgba(34,197,94,0.15)",
                  0.5, "rgba(245,158,11,0.20)",
                  1.0, "rgba(239,68,68,0.28)",
                ],
                circleBlur: 0.9,
                circleOpacity: 1,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Inactive routes — gray dashed */}
        {allRoutesGeoJSON && (
          <MapLibreGL.ShapeSource id="allRoutes" shape={allRoutesGeoJSON}>
            <MapLibreGL.LineLayer
              id="inactiveLines"
              filter={["!=", ["get", "routeKey"], activeRoute]}
              style={{
                lineColor: "#94a3b8",
                lineWidth: 2,
                lineDasharray: [4, 3],
                lineOpacity: 0.6,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Active route — colored and thick */}
        {activeGeoJSON && (
          <MapLibreGL.ShapeSource id="activeRoute" shape={activeGeoJSON}>
            <MapLibreGL.LineLayer
              id="activeLine"
              style={{
                lineColor: routes[activeRoute]?.properties?.color ?? "#22c55e",
                lineWidth: 6,
                lineCap: "round",
                lineJoin: "round",
                lineOpacity: 1,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Destination pin */}
        {destination && (
          <MapLibreGL.PointAnnotation
            id="dest"
            coordinate={[destination.longitude, destination.latitude]}
          >
            <View style={styles.destPin} />
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      {/* Loading spinner */}
      {loading && (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loaderText}>Finding safest route...</Text>
        </View>
      )}

      {/* Error message */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Route selector cards */}
      {routes && (
        <View style={styles.routeBar}>
          {Object.entries(routes).map(([key, feature]) => {
            const props = feature.properties;
            const isActive = key === activeRoute;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.routeCard,
                  isActive && {
                    borderColor: props.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => {
                  setActive(key);
                  router.push({
                    pathname: "/screens/ScoreCardScreen",
                    params: {
                      label: props.label,
                      avg_safety: props.avg_safety,
                      distance_m: props.distance_m,
                      est_walk_min: props.est_walk_min,
                      color: props.color,
                      crime_risk: props.breakdown?.crime_risk,
                      lighting_safety: props.breakdown?.lighting_safety,
                      time_risk: props.breakdown?.time_risk,
                    },
                  });
                }}
              >
                <Text style={styles.cardLabel}>{key}</Text>
                <Text style={[styles.cardScore, { color: props.color }]}>
                  {Math.round((props.avg_safety ?? 0.7) * 100)}%
                </Text>
                <Text style={styles.cardMeta}>
                  {props.distance_m}m · {props.est_walk_min} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tap hint shown before any route is selected */}
      {!routes && !loading && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Tap anywhere on the map to set your destination</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  destPin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#3b82f6",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  loaderBox: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    backgroundColor: "#1f2937",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loaderText: {
    color: "#d1d5db",
    fontSize: 14,
  },
  errorBox: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "#7f1d1d",
    padding: 14,
    borderRadius: 10,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
    textAlign: "center",
  },
  routeBar: {
    position: "absolute",
    bottom: 36,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  routeCard: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#9ca3af",
    marginBottom: 2,
  },
  cardScore: {
    fontSize: 24,
    fontWeight: "800",
  },
  cardMeta: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  hint: {
    position: "absolute",
    bottom: 44,
    alignSelf: "center",
    backgroundColor: "rgba(17,24,39,0.85)",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 22,
  },
  hintText: {
    color: "#e5e7eb",
    fontSize: 13,
  },
});