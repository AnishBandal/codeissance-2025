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

export interface Login2FAResponse {
  userId: string;
  username: string;
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
   * Login user - handles both regular login and 2FA requirement
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse | Login2FAResponse>> {
    console.log('🔐 AuthService: Making login API call for', credentials.username);
    
    const response = await apiCall<LoginResponse | Login2FAResponse>({
      method: 'POST',
      url: '/auth/login',
      data: credentials
    });

    console.log('🔐 AuthService: Login API response:', response);

    // Only store token and user data for complete login (not 2FA requirement)
    if (response.success && response.data && !response.requires2FA) {
      console.log('🔐 AuthService: Storing login data (no 2FA)');
      const loginData = response.data as LoginResponse;
      // Store token and user data
      localStorage.setItem('leadvault_token', loginData.token);
      localStorage.setItem('leadvault_user', JSON.stringify(loginData.user));
    } else if (response.requires2FA) {
      console.log('🔐 AuthService: 2FA required, not storing login data');
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
   * Complete login with 2FA verification
   */
  async loginWith2FA(userId: string, token: string): Promise<ApiResponse<LoginResponse>> {
    const response = await apiCall<LoginResponse>({
      method: 'POST',
      url: '/auth/login-2fa',
      data: { userId, token }
    });

    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('leadvault_token', response.data.token);
      localStorage.setItem('leadvault_user', JSON.stringify(response.data.user));
    }

    return response;
  }

  /**
   * Setup 2FA - Generate QR code and secret
   */
  async setup2FA(): Promise<ApiResponse<{
    qrCode: string;
    manualEntryKey: string;
    issuer: string;
    accountName: string;
  }>> {
    return await apiCall<{
      qrCode: string;
      manualEntryKey: string;
      issuer: string;
      accountName: string;
    }>({
      method: 'POST',
      url: '/2fa/setup'
    });
  }

  /**
   * Enable 2FA after verification
   */
  async enable2FA(token: string): Promise<ApiResponse<{
    backupCodes: string[];
  }>> {
    return await apiCall<{
      backupCodes: string[];
    }>({
      method: 'POST',
      url: '/2fa/enable',
      data: { token }
    });
  }

  /**
   * Disable 2FA
   */
  async disable2FA(token: string): Promise<ApiResponse<void>> {
    return await apiCall<void>({
      method: 'POST',
      url: '/2fa/disable',
      data: { token }
    });
  }

  /**
   * Get 2FA status
   */
  async get2FAStatus(): Promise<ApiResponse<{
    enabled: boolean;
    backupCodesRemaining: number;
    hasSecret: boolean;
  }>> {
    return await apiCall<{
      enabled: boolean;
      backupCodesRemaining: number;
      hasSecret: boolean;
    }>({
      method: 'GET',
      url: '/2fa/status'
    });
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(token: string): Promise<ApiResponse<{
    backupCodes: string[];
  }>> {
    return await apiCall<{
      backupCodes: string[];
    }>({
      method: 'POST',
      url: '/2fa/regenerate-backup-codes',
      data: { token }
    });
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