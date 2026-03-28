// Replace with your machine's local IP address
// To find it: run `ipconfig` on Windows or `ifconfig` on Mac/Linux
// Your phone and laptop must be on the same WiFi network
const BASE = "http://192.168.1.X:8000";

export async function fetchRoute(originLat, originLon, destLat, destLon) {
  try {
    const res = await fetch(`${BASE}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
      }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("fetchRoute failed:", err);
    throw err;
  }
}

export async function fetchSafety(lat, lon) {
  try {
    const res = await fetch(`${BASE}/safety?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("fetchSafety failed:", err);
    throw err;
  }
}

export async function fetchHeatmap(city) {
  try {
    const res = await fetch(`${BASE}/heatmap/${city}`);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("fetchHeatmap failed:", err);
    throw err;
  }
}