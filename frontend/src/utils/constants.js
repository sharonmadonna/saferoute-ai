export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const TIME_SLOTS = [
    { slot: "12AM-4AM", incidents: 89, safety: 3.2, label: "High Risk", hours: "0-4" },
    { slot: "4AM-8AM", incidents: 34, safety: 6.8, label: "Moderate", hours: "4-8" },
    { slot: "8AM-12PM", incidents: 18, safety: 8.5, label: "Safe", hours: "8-12" },
    { slot: "12PM-4PM", incidents: 22, safety: 8.1, label: "Safe", hours: "12-16" },
    { slot: "4PM-8PM", incidents: 41, safety: 7.2, label: "Moderate", hours: "16-20" },
    { slot: "8PM-12AM", incidents: 67, safety: 4.9, label: "Caution", hours: "20-24" },
];

export const AREA_ADVISORIES = [
    { area: "West Station Plaza", level: "CRITICAL", desc: "High criminal activity reported by community data and historical patterns." },
    { area: "Central Park North", level: "CAUTION", desc: "Occasional lighting failures. Stay on main paths, in presence of others." },
];

export const getSafetyColor = (score) => {
    if (score >= 8) return "#22c55e";
    if (score >= 6.5) return "#f59e0b";
    return "#ef4444";
};

export const getSafetyLabel = (score) => {
    if (score >= 8) return "SAFE";
    if (score >= 6.5) return "MODERATE";
    return "CAUTION";
};

export const getRiskLevel = (score) => {
    if (score >= 7) return "Low Risk ✓";
    if (score >= 5) return "Moderate Risk ⚠️";
    return "High Risk ❌";
};