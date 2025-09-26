import { apiCall, ApiResponse } from './api';

// User types matching backend schema
export interface BackendUser {
  _id: string;
  username: string;
  email: string;
  role: 'Processing Staff' | 'Nodal Officer' | 'Higher Authority';
  permissions: string[];
  zone: string;
  region: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'Processing Staff' | 'Nodal Officer' | 'Higher Authority';
  zone: string;
  region?: string;
  permissions?: string[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'Processing Staff' | 'Nodal Officer' | 'Higher Authority';
  zone?: string;
  region?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  zone?: string;
  region?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsersResponse {
  users: BackendUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UserStats {
  totalUsers: number;
  roleBreakdown: Record<string, number>;
  zoneBreakdown: Record<string, number>;
  activeUsers: number;
  inactiveUsers: number;
  recentLogins: number;
}

class UserService {
  /**
   * Get all users with filtering and pagination
   */
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<UsersResponse>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return await apiCall<UsersResponse>({
      method: 'GET',
      url: `/users?${params.toString()}`
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<{ user: BackendUser }>> {
    return await apiCall<{ user: BackendUser }>({
      method: 'GET',
      url: `/users/${id}`
    });
  }

  /**
   * Create new user (admin only)
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<{ user: BackendUser }>> {
    return await apiCall<{ user: BackendUser }>({
      method: 'POST',
      url: '/users',
      data: userData
    });
  }

  /**
   * Create Nodal Officer (Higher Authority only)
   */
  async createNodalOfficer(userData: CreateUserRequest): Promise<ApiResponse<{ user: BackendUser }>> {
    console.log('🔍 Creating Nodal Officer with data:', userData);
    try {
      const response = await apiCall<{ user: BackendUser }>({
        method: 'POST',
        url: '/users/create-nodal-officer',
        data: userData
      });
      console.log('✅ Nodal Officer creation response:', response);
      return response;
    } catch (error) {
      console.error('❌ Nodal Officer creation error:', error);
      throw error;
    }
  }

  /**
   * Create Processing Staff (Nodal Officer only)
   */
  async createProcessingStaff(userData: CreateUserRequest): Promise<ApiResponse<{ user: BackendUser }>> {
    return await apiCall<{ user: BackendUser }>({
      method: 'POST',
      url: '/users/create-processing-staff',
      data: userData
    });
  }

  /**
   * Update existing user
   */
  async updateUser(id: string, updates: UpdateUserRequest): Promise<ApiResponse<{ user: BackendUser }>> {
    return await apiCall<{ user: BackendUser }>({
      method: 'PUT',
      url: `/users/${id}`,
      data: updates
    });
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/users/${id}`
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return await apiCall<UserStats>({
      method: 'GET',
      url: '/users/stats'
    });
  }

  /**
   * Update user password
   */
  async updatePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return await apiCall<{ message: string }>({
      method: 'PUT',
      url: '/users/password',
      data: { oldPassword, newPassword }
    });
  }

  /**
   * Reset user password (admin only)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return await apiCall<{ message: string }>({
      method: 'PUT',
      url: `/users/${userId}/reset-password`,
      data: { newPassword }
    });
  }

  /**
   * Get users for assignment dropdown
   */
  async getUsersForAssignment(role?: string, zone?: string): Promise<ApiResponse<BackendUser[]>> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (zone) params.append('zone', zone);
    params.append('isActive', 'true');

    return await apiCall<BackendUser[]>({
      method: 'GET',
      url: `/users/assignment?${params.toString()}`
    });
  }

  /**
   * Map backend role to frontend role
   */
  mapRoleToFrontend(backendRole: string): 'processing' | 'nodal' | 'authority' {
    switch (backendRole) {
      case 'Processing Staff':
        return 'processing';
      case 'Nodal Officer':
        return 'nodal';
      case 'Higher Authority':
        return 'authority';
      default:
        return 'processing';
    }
  }

  /**
   * Map frontend role to backend role
   */
  mapRoleToBackend(frontendRole: 'processing' | 'nodal' | 'authority'): 'Processing Staff' | 'Nodal Officer' | 'Higher Authority' {
    switch (frontendRole) {
      case 'processing':
        return 'Processing Staff';
      case 'nodal':
        return 'Nodal Officer';
      case 'authority':
        return 'Higher Authority';
      default:
        return 'Processing Staff';
    }
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: BackendUser, permission: string): boolean {
    return user.permissions.includes(permission) || user.role === 'Higher Authority';
  }

  /**
   * Get user display name
   */
  getDisplayName(user: BackendUser): string {
    return user.username || user.email;
  }

  /**
   * Format user role for display
   */
  formatRole(role: string): string {
    switch (role) {
      case 'Processing Staff':
        return 'Processing Staff';
      case 'Nodal Officer':
        return 'Nodal Officer';
      case 'Higher Authority':
        return 'Higher Authority';
      default:
        return role;
    }
  }

  /**
   * Get role color for UI
   */
  getRoleColor(role: string): string {
    switch (role) {
      case 'Processing Staff':
        return 'bg-blue-100 text-blue-800';
      case 'Nodal Officer':
        return 'bg-green-100 text-green-800';
      case 'Higher Authority':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Check if user can manage other user
   */
  canManageUser(currentUser: BackendUser, targetUser: BackendUser): boolean {
    if (currentUser.role === 'Higher Authority') return true;
    if (currentUser.role === 'Nodal Officer' && targetUser.role === 'Processing Staff') return true;
    return currentUser._id === targetUser._id;
  }

  /**
   * Get available zones
   */
  getAvailableZones(): string[] {
    return ['North', 'South', 'East', 'West', 'Central'];
  }

  /**
   * Get available regions for zone
   */
  getAvailableRegions(zone: string): string[] {
    const regionMap: Record<string, string[]> = {
      'North': ['Delhi NCR', 'Punjab', 'Haryana', 'Chandigarh', 'Himachal Pradesh'],
      'South': ['Chennai', 'Bangalore', 'Hyderabad', 'Kochi', 'Coimbatore'],
      'East': ['Kolkata', 'Bhubaneswar', 'Guwahati', 'Patna', 'Ranchi'],
      'West': ['Mumbai', 'Pune', 'Ahmedabad', 'Surat', 'Nagpur'],
      'Central': ['Bhopal', 'Indore', 'Raipur', 'Lucknow', 'Kanpur']
    };
    return regionMap[zone] || [];
  }
}

export const userService = new UserService();
export default userService;