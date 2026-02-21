import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(email, password);
            loginUser(email, res.data.token);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            toast.error(msg);
            if (msg.includes('verify')) {
                navigate('/verify-otp', { state: { email } });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="logo-icon">🚀</div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your DSA Tracker</p>
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
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <span className="spinner-sm"></span> : 'Sign In'}
                    </button>
                </form>
                <p className="auth-footer">
                    Don&apos;t have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
