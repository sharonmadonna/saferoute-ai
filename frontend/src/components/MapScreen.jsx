import { useState } from 'react';
import { SafetyMap } from './SafetyMap';
import { Icons } from './Icons';
import { safetyAPI } from '../services/api';
import { getSafetyColor, getSafetyLabel, AREA_ADVISORIES } from '../utils/constants';

export const MapScreen = ({ setLoading }) => {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [selecting, setSelecting] = useState("from");
    const [routes, setRoutes] = useState(null);
    const [advisory, setAdvisory] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const handleMapClick = async (loc) => {
        if (selecting === "from") {
            setFrom(loc);
            setSelecting("to");
        } else if (selecting === "to") {
            setTo(loc);
            setSelecting(null);
            await findRoutes(loc);
        }
    };

    const findRoutes = async (destination) => {
        if (!from || !destination) return;
        setLoading(true);
        try {
            const response = await safetyAPI.getAlternativeRoutes(from, destination, 3);
            if (response.data && response.data.routes) {
                setRoutes(response.data.routes);
            }
        } catch (err) {
            console.error("Failed to find routes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (value) => {
        setSearchTerm(value);
        if (value.length > 1) {
            try {
                const response = await safetyAPI.searchLocations(value);
                if (response.data && response.data.matches) {
                    setSuggestions(response.data.matches.slice(0, 5));
                }
            } catch (err) {
                console.error("Search failed:", err);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (loc) => {
        setSearchTerm(loc);
        setSuggestions([]);
        handleMapClick(loc);
    };

    const clearSelection = () => {
        setFrom("");
        setTo("");
        setRoutes(null);
        setSelecting("from");
    };

    return (
        <div className="pb32 fade-in">
            <div className="top-bar">
                <div className="top-bar-title">Safety Map</div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="icon-btn"><Icons name="bell" size={18} /></button>
                    <button className="icon-btn"><Icons name="settings" size={18} /></button>
                </div>
            </div>

            {advisory && (
                <div className="abanner caut" style={{ marginTop: 12, marginLeft: 16, marginRight: 16 }}>
                    <span>⚠️</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--amber)" }}>Active Advisory: Evening Shift</div>
                        <div style={{ fontSize: 12, color: "var(--tx2)" }}>Afternoon (Golden Time Window)</div>
                    </div>
                    <button onClick={() => setAdvisory(false)} style={{ background: "none", border: "none", color: "var(--tx2)", cursor: "pointer" }}>
                        <Icons name="close" size={16} />
                    </button>
                </div>
            )}

            <div className="map-cont" style={{ marginTop: 12 }}>
                <SafetyMap from={from} to={to} onLocationSelect={handleMapClick} setLoading={setLoading} />
                <div className="map-ot">
                    <input
                        className="map-si"
                        placeholder="🔍 Search location..."
                        value={searchTerm}
                        onChange={e => handleSearch(e.target.value)}
                    />
                    <div className="map-ib"><Icons name="gps" size={16} color="var(--tx2)" /></div>
                </div>

                {suggestions.length > 0 && (
                    <div style={{ position: "absolute", top: 50, left: 10, right: 10, background: "var(--s1)", border: "1px solid var(--br)", borderRadius: 10, zIndex: 10 }}>
                        {suggestions.map(sug => (
                            <div key={sug} onClick={() => handleSuggestionClick(sug)} style={{ padding: "10px 12px", borderBottom: "1px solid var(--br)", cursor: "pointer", fontSize: 13 }}>
                                {sug}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rp">
                <div className="card" style={{ marginBottom: 12 }}>
                    <div className="lbl" style={{ marginBottom: 10 }}>Route Planner — tap pins on map</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ width: 10, height: 10, background: "var(--green)", borderRadius: "50%", flexShrink: 0 }} />
                            <div
                                onClick={() => setSelecting("from")}
                                style={{ flex: 1, padding: "10px 12px", background: "var(--s2)", borderRadius: 10, border: `1.5px solid ${selecting === "from" ? "var(--cr)" : "var(--br)"}`, fontSize: 13, cursor: "pointer", color: from ? "var(--tx)" : "var(--tx2)" }}
                            >
                                {from || "Select starting point"}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ width: 10, height: 10, background: "var(--cr)", borderRadius: "50%", flexShrink: 0 }} />
                            <div
                                onClick={() => setSelecting("to")}
                                style={{ flex: 1, padding: "10px 12px", background: "var(--s2)", borderRadius: 10, border: `1.5px solid ${selecting === "to" ? "var(--cr)" : "var(--br)"}`, fontSize: 13, cursor: "pointer", color: to ? "var(--tx)" : "var(--tx2)" }}
                            >
                                {to || "Select destination"}
                            </div>
                        </div>
                        {(from || to) && (
                            <button className="btn-o" onClick={clearSelection} style={{ padding: 10, fontSize: 13 }}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {routes && routes.map((route, i) => (
                    <div key={i} className={`rc ${i === 0 ? "sel" : ""}`}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{route.route_name || `Route ${i + 1}`}</div>
                            <div className="sbadge" style={{ background: getSafetyColor(route.average_safety_score) + "22", color: getSafetyColor(route.average_safety_score) }}>
                                {route.average_safety_score}/10
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--tx2)" }}>
                            {route.route_locations ? route.route_locations.join(" → ") : route.via || "Via main roads"}
                        </div>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--tx2)", marginTop: 8 }}>
                            <span>🕐 {route.estimated_time || "N/A"}</span>
                            <span>📍 {route.distance || "N/A"}</span>
                            <span style={{ color: getSafetyColor(route.average_safety_score), fontWeight: 700 }}>
                                {getSafetyLabel(route.average_safety_score)}
                            </span>
                        </div>
                        <div style={{ height: 4, background: "var(--br)", borderRadius: 2, marginTop: 10 }}>
                            <div style={{ height: "100%", borderRadius: 2, width: `${route.average_safety_score * 10}%`, background: getSafetyColor(route.average_safety_score), transition: "width .7s" }} />
                        </div>
                        {route.recommendations && route.recommendations.length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 11, color: "var(--tx2)", padding: 8, background: "var(--s2)", borderRadius: 8 }}>
                                💡 {route.recommendations[0]}
                            </div>
                        )}
                    </div>
                ))}

                <div className="stitle" style={{ marginTop: 20 }}>Area Advisories</div>
                {AREA_ADVISORIES.map((a, i) => (
                    <div key={i} className={`abanner ${a.level === "CRITICAL" ? "crit" : "caut"}`} style={{ marginLeft: 0, marginRight: 0, marginBottom: 8 }}>
                        <span>{a.level === "CRITICAL" ? "🔴" : "🟡"}</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{a.area}
                                <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 7px", borderRadius: 4, background: a.level === "CRITICAL" ? "var(--red)" : "var(--amber)", color: "white" }}>{a.level}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--tx2)", marginTop: 3 }}>{a.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};