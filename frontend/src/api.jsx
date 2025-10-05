import axios from 'axios';

const getApiUrl = () => process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: getApiUrl(),
});

// Request Interceptor: Adds the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handles expired tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired, log the user out
            localStorage.removeItem('authToken');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;