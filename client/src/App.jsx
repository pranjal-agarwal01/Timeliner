import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Completed from './pages/Completed';
import Landing from './pages/Landing';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1e1b2e',
                            color: '#e2e0f0',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            borderRadius: '12px',
                            fontFamily: 'Inter, sans-serif',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: '#1e1b2e' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: '#1e1b2e' },
                        },
                    }}
                />
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/completed"
                        element={
                            <ProtectedRoute>
                                <Completed />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Landing />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
