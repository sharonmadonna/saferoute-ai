import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function ScoreCardScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const safetyScore = parseFloat(params.avg_safety ?? 0.7);
  const distanceM = params.distance_m ?? "—";
  const walkMin = params.est_walk_min ?? "—";
  const label = params.label ?? "route";
  const color = params.color ?? "#22c55e";

  const factors = [
    {
      label: "Crime safety",
      icon: "🚨",
      value: 1 - parseFloat(params.crime_risk ?? 0.5),
    },
    {
      label: "Street lighting",
      icon: "💡",
      value: parseFloat(params.lighting_safety ?? 0.5),
    },
    {
      label: "Time of day",
      icon: "🕐",
      value: 1 - parseFloat(params.time_risk ?? 0.5),
    },
  ];

  const scoreInt = Math.round(safetyScore * 100);

  function scoreLabel(v) {
    if (v >= 0.75) return "Safe";
    if (v >= 0.5) return "Moderate";
    return "Risky";
  }

  function barColor(v) {
    if (v >= 0.75) return "#22c55e";
    if (v >= 0.5) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Route type badge */}
      <View style={[styles.badge, { backgroundColor: color + "22" }]}>
        <Text style={[styles.badgeText, { color }]}>
          {label.toUpperCase()} ROUTE
        </Text>
      </View>

      {/* Big score circle */}
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, { color }]}>{scoreInt}</Text>
        <Text style={styles.scoreOutOf}>/100</Text>
      </View>

      <Text style={styles.scoreVerdict}>{scoreLabel(safetyScore)}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatBox label="Distance" value={`${distanceM} m`} />
        <StatBox label="Walk time" value={`${walkMin} min`} />
        <StatBox label="Safety" value={`${scoreInt}%`} />
      </View>

      {/* Factor breakdown */}
      <Text style={styles.sectionTitle}>Factor breakdown</Text>

      {factors.map((f) => (
        <View key={f.label} style={styles.factorCard}>
          <View style={styles.factorHeader}>
            <Text style={styles.factorIcon}>{f.icon}</Text>
            <Text style={styles.factorLabel}>{f.label}</Text>
            <Text style={[styles.factorPct, { color: barColor(f.value) }]}>
              {Math.round(f.value * 100)}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.round(f.value * 100)}%`,
                  backgroundColor: barColor(f.value),
                },
              ]}
            />
          </View>
        </View>
      ))}

      {/* What this means */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What this means</Text>
        <Text style={styles.infoText}>
          This score combines crime incident history, street lighting coverage,
          and time-of-day risk for each road segment along the route. A higher
          score means the route passes through better-lit, lower-crime areas at
          safer hours.
        </Text>
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.backButtonText}>← Back to map</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
    gap: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "800",
  },
  scoreOutOf: {
    fontSize: 16,
    color: "#6b7280",
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  scoreVerdict: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginTop: -10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f9fafb",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e5e7eb",
    alignSelf: "flex-start",
  },
  factorCard: {
    width: "100%",
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  factorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  factorIcon: {
    fontSize: 18,
    width: 26,
  },
  factorLabel: {
    flex: 1,
    fontSize: 14,
    color: "#d1d5db",
    fontWeight: "500",
  },
  factorPct: {
    fontSize: 15,
    fontWeight: "700",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#1e3a5f",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#93c5fd",
  },
  infoText: {
    fontSize: 13,
    color: "#bfdbfe",
    lineHeight: 20,
  },
  backButton: {
    width: "100%",
    backgroundColor: "#1f2937",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  backButtonText: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "500",
  },
});