import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🛡️</Text>
        </View>

        <Text style={styles.title}>SafeRoute AI</Text>
        <Text style={styles.subtitle}>
          Navigate Chennai using crime data, street lighting, and time-of-day
          risk to find the safest path to your destination.
        </Text>

        <View style={styles.featureList}>
          <FeatureRow icon="🗺️" text="3 route options — safest, fastest, balanced" />
          <FeatureRow icon="🔦" text="Street lighting awareness" />
          <FeatureRow icon="🕐" text="Time-of-day risk scoring" />
          <FeatureRow icon="🚨" text="Crime data from real Chennai datasets" />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/screens/MapScreen")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Open Map</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 22,
  },
  featureList: {
    width: "100%",
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 20,
    gap: 14,
    marginVertical: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
    width: 28,
  },
  featureText: {
    fontSize: 14,
    color: "#d1d5db",
    flex: 1,
  },
  button: {
    backgroundColor: "#22c55e",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});