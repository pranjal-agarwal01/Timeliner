import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach token from localStorage as fallback
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const register = (email, password) =>
    api.post('/api/auth/register', { email, password });

export const verifyOTP = (email, otp) =>
    api.post('/api/auth/verify-otp', { email, otp });

export const login = (email, password) =>
    api.post('/api/auth/login', { email, password });

export const resendOTP = (email) =>
    api.post('/api/auth/resend-otp', { email });

export const logout = () => api.post('/api/auth/logout');

// ─── Questions ───────────────────────────────────────────────────────────────
export const addQuestion = (data) => api.post('/api/questions', data);

export const getTodayQuestions = (date) =>
    api.get('/api/questions/today', { params: { date } });

export const markRevision3 = (id) =>
    api.patch(`/api/questions/${id}/revision3`);

export const markRevision10 = (id) =>
    api.patch(`/api/questions/${id}/revision10`);

export const getCompleted = (params) =>
    api.get('/api/questions/completed', { params });

export default api;
