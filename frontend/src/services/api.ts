import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leadvault_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('leadvault_token');
      localStorage.removeItem('leadvault_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Generic API error
export interface ApiError {
  success: false;
  message: string;
  error: string;
}

// Helper function for API calls
export const apiCall = async <T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw error.response.data;
    }
    throw {
      success: false,
      message: error.message || 'Network error occurred',
      error: 'NETWORK_ERROR'
    };
  }
};

export default apiClient;