import { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { safetyAPI } from '../services/api';
import { getSafetyColor, getSafetyLabel } from '../utils/constants';

export const LocationScreen = ({ onSet, setLoading }) => {
    const [selected, setSelected] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [locations, setLocations] = useState([]);
    const [locationDetails, setLocationDetails] = useState({});

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const response = await safetyAPI.getSafestLocations(50);
            if (response.data && response.data.locations) {
                setLocations(response.data.locations);
                // Build details map
                const detailsMap = {};
                response.data.locations.forEach(loc => {
                    detailsMap[loc.name] = loc;
                });
                setLocationDetails(detailsMap);
            }
        } catch (err) {
            console.error("Failed to load locations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoDetect = async () => {
        setLoading(true);
        try {
            const response = await safetyAPI.autoDetectLocation();
            if (response.data && response.data.nearest_saferoute_location) {
                const detected = response.data.nearest_saferoute_location;
                setSelected(detected);
                onSet && onSet(detected);
            } else {
                alert("Could not auto-detect location. Please select manually.");
            }
        } catch (err) {
            console.error("Auto-detect failed:", err);
            alert("Auto-detection failed. Please select manually.");
        } finally {
            setLoading(false);
        }
    };

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb32 fade-in">
            <div className="top-bar">
                <div className="top-bar-title">Select Location</div>
            </div>

            <div style={{ padding: "12px 16px" }}>
                <input
                    className="inp"
                    placeholder="🔍 Search area..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ padding: "0 16px", marginBottom: 14 }}>
                <button className="btn-o" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleAutoDetect}>
                    <Icons name="gps" size={16} /> Detect Live Location
                </button>
            </div>

            <div style={{ padding: "0 16px", marginBottom: 8 }}>
                <div className="lbl">Chennai Neighborhoods</div>
            </div>

            <div className="lgrid">
                {filteredLocations.map(loc => {
                    const details = locationDetails[loc.name] || { safety_score: 5, total_crimes: 0, lighting_efficiency_percent: 0 };
                    return (
                        <div
                            key={loc.name}
                            className={`lchip ${selected === loc.name ? "sel" : ""}`}
                            onClick={() => setSelected(loc.name)}
                        >
                            <div style={{ fontWeight: 700, marginBottom: 3 }}>{loc.name}</div>
                            <div style={{ fontSize: 11, color: getSafetyColor(details.safety_score), fontWeight: 700 }}>
                                {getSafetyLabel(details.safety_score)} · {details.safety_score}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selected && locationDetails[selected] && (
                <div style={{ padding: "16px" }}>
                    <div className="card" style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{selected}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            <div style={{ background: "var(--s2)", borderRadius: 10, padding: 8, textAlign: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: getSafetyColor(locationDetails[selected].safety_score) }}>
                                    {locationDetails[selected].safety_score}/10
                                </div>
                                <div style={{ fontSize: 10, color: "var(--tx2)" }}>Safety</div>
                            </div>
                            <div style={{ background: "var(--s2)", borderRadius: 10, padding: 8, textAlign: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>
                                    {locationDetails[selected].total_crimes || "N/A"}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--tx2)" }}>Crimes</div>
                            </div>
                            <div style={{ background: "var(--s2)", borderRadius: 10, padding: 8, textAlign: "center" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>
                                    {locationDetails[selected].lighting_efficiency_percent || "N/A"}%
                                </div>
                                <div style={{ fontSize: 10, color: "var(--tx2)" }}>Lighting</div>
                            </div>
                        </div>
                    </div>
                    <button className="btn-p" onClick={() => onSet && onSet(selected)}>Set as My Location</button>
                </div>
            )}
        </div>
    );
};