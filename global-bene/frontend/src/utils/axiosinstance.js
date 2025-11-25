// import axios from 'axios';

// // Create axios instance with production-ready configuration
// const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
//   timeout: 30000, // 30 seconds timeout
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true, // Important for cookies/auth
// });

// // Request interceptor for adding auth tokens and logging
// axiosInstance.interceptors.request.use(
//   (config) => {
//     // Add request timestamp for debugging
//     config.metadata = { startTime: new Date() };

//     // Log requests in development
//     if (import.meta.env.DEV) {
//       console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
//     }

//     return config;
//   },
//   (error) => {
//     console.error('❌ Request Error:', error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for error handling and retries
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Calculate response time
//     const duration = new Date() - response.config.metadata.startTime;

//     // Log successful responses in development
//     if (import.meta.env.DEV) {
//       console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
//     }

//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     // Don't retry if already retried or if it's a client error (4xx)
//     if (
//       originalRequest?._retry ||
//       (error.response && error.response.status >= 400 && error.response.status < 500)
//     ) {
//       return handleApiError(error);
//     }

//     // Retry logic for network errors or 5xx errors
//     if (
//       (!error.response || error.response.status >= 500) &&
//       (!originalRequest || !originalRequest._retryCount)
//     ) {
//       originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

//       if (originalRequest._retryCount <= 3) {
//         console.warn(`🔄 Retrying API request (${originalRequest._retryCount}/3):`, originalRequest.url);

//         // Exponential backoff
//         const delay = Math.pow(2, originalRequest._retryCount) * 1000;
//         await new Promise(resolve => setTimeout(resolve, delay));

//         return axiosInstance(originalRequest);
//       }
//     }

//     return handleApiError(error);
//   }
// );

// // Centralized error handling
// const handleApiError = (error) => {
//   let errorMessage = 'An unexpected error occurred';
//   let statusCode = 500;

//   if (error.response) {
//     // Server responded with error status
//     statusCode = error.response.status;
//     errorMessage = error.response.data?.message || error.response.statusText || errorMessage;

//     // Handle specific error codes
//     switch (statusCode) {
//       case 401:
//         errorMessage = 'Authentication required. Please log in again.';
//         // Optionally redirect to login
//         // window.location.href = '/login';
//         break;
//       case 403:
//         errorMessage = 'You do not have permission to perform this action.';
//         break;
//       case 404:
//         errorMessage = 'The requested resource was not found.';
//         break;
//       case 429:
//         errorMessage = 'Too many requests. Please try again later.';
//         break;
//       case 500:
//         errorMessage = 'Server error. Please try again later.';
//         break;
//       default:
//         break;
//     }
//   } else if (error.request) {
//     // Network error
//     errorMessage = 'Network error. Please check your connection and try again.';
//     statusCode = 0;
//   }

//   // Log error for debugging
//   console.error('🚨 API Error:', {
//     message: errorMessage,
//     status: statusCode,
//     url: error.config?.url,
//     method: error.config?.method,
//     timestamp: new Date().toISOString()
//   });

//   // Return a standardized error object
//   const apiError = {
//     message: errorMessage,
//     status: statusCode,
//     isNetworkError: !error.response,
//     originalError: import.meta.env.DEV ? error : undefined
//   };

//   return Promise.reject(apiError);
// };

// export default axiosInstance;
import axios from 'axios';

/**
 * Normalize API base URL:
 * - If VITE_API_URL is provided and does not include '/api', append '/api'
 * - Remove trailing slashes
 * - Fallback to localhost API during development
 */
const rawApi = import.meta.env.VITE_API_URL || '';
const DEFAULT_LOCAL = 'http://localhost:5000/api';

function normalizeApiUrl(url) {
  if (!url || url.trim() === '') return DEFAULT_LOCAL;
  // remove trailing slash(es)
  let u = url.trim().replace(/\/+$/, '');
  // If user provided a URL that already includes '/api' segment, keep it.
  if (!/\/api(\/|$)/i.test(u)) {
    u = `${u}/api`;
  }
  return u;
}

const API_BASE = normalizeApiUrl(rawApi);

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };

<<<<<<< HEAD
    // Add authorization token if available
=======
    // Attach auth token when present
>>>>>>> 4ceddccd83fa6329e2c6c40d66914b88b71eb3dd
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

<<<<<<< HEAD
    // Log requests in development
=======
    // Helpful debug log in dev
>>>>>>> 4ceddccd83fa6329e2c6c40d66914b88b71eb3dd
    if (import.meta.env.DEV) {
      console.log('🚀 API Request:', (config.method || '').toUpperCase(), config.baseURL + (config.url || ''));
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response?.config?.metadata?.startTime) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }
    return response;
  },
  async (error) => {
    const originalConfig = error.config || {};
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
    }

    console.error('🚨 API Error:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      url: originalConfig.baseURL ? `${originalConfig.baseURL}${originalConfig.url}` : originalConfig.url,
      method: originalConfig.method,
    });

    return Promise.reject(error);
  }
);

// Helper to inspect resolved API base during debugging
export function getResolvedApiBase() {
  return API_BASE;
}

export default axiosInstance;
