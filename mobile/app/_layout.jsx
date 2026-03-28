import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "SafeRoute AI",
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="screens/MapScreen"
        options={{
          title: "Map",
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#ffffff",
        }}
      />
      <Stack.Screen
        name="screens/ScoreCardScreen"
        options={{
          title: "Safety Report",
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#ffffff",
        }}
      />
    </Stack>
  );
}