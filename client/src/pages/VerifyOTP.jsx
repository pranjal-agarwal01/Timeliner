import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../api';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();
    const timerRef = useRef(null);

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        if (otp.length === 6 && !loading) {
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    // Cleanup interval on unmount — prevents memory leak and stale state updates
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) { toast.error('Enter the full 6-digit code'); return; }
        setLoading(true);
        try {
            const res = await verifyOTP(email, otp);
            toast.success(res.data.message || 'Email verified! You can now sign in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
            // Clear OTP field on failure so user can retry without clearing manually
            setOtp('');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        try {
            const res = await resendOTP(email);
            toast.success(res.data.message || 'New code sent!');
            // Start 60s cooldown (matches server-side 1-min rate limit)
            setCooldown(60);
            timerRef.current = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-mark">🔐</div>
                    <h1>Verify Your Email</h1>
                    <p>Enter the 6-digit code sent to<br /><strong>{email}</strong></p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    {!location.state?.email && (
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="otp">Verification Code</label>
                        <input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            placeholder="• • • • • •"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            maxLength={6}
                            className="otp-input"
                            autoFocus
                            autoComplete="one-time-code"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading || otp.length !== 6}>
                        {loading ? <span className="spinner-sm"></span> : 'Verify Email →'}
                    </button>
                </form>
                <button
                    className="btn btn-ghost btn-full"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    style={{ marginTop: '0.5rem' }}
                >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend Code'}
                </button>
                <p className="auth-footer">
                    <Link to="/login">← Back to Sign In</Link>
                </p>
            </div>
        </div>
    );
}
