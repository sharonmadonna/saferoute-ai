import { Icons } from './Icons';

export const WarningScreen = ({ dest, onBack }) => (
    <div style={{ padding: "20px 16px" }} className="fade-in">
        <div style={{ background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.28)", borderRadius: "var(--r)", padding: 20, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>Warning: Journey Interrupted</div>
            <div style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6 }}>
                Could not find safe locations.<br />Destination "{dest || "Unknown"}" not recognized or GPS disabled.
            </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Recommended Steps</div>
            {[
                "Check your device GPS settings",
                "Verify the spelling of the destination",
                "Ensure you have a stable data connection",
                "Try selecting manually from the map"
            ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--cr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: "var(--tx2)" }}>{s}</div>
                </div>
            ))}
        </div>

        <button className="btn-p" style={{ background: "var(--green)", marginBottom: 10 }} onClick={onBack}>
            Enable GPS 📍
        </button>
        <button className="btn-o" onClick={onBack}>Change Destination</button>
    </div>
);