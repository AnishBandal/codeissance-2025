import React from 'react';
import { Building2, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRole } from '@/contexts/RoleContext';
import { mockUsers } from '@/data/mockData';

const Header: React.FC = () => {
  const { currentRole, currentUser, setRole } = useRole();

  return (
    <header className="boi-header text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Bank of India Logo & Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-300" />
              <div>
                <h1 className="text-xl font-bold">Bank of India</h1>
                <p className="text-sm text-blue-200">Lead Management System</p>
              </div>
            </div>
          </div>

          {/* Role Switcher & User Info */}
          <div className="flex items-center space-x-4">
            {/* Role Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Switch Role
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg">
                {Object.entries(mockUsers).map(([key, user]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setRole(key as any)}
                    className={`cursor-pointer ${currentRole === key ? 'bg-orange-50 text-orange-700' : ''}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{user.roleTitle}</span>
                      <span className="text-sm text-gray-500">{user.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Current User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-blue-200">{currentUser.roleTitle}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;