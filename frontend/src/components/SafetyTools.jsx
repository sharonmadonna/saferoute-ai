import { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { safetyAPI } from '../services/api';
import { TIME_SLOTS, getSafetyColor, getSafetyLabel } from '../utils/constants';

export const SafetyTools = ({ setLoading }) => {
    const [tab, setTab] = useState("tools");
    const [timeData, setTimeData] = useState(TIME_SLOTS);
    const [safestLocations, setSafestLocations] = useState([]);
    const [dangerousLocations, setDangerousLocations] = useState([]);
    const [timePeriods, setTimePeriods] = useState([]);

    useEffect(() => {
        loadSafetyData();
    }, []);

    const loadSafetyData = async () => {
        setLoading(true);
        try {
            const [safest, dangerous, timePeriodsRes] = await Promise.all([
                safetyAPI.getSafestLocations(5),
                safetyAPI.getDangerousLocations(5),
                safetyAPI.getTimePeriodSafety()
            ]);

            if (safest.data && safest.data.locations) setSafestLocations(safest.data.locations);
            if (dangerous.data && dangerous.data.locations) setDangerousLocations(dangerous.data.locations);
            if (timePeriodsRes.data && timePeriodsRes.data.time_periods) setTimePeriods(timePeriodsRes.data.time_periods);
        } catch (err) {
            console.error("Failed to load safety data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb32 fade-in">
            <div className="top-bar">
                <div className="top-bar-title">Safety Tools</div>
                <button className="icon-btn"><Icons name="bell" size={18} /></button>
            </div>

            <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
                {[
                    ["tools", "🛠 Tools"],
                    ["time", "⏱ Time Safety"],
                    ["stats", "📊 Statistics"]
                ].map(([t, l]) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1.5px solid", borderColor: tab === t ? "var(--cr)" : "var(--br)", background: tab === t ? "rgba(192,57,75,.1)" : "transparent", color: tab === t ? "var(--cr)" : "var(--tx2)", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "var(--ff)", letterSpacing: ".04em" }}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {tab === "tools" && (
                <>
                    <div style={{ padding: "0 16px", marginBottom: 12 }}>
                        <div className="card" style={{ background: "linear-gradient(135deg,#1a0a10,#280a1a)", borderColor: "rgba(192,57,75,.4)" }}>
                            <div style={{ fontSize: 12, color: "var(--tx2)" }}>Safety Intelligence</div>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 700, marginTop: 3 }}>Safety Awareness Panel</div>
                            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 2 }}>Powered by community data & historical patterns</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                <div style={{ flex: 1, background: "var(--s2)", borderRadius: 10, padding: "8px 12px" }}>
                                    <div style={{ fontSize: 10, color: "var(--tx2)" }}>Active Advisory</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--amber)" }}>Evening Shift</div>
                                </div>
                                <div style={{ flex: 1, background: "var(--s2)", borderRadius: 10, padding: "8px 12px" }}>
                                    <div style={{ fontSize: 10, color: "var(--tx2)" }}>Current Time</div>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="tgrid">
                        {[
                            { ic: "🔦", n: "Lighting Density", d: "Street light coverage", col: "#f59e0b" },
                            { ic: "👥", n: "Crowd Sourcing", d: "Community safety data", col: "#3b82f6" },
                            { ic: "🛡️", n: "Verified Guardians", d: "Trusted route contacts", col: "#22c55e" },
                            { ic: "📊", n: "Location Safety", d: "Score any Chennai area", col: "#8b5cf6" }
                        ].map(t => (
                            <div key={t.n} className="tcrd">
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: t.col + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{t.ic}</div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.n}</div>
                                <div style={{ fontSize: 11, color: "var(--tx2)", lineHeight: 1.4 }}>{t.d}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {tab === "time" && (
                <div style={{ padding: "0 16px" }}>
                    <div className="stitle">Time Slot Safety</div>
                    <div style={{ fontSize: 12, color: "var(--tx2)", marginBottom: 16 }}>Historical incident data by time period</div>

                    {timeData.map(s => (
                        <div key={s.slot} className="tbr">
                            <div className="tbl">{s.slot}</div>
                            <div className="tbbg">
                                <div className="tbf" style={{ width: `${s.safety * 10}%`, background: getSafetyColor(s.safety) }} />
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, width: 28, textAlign: "right", color: getSafetyColor(s.safety) }}>{s.safety}</div>
                            <div className="sbadge" style={{ background: getSafetyColor(s.safety) + "22", color: getSafetyColor(s.safety), marginLeft: 6, fontSize: 10 }}>{s.label}</div>
                        </div>
                    ))}

                    <div className="card" style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📈 Key Insights</div>
                        <div style={{ fontSize: 12, color: "var(--tx2)", lineHeight: 1.7 }}>
                            • Peak risk: 12AM–4AM (89 incidents/month avg)<br />
                            • Safest window: 8AM–12PM (score 8.5)<br />
                            • Evening caution: 8PM–12AM (67 incidents)<br />
                            • Use main roads with lighting after 8PM
                        </div>
                    </div>
                </div>
            )}

            {tab === "stats" && (
                <div style={{ padding: "0 16px" }}>
                    <div className="stitle">Safety Statistics</div>

                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🏆 Safest Locations</div>
                        {safestLocations.map((loc, i) => (
                            <div key={loc.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < safestLocations.length - 1 ? "1px solid var(--br)" : "none" }}>
                                <span>{i + 1}. {loc.name}</span>
                                <span style={{ color: getSafetyColor(loc.safety_score), fontWeight: 700 }}>{loc.safety_score}/10</span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⚠️ Most Dangerous Locations</div>
                        {dangerousLocations.map((loc, i) => (
                            <div key={loc.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < dangerousLocations.length - 1 ? "1px solid var(--br)" : "none" }}>
                                <span>{i + 1}. {loc.name}</span>
                                <span style={{ color: getSafetyColor(loc.safety_score), fontWeight: 700 }}>{loc.safety_score}/10</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};