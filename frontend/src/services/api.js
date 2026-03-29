import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email, password) => api.post('/api/auth/login', { email, password }),
    signup: (name, email, password) => api.post('/api/auth/signup', { name, email, password }),
    forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
    verifyOTP: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
    resetPassword: (email, newPassword) => api.post('/api/auth/reset-password', { email, newPassword }),
};

// Safety APIs
export const safetyAPI = {
    getRouteRecommendation: (start, end, hour = null) =>
        api.get('/api/route', { params: { start, end, hour } }),

    getAlternativeRoutes: (start, end, numRoutes = 3, hour = null) =>
        api.get('/api/route/alternatives', { params: { start, end, num_routes: numRoutes, hour } }),

    checkLocationSafety: (location, hour = null) =>
        api.get('/api/location/safety', { params: { location, hour } }),

    getSafestLocations: (topN = 10) =>
        api.get('/api/locations/safest', { params: { top_n: topN } }),

    getDangerousLocations: (topN = 10) =>
        api.get('/api/locations/dangerous', { params: { top_n: topN } }),

    getTimePeriodSafety: () =>
        api.get('/api/time-periods/safety'),

    searchLocations: (query) =>
        api.get('/api/locations/search', { params: { q: query } }),

    autoDetectLocation: () =>
        api.get('/api/location/auto-detect'),

    getSystemStatus: () =>
        api.get('/api/system/status'),

    getLocationSuggestions: (partial) =>
        api.get('/api/locations/suggestions', { params: { partial } }),
};

export default api;