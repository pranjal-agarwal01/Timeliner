import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists in localStorage on mount
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('userEmail');
        if (token && email) {
            setUser({ email, token });
        }
        setLoading(false);
    }, []);

    const loginUser = (email, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        setUser({ email, token });
    };

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        setUser(null);
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
