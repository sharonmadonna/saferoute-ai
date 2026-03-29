import { useState, useEffect } from 'react';
import { Splash } from './components/Splash';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ForgotPassword } from './components/ForgotPassword';
import { MapScreen } from './components/MapScreen';
import { SafetyTools } from './components/SafetyTools';
import { LocationScreen } from './components/LocationScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { WarningScreen } from './components/WarningScreen';
import { Icons } from './components/Icons';

function App() {
    const [screen, setScreen] = useState("splash");
    const [tab, setTab] = useState("map");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('auth_token');
        if (token && screen === "splash") {
            setScreen("main");
        }
    }, []);

    const goTo = (newScreen, newTab = null) => {
        setScreen(newScreen);
        if (newTab) setTab(newTab);
    };

    const renderScreen = () => {
        switch (screen) {
            case "splash":
                return <Splash onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />;
            case "login":
                return <Login onLogin={() => goTo("main", "map")} onSignup={() => setScreen("signup")} onForgot={() => setScreen("forgot")} setLoading={setLoading} />;
            case "signup":
                return <Signup onSignup={() => goTo("main", "map")} onLogin={() => setScreen("login")} setLoading={setLoading} />;
            case "forgot":
                return <ForgotPassword onBack={() => setScreen("login")} setLoading={setLoading} />;
            case "warning":
                return <WarningScreen dest="Unknown Location" onBack={() => goTo("main", "map")} />;
            case "main":
                return renderMain();
            default:
                return <Splash onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />;
        }
    };

    const renderMain = () => {
        switch (tab) {
            case "map":
                return <MapScreen setLoading={setLoading} />;
            case "tools":
                return <SafetyTools setLoading={setLoading} />;
            case "location":
                return <LocationScreen onSet={(loc) => console.log("Location set:", loc)} setLoading={setLoading} />;
            case "profile":
                return <ProfileScreen onLogout={() => {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    setScreen("splash");
                }} />;
            default:
                return <MapScreen setLoading={setLoading} />;
        }
    };

    const showNav = screen === "main";
    const tabs = [
        { id: "map", icon: "map", label: "Map" },
        { id: "tools", icon: "tool", label: "Safety" },
        { id: "location", icon: "location", label: "Locate" },
        { id: "profile", icon: "user", label: "Profile" },
    ];

    return (
        <>
            <style>{`
        .splash {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 700px;
          background: radial-gradient(ellipse at 50% 25%, #2a0a10 0%, var(--bg) 65%);
          padding: 40px 28px;
        }
        .splash-logo {
          width: 84px;
          height: 84px;
          background: var(--cr);
          border-radius: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          box-shadow: 0 0 60px rgba(192,57,75,.45);
          animation: pulse 2.4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 60px rgba(192,57,75,.4); }
          50% { box-shadow: 0 0 100px rgba(192,57,75,.65); }
        }
        .auth-screen {
          padding: 24px;
          min-height: 700px;
        }
        .auth-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 28px;
          margin-top: 12px;
        }
        .auth-logo-icon {
          width: 52px;
          height: 52px;
          background: var(--cr);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .fg {
          margin-bottom: 16px;
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--br);
        }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px;
          background: var(--s2);
          border: 1.5px solid var(--br);
          border-radius: 12px;
          color: var(--tx);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--ff);
          transition: border-color 0.2s;
          margin-bottom: 10px;
        }
        .social-btn:hover {
          border-color: var(--tx2);
        }
        .link-text {
          font-size: 13px;
          color: var(--tx2);
          text-align: center;
          margin-top: 18px;
        }
        .link-text a {
          color: var(--cr);
          text-decoration: none;
          font-weight: 700;
          cursor: pointer;
        }
        .otp-row {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin: 20px 0;
        }
        .otp-box {
          width: 48px;
          height: 56px;
          background: var(--s2);
          border: 1.5px solid var(--br);
          border-radius: 12px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          color: var(--tx);
          font-family: var(--fd);
          outline: none;
          transition: border-color 0.2s;
        }
        .otp-box:focus {
          border-color: var(--cr);
        }
        .map-cont {
          position: relative;
          background: var(--s2);
          border-radius: var(--r);
          overflow: hidden;
          margin: 0 16px 12px;
          height: 250px;
        }
        .map-svg {
          width: 100%;
          height: 100%;
        }
        .map-ot {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .map-si {
          flex: 1;
          padding: 9px 13px;
          background: rgba(15,15,18,.92);
          border: 1px solid var(--br);
          border-radius: 10px;
          color: var(--tx);
          font-size: 13px;
          font-family: var(--ff);
          outline: none;
        }
        .map-ib {
          width: 36px;
          height: 36px;
          background: rgba(15,15,18,.92);
          border: 1px solid var(--br);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .map-leg {
          position: absolute;
          bottom: 10px;
          left: 10px;
          display: flex;
          gap: 10px;
        }
        .leg-d {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--tx2);
          font-weight: 600;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .mpin {
          cursor: pointer;
          transition: transform 0.15s;
        }
        .mpin:hover circle {
          r: 10;
        }
        .rp {
          padding: 0 16px;
        }
        .rc {
          background: var(--s1);
          border: 1px solid var(--br);
          border-radius: var(--r);
          padding: 14px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .rc:hover {
          border-color: var(--cr);
        }
        .rc.sel {
          border-color: var(--cr);
          background: rgba(192,57,75,.07);
        }
        .tgrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 0 16px;
          margin-bottom: 14px;
        }
        .tcrd {
          background: var(--s1);
          border: 1px solid var(--br);
          border-radius: var(--r);
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tcrd:hover {
          border-color: var(--cr);
          transform: translateY(-2px);
        }
        .ph {
          background: linear-gradient(135deg, var(--cr-d), var(--cr));
          padding: 32px 20px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(255,255,255,.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 10px;
          border: 3px solid rgba(255,255,255,.3);
        }
        .pr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 0;
          border-bottom: 1px solid var(--br);
          cursor: pointer;
        }
        .pr:last-child {
          border-bottom: none;
        }
        .pr-l {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pr-ic {
          width: 36px;
          height: 36px;
          background: var(--s2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toggle {
          width: 44px;
          height: 24px;
          background: var(--br);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
          border: none;
          flex-shrink: 0;
        }
        .toggle.on {
          background: var(--cr);
        }
        .toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: left 0.2s;
        }
        .toggle.on::after {
          left: 22px;
        }
        .abanner {
          margin: 0 16px 10px;
          padding: 12px 14px;
          border-radius: 12px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .abanner.crit {
          background: rgba(239,68,68,.09);
          border: 1px solid rgba(239,68,68,.28);
        }
        .abanner.caut {
          background: rgba(245,158,11,.09);
          border: 1px solid rgba(245,158,11,.28);
        }
        .tbr {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .tbl {
          font-size: 11px;
          color: var(--tx2);
          width: 76px;
          flex-shrink: 0;
        }
        .tbbg {
          flex: 1;
          height: 7px;
          background: var(--br);
          border-radius: 4px;
          overflow: hidden;
        }
        .tbf {
          height: 100%;
          border-radius: 4px;
          transition: width 0.9s;
        }
        .lgrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 0 16px;
        }
        .lchip {
          padding: 10px 12px;
          background: var(--s1);
          border: 1.5px solid var(--br);
          border-radius: 12px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          font-weight: 500;
        }
        .lchip:hover {
          border-color: var(--cr);
          color: var(--cr);
        }
        .lchip.sel {
          border-color: var(--cr);
          background: rgba(192,57,75,.1);
          color: var(--cr);
          font-weight: 700;
        }
        .drag-item {
          background: var(--s1);
          border: 1px solid var(--br);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: grab;
          user-select: none;
          transition: all 0.15s;
        }
        .drag-item:active {
          cursor: grabbing;
          transform: scale(1.02);
          border-color: var(--cr);
        }
        .drag-item.drag-over {
          border-color: var(--cr);
          background: rgba(192,57,75,.07);
        }
        .pb32 {
          padding-bottom: 32px;
        }
      `}</style>

            <div className="phone-wrap">
                <div className="phone">
                    <div className="notch" />
                    <div className="status-bar">
                        <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span style={{ fontFamily: "var(--fd)", fontSize: 11, color: "var(--cr)", fontWeight: 700 }}>SafeSentinel</span>
                        <span>📶🔋</span>
                    </div>

                    <div className="screen">
                        {loading && (
                            <div className="loading-overlay">
                                <div className="loading-content">
                                    <div className="loader" />
                                    <p>Loading safety data...</p>
                                </div>
                            </div>
                        )}
                        {renderScreen()}
                    </div>

                    {showNav && (
                        <nav className="bottom-nav">
                            {tabs.map(t => (
                                <button key={t.id} className={`nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                                    <Icons name={t.icon} size={22} />
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Sidebar for quick navigation */}
                <div className="side-nav">
                    <div style={{ fontSize: 10, color: "#444", fontFamily: "DM Sans", letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 4 }}>Quick Access</div>
                    {[
                        { l: "🚀 Splash", s: "splash" },
                        { l: "🔑 Login", s: "login" },
                        { l: "📝 Sign Up", s: "signup" },
                        { l: "🔒 Forgot Password", s: "forgot" },
                        { l: "🗺️ Safety Map", s: "main", t: "map" },
                        { l: "🛠️ Safety Tools", s: "main", t: "tools" },
                        { l: "📍 Location Picker", s: "main", t: "location" },
                        { l: "👤 Profile", s: "main", t: "profile" },
                        { l: "⚠️ Warning Screen", s: "warning" },
                    ].map(item => (
                        <button key={item.l} className="snav-btn" onClick={() => goTo(item.s, item.t)}>{item.l}</button>
                    ))}
                </div>
            </div>
        </>
    );
}

export default App;