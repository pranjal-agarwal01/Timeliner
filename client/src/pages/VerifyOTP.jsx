import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, resendOTP } from '../api';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await verifyOTP(email, otp);
            toast.success(res.data.message);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const res = await resendOTP(email);
            toast.success(res.data.message);
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
                    <div className="logo-icon">🔐</div>
                    <h1>Verify Email</h1>
                    <p>Enter the 6-digit code sent to your email</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="otp">Verification Code</label>
                        <input
                            id="otp"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            maxLength={6}
                            className="otp-input"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <span className="spinner-sm"></span> : 'Verify'}
                    </button>
                </form>
                <button
                    className="btn btn-ghost btn-full"
                    onClick={handleResend}
                    disabled={resending}
                    style={{ marginTop: '0.5rem' }}
                >
                    {resending ? 'Sending...' : 'Resend Code'}
                </button>
                <p className="auth-footer">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
