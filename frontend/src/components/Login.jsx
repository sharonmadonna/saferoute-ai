import { useState } from 'react';
import { Icons } from './Icons';
import { authAPI } from '../services/api';

export const Login = ({ onLogin, onSignup, onForgot, setLoading }) => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!email || !pass) {
            setError("Please enter both email and password");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const response = await authAPI.login(email, pass);
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLogin();
            } else {
                setError("Invalid credentials");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-screen fade-in">
            <div className="auth-logo">
                <div className="auth-logo-icon"><Icons name="shield" size={24} color="white" /></div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 700 }}>Welcome Back</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>Sign in to continue to SafeSentinel</div>
            </div>

            {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid var(--red)", borderRadius: 10, padding: 10, marginBottom: 16, fontSize: 12, color: "var(--red)" }}>
                    {error}
                </div>
            )}

            <div className="fg">
                <div className="lbl">Email</div>
                <input className="inp" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="fg">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="lbl">Password</div>
                    <span onClick={onForgot} style={{ fontSize: 12, color: "var(--cr)", cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
                </div>
                <div style={{ position: "relative" }}>
                    <input className="inp" type={showPass ? "text" : "password"} placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} style={{ paddingRight: 44 }} />
                    <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--tx2)" }}>
                        <Icons name={showPass ? "eyeOff" : "eye"} size={16} />
                    </span>
                </div>
            </div>

            <button className="btn-p" onClick={handleLogin}>Login</button>

            <div className="divider">
                <div className="divider-line" />
                <span style={{ fontSize: 11, color: "var(--tx2)" }}>OR CONTINUE WITH</span>
                <div className="divider-line" />
            </div>

            <button className="social-btn">🔵 Continue with Google</button>
            <button className="social-btn">📱 Continue with Phone Number</button>

            <div className="link-text">Don't have an account? <a onClick={onSignup}>Create Account</a></div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button style={{ flex: 1, padding: 12, border: "1.5px solid var(--red)", borderRadius: 12, background: "rgba(239,68,68,.08)", color: "var(--red)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--ff)" }}>🚨 FILE EMERGENCY</button>
                <button style={{ flex: 1, padding: 12, border: "1.5px solid var(--amber)", borderRadius: 12, background: "rgba(245,158,11,.08)", color: "var(--amber)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--ff)" }}>🔒 SAFE COMPLAINT</button>
            </div>
        </div>
    );
};