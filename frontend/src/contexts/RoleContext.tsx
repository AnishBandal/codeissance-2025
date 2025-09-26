import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, mockUsers } from '@/data/mockData';

type Role = 'processing' | 'nodal' | 'authority';

interface RoleContextType {
  currentRole: Role;
  currentUser: User;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>('processing');

  useEffect(() => {
    // Load saved role from localStorage
    const savedRole = localStorage.getItem('boi-current-role') as Role;
    if (savedRole && mockUsers[savedRole]) {
      setCurrentRole(savedRole);
    }
  }, []);

  const setRole = (role: Role) => {
    setCurrentRole(role);
    localStorage.setItem('boi-current-role', role);
  };

  const currentUser = mockUsers[currentRole];

  return (
    <RoleContext.Provider value={{ currentRole, currentUser, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};