import { useState, useEffect } from 'react';
import { safetyAPI } from '../services/api';
import { getSafetyColor, getSafetyLabel } from '../utils/constants';

export const SafetyMap = ({ from, to, onLocationSelect, setLoading }) => {
    const [locations, setLocations] = useState([]);
    const [coordinates, setCoordinates] = useState({});

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const response = await safetyAPI.getSafestLocations(50);
            if (response.data && response.data.locations) {
                setLocations(response.data.locations);
                // Build coordinates map from response
                const coordMap = {};
                response.data.locations.forEach(loc => {
                    if (loc.coordinates) {
                        coordMap[loc.name] = loc.coordinates;
                    }
                });
                setCoordinates(coordMap);
            }
        } catch (err) {
            console.error("Failed to load locations:", err);
        } finally {
            setLoading(false);
        }
    };

    const getCoordinate = (locationName) => {
        // This would come from backend API with actual coordinates
        // For now, using approximate coordinates based on location name hash
        const hash = locationName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return {
            x: 50 + (hash % 300),
            y: 30 + ((hash * 13) % 190)
        };
    };

    return (
        <div className="map-cont">
            <svg viewBox="0 0 380 235" className="map-svg" xmlns="http://www.w3.org/2000/svg">
                <rect width="380" height="235" fill="#141420" />

                {/* Grid lines */}
                {[0, 1, 2, 3].map(i => (
                    <line key={`h${i}`} x1={30 + i * 87} y1="10" x2={30 + i * 87} y2="225" stroke="#252535" strokeWidth="0.8" />
                ))}
                {[0, 1, 2, 3].map(i => (
                    <line key={`v${i}`} x1="10" y1={20 + i * 53} x2="370" y2={20 + i * 53} stroke="#252535" strokeWidth="0.8" />
                ))}

                {/* Route line between selected locations */}
                {from && to && (() => {
                    const fCoord = getCoordinate(from);
                    const tCoord = getCoordinate(to);
                    return (
                        <>
                            <line x1={fCoord.x} y1={fCoord.y} x2={tCoord.x} y2={tCoord.y} stroke="#c0394b" strokeWidth="2.5" strokeDasharray="7,5" opacity="0.85" />
                            <circle cx={(fCoord.x + tCoord.x) / 2} cy={(fCoord.y + tCoord.y) / 2} r="5" fill="#c0394b" opacity="0.6" />
                        </>
                    );
                })()}

                {/* Location pins */}
                {locations.map((loc) => {
                    const coord = getCoordinate(loc.name);
                    const score = loc.safety_score || 5;
                    const col = getSafetyColor(score);
                    const isFrom = from === loc.name;
                    const isTo = to === loc.name;

                    return (
                        <g key={loc.name} className="mpin" onClick={() => onLocationSelect(loc.name)} style={{ cursor: "pointer" }}>
                            {(isFrom || isTo) && <circle cx={coord.x} cy={coord.y} r="16" fill={col} opacity="0.15" />}
                            <circle cx={coord.x} cy={coord.y} r={isFrom || isTo ? 9 : 6} fill={col} opacity={isFrom || isTo ? 1 : 0.72} />
                            <text x={coord.x} y={coord.y + 18} textAnchor="middle" fill="#ccc" fontSize="7.5" fontFamily="DM Sans" fontWeight="500">
                                {loc.name.length > 12 ? loc.name.substring(0, 10) + "..." : loc.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <div className="map-leg">
                <div className="leg-d"><div className="dot" style={{ background: "#22c55e" }} /> Safe</div>
                <div className="leg-d"><div className="dot" style={{ background: "#f59e0b" }} /> Moderate</div>
                <div className="leg-d"><div className="dot" style={{ background: "#ef4444" }} /> Caution</div>
            </div>
        </div>
    );
};