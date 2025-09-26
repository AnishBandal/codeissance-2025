import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '@/services/authService';

// Frontend role type
export type FrontendRole = 'processing' | 'nodal' | 'authority';

// Auth state interface
export interface AuthState {
  user: AuthUser | null;
  role: FrontendRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: AuthUser };

// Helper function to map backend role to frontend role
const mapRoleToFrontend = (backendRole: string): FrontendRole => {
  console.log('🔍 Mapping backend role:', backendRole); // Debug log
  switch (backendRole) {
    case 'Processing Staff':
      return 'processing';
    case 'Nodal Officer':
      return 'nodal';
    case 'Higher Authority':
      return 'authority';
    default:
      console.warn('⚠️ Unknown backend role:', backendRole, 'defaulting to processing');
      return 'processing';
  }
};

// Initial state
const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  token: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        role: mapRoleToFrontend(action.payload.user.role),
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        role: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        role: mapRoleToFrontend(action.payload.role),
      };
    default:
      return state;
  }
};

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    role: FrontendRole;
    zone: string;
    region?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (requiredRole: FrontendRole | FrontendRole[]) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing auth...');
      dispatch({ type: 'AUTH_START' });
      
      const token = localStorage.getItem('leadvault_token');
      console.log('🔑 Token found:', !!token);
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
        return;
      }

      // Check if we're offline
      if (!navigator.onLine) {
        console.log('📴 Device is offline, using cached auth data');
        // Try to load user data from localStorage
        const cachedUser = localStorage.getItem('leadvault_user');
        
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser) as AuthUser;
            console.log('✅ Using cached user data:', userData.username, 'Role:', userData.role);
            dispatch({ 
              type: 'AUTH_SUCCESS', 
              payload: { 
                user: userData, 
                token 
              } 
            });
            return; // Exit early - we're authenticated from cache
          } catch (err) {
            console.error('Failed to parse cached user data', err);
            // Continue to online flow as fallback
          }
        }
      }

      // Online flow - validate token and get user profile
      console.log('📡 Fetching user profile...');
      const response = await authService.getProfile();
      console.log('👤 Profile response:', response);
      
      if (response.success && response.data && response.data.user) {
        const userData = response.data.user;
        console.log('✅ User authenticated:', userData.username, 'Role:', userData.role);
        // Store the full user data in localStorage for offline use
        localStorage.setItem('leadvault_user', JSON.stringify(userData));
        
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: userData, 
            token 
          } 
        });
      } else {
        // Token is invalid
        console.log('❌ Invalid token, clearing storage');
        localStorage.removeItem('leadvault_token');
        localStorage.removeItem('leadvault_user');
        dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid token' });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('leadvault_token');
      localStorage.removeItem('leadvault_user');
      dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
    }
  };

  /**
   * Login user
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.login({ username, password });
      if (response.success && response.data) {
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: response.data.user, 
            token: response.data.token 
          } 
        });
      } else {
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: response.error || 'Login failed' 
        });
      }
    } catch (error: any) {
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: error.message || 'Login failed' 
      });
    }
  };

  /**
   * Map frontend role to backend role
   */
  const mapRoleToBackend = (frontendRole: FrontendRole): 'Processing Staff' | 'Nodal Officer' | 'Higher Authority' => {
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
  };

  /**
   * Register new user
   */
  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    role: FrontendRole;
    zone: string;
    region?: string;
  }): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const backendUserData = {
        username: userData.username,
        password: userData.password,
        role: mapRoleToBackend(userData.role),
        zone: userData.zone
      };
      
      const response = await authService.register(backendUserData);
      if (response.success && response.data) {
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: response.data.user, 
            token: response.data.token 
          } 
        });
      } else {
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: response.error || 'Registration failed' 
        });
      }
    } catch (error: any) {
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: error.message || 'Registration failed' 
      });
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  /**
   * Force logout - clears all auth data immediately without API call
   */
  const forceLogout = (): void => {
    // Clear all stored auth data
    localStorage.removeItem('leadvault_token');
    localStorage.removeItem('leadvault_user');
    localStorage.removeItem('boi-auth-token'); // Clear any old tokens
    localStorage.removeItem('boi-user'); // Clear any old user data
    
    // Reset auth state
    dispatch({ type: 'AUTH_LOGOUT' });
    
    // Force page reload to ensure clean state
    window.location.href = '/';
  };

  /**
   * Refresh user profile
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getProfile();
      if (response.success && response.data && response.data.user) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  /**
   * Clear authentication error
   */
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  /**
   * Check if user has specific permission based on role
   */
  const hasPermission = (permission: string): boolean => {
    if (!state.user || !state.role) return false;
    
    // Higher Authority has all permissions
    if (state.role === 'authority') return true;
    
    // Role-based permissions
    const rolePermissions: Record<FrontendRole, string[]> = {
      'authority': ['all'], // All permissions
      'nodal': ['view_leads', 'assign_leads', 'update_leads', 'view_reports', 'manage_staff'],
      'processing': ['view_leads', 'update_leads', 'create_leads']
    };
    
    const userPermissions = rolePermissions[state.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('all');
  };

  /**
   * Check if user can access route based on role
   */
  const canAccessRoute = (requiredRole: FrontendRole | FrontendRole[]): boolean => {
    if (!state.role) return false;
    
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return requiredRoles.includes(state.role);
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    forceLogout,
    refreshUser,
    clearError,
    hasPermission,
    canAccessRoute,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component for role-based access control
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: FrontendRole | FrontendRole[]
) => {
  return (props: P) => {
    const { isAuthenticated, canAccessRoute, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    if (requiredRole && !canAccessRoute(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * Route guard component
 */
interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: FrontendRole | FrontendRole[];
  fallback?: ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredRole,
  fallback = null,
}) => {
  const { isAuthenticated, canAccessRoute, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  if (requiredRole && !canAccessRoute(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Insufficient permissions.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthContext;