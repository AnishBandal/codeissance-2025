import { apiCall, ApiResponse } from './api';

// Auth types matching backend
export interface AuthUser {
  id: string;
  username: string;
  role: 'Higher Authority' | 'Nodal Officer' | 'Processing Staff';
  zone: string | null;
  lastLogin: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  expiresIn: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: 'Higher Authority' | 'Nodal Officer' | 'Processing Staff';
  zone?: string;
  createdBy?: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiCall<LoginResponse>({
      method: 'POST',
      url: '/auth/login',
      data: credentials
    });

    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('leadvault_token', response.data.token);
      localStorage.setItem('leadvault_user', JSON.stringify(response.data.user));
    }

    return response;
  }

  /**
   * Register new user (admin only)
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return await apiCall<LoginResponse>({
      method: 'POST',
      url: '/auth/register',
      data: userData
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<{ user: AuthUser }>> {
    return await apiCall<{ user: AuthUser }>({
      method: 'GET',
      url: '/auth/profile'
    });
  }

  /**
   * Refresh auth token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; expiresIn: string }>> {
    return await apiCall({
      method: 'POST',
      url: '/auth/refresh'
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiCall({
        method: 'POST',
        url: '/auth/logout'
      });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('leadvault_token');
      localStorage.removeItem('leadvault_user');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('leadvault_token');
    const user = localStorage.getItem('leadvault_user');
    return !!(token && user);
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('leadvault_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get current token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('leadvault_token');
  }

  /**
   * Map backend roles to frontend roles
   */
  mapRoleToFrontend(backendRole: string): 'processing' | 'nodal' | 'authority' {
    switch (backendRole) {
      case 'Higher Authority':
        return 'authority';
      case 'Nodal Officer':
        return 'nodal';
      case 'Processing Staff':
        return 'processing';
      default:
        return 'processing';
    }
  }

  /**
   * Map frontend roles to backend roles
   */
  mapRoleToBackend(frontendRole: 'processing' | 'nodal' | 'authority'): string {
    switch (frontendRole) {
      case 'authority':
        return 'Higher Authority';
      case 'nodal':
        return 'Nodal Officer';
      case 'processing':
        return 'Processing Staff';
      default:
        return 'Processing Staff';
    }
  }
}

export const authService = new AuthService();
export default authService;