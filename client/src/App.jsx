import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Route-based code splitting — each page is a separate JS chunk.
// Users only download what they actually navigate to.
const Register  = lazy(() => import('./pages/Register'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'));
const Login     = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Completed = lazy(() => import('./pages/Completed'));
const Landing   = lazy(() => import('./pages/Landing'));

function PageSpinner() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg, #f8fafc)',
        }}>
            <div className="spinner" />
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#ffffff',
                            color: '#111827',
                            border: '1.5px solid #e5e7eb',
                            borderRadius: '12px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 24px rgba(79,70,229,0.1), 0 1px 4px rgba(0,0,0,0.06)',
                        },
                        success: {
                            iconTheme: { primary: '#059669', secondary: '#fff' },
                        },
                        error: {
                            iconTheme: { primary: '#dc2626', secondary: '#fff' },
                        },
                    }}
                />
                <Suspense fallback={<PageSpinner />}>
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
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}
