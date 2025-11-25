import axios from 'axios';

// Create axios instance with production-ready configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor for adding auth tokens and logging
axiosInstance.interceptors.request.use(
  (config) => {
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Add authorization token if available
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retries
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate response time
    const duration = new Date() - response.config.metadata.startTime;

    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if already retried or if it's a client error (4xx)
    if (
      originalRequest?._retry ||
      (error.response && error.response.status >= 400 && error.response.status < 500)
    ) {
      return handleApiError(error);
    }

    // Retry logic for network errors or 5xx errors
    if (
      (!error.response || error.response.status >= 500) &&
      (!originalRequest || !originalRequest._retryCount)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        console.warn(`🔄 Retrying API request (${originalRequest._retryCount}/3):`, originalRequest.url);

        // Exponential backoff
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        return axiosInstance(originalRequest);
      }
    }

    return handleApiError(error);
  }
);

// Centralized error handling
const handleApiError = (error) => {
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;

  if (error.response) {
    // Server responded with error status
    statusCode = error.response.status;
    errorMessage = error.response.data?.message || error.response.statusText || errorMessage;

    // Handle specific error codes
    switch (statusCode) {
      case 401:
        errorMessage = 'Authentication required. Please log in again.';
        // Optionally redirect to login
        // window.location.href = '/login';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        break;
    }
  } else if (error.request) {
    // Network error
    errorMessage = 'Network error. Please check your connection and try again.';
    statusCode = 0;
  }

  // Log error for debugging
  console.error('🚨 API Error:', {
    message: errorMessage,
    status: statusCode,
    url: error.config?.url,
    method: error.config?.method,
    timestamp: new Date().toISOString()
  });

  // Return a standardized error object
  const apiError = {
    message: errorMessage,
    status: statusCode,
    isNetworkError: !error.response,
    originalError: import.meta.env.DEV ? error : undefined
  };

  return Promise.reject(apiError);
};

export default axiosInstance;
