import { Icons } from './Icons';

export const Splash = ({ onLogin, onSignup }) => (
    <div className="splash fade-in">
        <div className="splash-logo"><Icons name="shield" size={38} color="white" /></div>
        <div style={{ fontFamily: "var(--fd)", fontSize: 34, fontWeight: 700 }}>SafeSentinel</div>
        <div style={{ color: "var(--tx2)", fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 1.6 }}>
            Your Digital Sanctuary Guide.<br />AI-powered safety routing for Chennai.
        </div>
        <div style={{ margin: "28px 0", display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            {[
                ["🗺️", "Real-time Safety Map", "Live crime & lighting overlay"],
                ["🛡️", "Smart Route Planning", "Safest Dijkstra-optimized path"],
                ["🔔", "Instant Advisories", "Community-powered alerts"]
            ].map(([ic, t, d]) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, background: "var(--s2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{ic}</div>
                    <div style={{ fontSize: 13, color: "var(--tx2)" }}><strong style={{ color: "var(--tx)" }}>{t}</strong> — {d}</div>
                </div>
            ))}
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="btn-p" onClick={onLogin}>Sign In</button>
            <button className="btn-o" onClick={onSignup}>Create Account</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--green)", marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, background: "var(--green)", borderRadius: "50%", display: "inline-block" }} />
            Securing connectivity · End-to-end encrypted
        </div>
    </div>
);