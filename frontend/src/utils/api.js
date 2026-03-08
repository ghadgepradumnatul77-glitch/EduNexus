import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-EduNexus-CSRF': 'true', // Simple custom header for CSRF protection
    },
});

// Response interceptor to handle session expiry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 (Unauthorized), attempt to refresh session
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call refresh endpoint - browser will automatically send the refreshToken cookie
                await axios.post('/api/auth/refresh', {}, { withCredentials: true });

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear user state and redirect to login
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
