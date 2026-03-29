import { useState, useRef } from 'react';
import { Icons } from './Icons';
import { authAPI } from '../services/api';

export const ForgotPassword = ({ onBack, setLoading }) => {
    const [step, setStep] = useState(0);
    const [method, setMethod] = useState(null);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const refs = useRef([]);

    const handleOtp = (i, v) => {
        if (!/^\d?$/.test(v)) return;
        const n = [...otp];
        n[i] = v;
        setOtp(n);
        if (v && i < 5) refs.current[i + 1]?.focus();
    };

    const sendOTP = async () => {
        if (!method) return;
        setLoading(true);
        try {
            await authAPI.forgotPassword(email);
            setStep(1);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        const otpCode = otp.join("");
        if (otpCode.length !== 6) return;
        setLoading(true);
        try {
            await authAPI.verifyOTP(email, otpCode);
            setStep(2);
        } catch (err) {
            alert("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 2) return (
        <div className="auth-screen fade-in" style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Identity Verified!</div>
            <div style={{ color: "var(--tx2)", fontSize: 13, marginBottom: 32 }}>Your account has been successfully recovered.</div>
            <button className="btn-p" onClick={onBack}>Back to Sign In</button>
        </div>
    );

    if (step === 1) return (
        <div className="auth-screen fade-in">
            <div className="auth-logo">
                <div className="auth-logo-icon"><Icons name="lock" size={24} color="white" /></div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 700 }}>Verify Identity</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4, textAlign: "center" }}>
                    We sent a 6-digit code to your {method === "phone" ? "phone number" : "email"}
                </div>
            </div>
            <div style={{ marginTop: 16 }}>
                <div className="lbl" style={{ textAlign: "center", marginBottom: 14 }}>Enter 6-digit code</div>
                <div className="otp-row">
                    {otp.map((v, i) => (
                        <input
                            key={i}
                            ref={el => refs.current[i] = el}
                            className="otp-box"
                            maxLength={1}
                            value={v}
                            onChange={e => handleOtp(i, e.target.value)}
                            onKeyDown={e => e.key === "Backspace" && !v && i > 0 && refs.current[i - 1]?.focus()}
                        />
                    ))}
                </div>
                <button className="btn-p" style={{ marginTop: 20 }} onClick={verifyOTP}>Verify & Continue</button>
                <div className="link-text" style={{ marginTop: 14 }}>Didn't receive the code? <a>Resend in 0:45</a></div>
                <div className="link-text" style={{ marginTop: 8 }}><a onClick={() => setStep(0)}>← Change method</a></div>
            </div>
        </div>
    );

    return (
        <div className="auth-screen fade-in">
            <div className="auth-logo">
                <div className="auth-logo-icon"><Icons name="lock" size={24} color="white" /></div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 700 }}>Recover access</div>
                <div style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4, textAlign: "center" }}>
                    Choose a verification method to securely recover your account
                </div>
            </div>

            <div className="fg">
                <div className="lbl">Email Address</div>
                <input className="inp" placeholder="Enter your registered email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                    { id: "email", ic: "📧", t: "Via Email (OTP)", d: "A recovery link and code will be sent to your inbox" }
                ].map(opt => (
                    <div key={opt.id} onClick={() => setMethod(opt.id)}
                        style={{ background: "var(--s2)", border: `1.5px solid ${method === opt.id ? "var(--cr)" : "var(--br)"}`, borderRadius: 14, padding: 16, cursor: "pointer", transition: "border-color .2s" }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{opt.ic} {opt.t}</div>
                        <div style={{ fontSize: 12, color: "var(--tx2)" }}>{opt.d}</div>
                    </div>
                ))}
            </div>

            <button className="btn-p" disabled={!method || !email} onClick={sendOTP} style={{ marginTop: 24, opacity: method && email ? 1 : 0.45 }}>
                Send Reset Code →
            </button>

            <div className="link-text" style={{ marginTop: 14 }}><a onClick={onBack}>← Back to Sign In</a></div>
        </div>
    );
};