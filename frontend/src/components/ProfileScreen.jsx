import { useState, useEffect } from 'react';
import { Icons } from './Icons';

export const ProfileScreen = ({ onLogout }) => {
    const [user, setUser] = useState(null);
    const [toggles, setToggles] = useState({ privacy: true, alerts: false, history: true });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            setUser({ name: "Guardian User", email: "user@safemail.com", phone: "+1 (555) 012-3456" });
        }
    }, []);

    const toggleSetting = (key) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="pb32 fade-in">
            <div className="ph">
                <div className="avatar">👤</div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 700 }}>{user?.name || "Guardian User"}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{user?.email || "user@safemail.com"}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 1 }}>{user?.phone || "+1 (555) 012-3456"}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <div className="sbadge" style={{ background: "rgba(255,255,255,.18)", color: "white" }}>✓ VERIFIED</div>
                    <div className="sbadge" style={{ background: "rgba(255,255,255,.18)", color: "white" }}>✓ TRUSTED</div>
                </div>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
                <div className="lbl" style={{ marginBottom: 8 }}>Personal Details</div>
                <div className="card">
                    {[
                        { ic: "👤", l: "Full Name", v: user?.name || "Eleanor Vance" },
                        { ic: "📧", l: "Email", v: user?.email || "user@safemail.com" },
                        { ic: "📱", l: "Phone", v: user?.phone || "+1 (555) 012-3456" }
                    ].map(row => (
                        <div key={row.l} className="pr">
                            <div className="pr-l">
                                <div className="pr-ic"><span>{row.ic}</span></div>
                                <div>
                                    <div style={{ fontSize: 11, color: "var(--tx2)" }}>{row.l}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{row.v}</div>
                                </div>
                            </div>
                            <Icons name="arrowRight" size={16} color="var(--tx2)" />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: "14px 16px 0" }}>
                <div className="lbl" style={{ marginBottom: 8 }}>Emergency Contact</div>
                <div className="card" style={{ background: "rgba(192,57,75,.07)", borderColor: "rgba(192,57,75,.28)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="pr-l">
                            <div className="pr-ic">❤️</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>Emergency Contact</div>
                                <div style={{ fontSize: 12, color: "var(--cr)" }}>+1 555-999-8877</div>
                            </div>
                        </div>
                        <Icons name="phone" size={18} color="var(--cr)" />
                    </div>
                </div>
            </div>

            <div style={{ padding: "14px 16px 0" }}>
                <div className="lbl" style={{ marginBottom: 8 }}>Account Settings</div>
                <div className="card">
                    {[
                        { ic: "🔒", l: "Security & Privacy", k: "privacy" },
                        { ic: "🔔", l: "Alert Preferences", k: "alerts" },
                        { ic: "📍", l: "Location History", k: "history" }
                    ].map(row => (
                        <div key={row.k} className="pr">
                            <div className="pr-l">
                                <div className="pr-ic"><span>{row.ic}</span></div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{row.l}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <button className={`toggle ${toggles[row.k] ? "on" : ""}`} onClick={() => toggleSetting(row.k)} />
                                <Icons name="arrowRight" size={16} color="var(--tx2)" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: "20px 16px" }}>
                <button className="btn-o" style={{ borderColor: "var(--red)", color: "var(--red)" }} onClick={onLogout}>
                    Sign Out
                </button>
            </div>
        </div>
    );
};