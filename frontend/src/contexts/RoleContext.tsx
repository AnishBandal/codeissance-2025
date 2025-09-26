// Compatibility hook for components that still use the old RoleContext
// This allows gradual migration to the new AuthContext

import { useAuth } from './AuthContext';

type Role = 'processing' | 'nodal' | 'authority';

export const useRole = () => {
  const { user, role } = useAuth();

  // Map new roles to old role format for compatibility
  const currentRole: Role = role || 'processing';
  
  // Create a user object in the old format
  const currentUser = {
    name: user?.username || 'Unknown User',
    roleTitle: (() => {
      switch (role) {
        case 'authority':
          return 'Higher Authority';
        case 'nodal':
          return 'Nodal Officer';
        case 'processing':
          return 'Processing Staff';
        default:
          return 'Unknown Role';
      }
    })(),
    region: user?.zone || 'Unknown Region'
  };

  // Mock setRole function for compatibility (no-op)
  const setRole = () => {
    console.warn('setRole is deprecated. User roles are now managed through authentication.');
  };

  return {
    currentRole,
    currentUser,
    setRole
  };
};