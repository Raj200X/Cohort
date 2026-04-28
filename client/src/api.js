import axios from 'axios';
import API_URL from './config';

/**
 * Pre-configured axios instance.
 * Automatically attaches the JWT Bearer token from localStorage to every request.
 * Import this instead of raw axios for any authenticated API calls.
 */
const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor — inject token on every outgoing request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401s globally (token expired / invalid)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear stale auth data and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
