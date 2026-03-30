import { useState } from 'react';
import { Icons } from './Icons';
import { authAPI } from '../services/api';

export const Signup = ({ onSignup, onLogin, setLoading }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");

    const handleSignup = async () => {
        if (!name || !email || !pass) {
            setError("Please fill in all fields");
            return;
        }
        if (pass.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const response = await authAPI.signup(name, email, pass);
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onSignup();
            } else {
                setError("Signup failed");
            }
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.detail || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-screen fade-in">
            <div className="auth-logo">
                <div className="auth-logo-icon"><Icons name="shield" size={24} color="white" /></div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 700 }}>SafeSentinel</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>Begin your journey to peace of mind.</div>
            </div>

            {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid var(--red)", borderRadius: 10, padding: 10, marginBottom: 16, fontSize: 12, color: "var(--red)" }}>
                    {error}
                </div>
            )}

            <div className="fg">
                <div className="lbl">Email Address</div>
                <input className="inp" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="fg">
                <div className="lbl">Full Name</div>
                <input className="inp" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="fg">
                <div className="lbl">Password</div>
                <input className="inp" type="password" placeholder="Create a strong password" value={pass} onChange={e => setPass(e.target.value)} />
            </div>

            <button className="btn-p" onClick={handleSignup}>Create Account</button>

            <div className="divider">
                <div className="divider-line" />
                <span style={{ fontSize: 11, color: "var(--tx2)" }}>OR CONTINUE WITH</span>
                <div className="divider-line" />
            </div>

            <button className="social-btn">🔵 Google</button>
            <button className="social-btn">📱 Phone Number</button>

            <div className="link-text">Already have an account? <a onClick={onLogin}>Sign In</a></div>
        </div>
    );
};