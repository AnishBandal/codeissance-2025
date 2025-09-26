import React from 'react';
import { Building2, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const Header: React.FC = () => {
  const { user, role, logout, forceLogout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleTitle = (role: string | null) => {
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
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'authority':
        return 'bg-purple-100 text-purple-800';
      case 'nodal':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="boi-header text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* LeadVault Logo & Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-300" />
              <div>
                <h1 className="text-xl font-bold">LeadVault</h1>
                <p className="text-sm text-blue-200">Lead Management System</p>
              </div>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* User Zone Info */}
            {user.zone && (
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                {user.zone} Zone
              </Badge>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-auto p-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-blue-200">{getRoleTitle(role)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white shadow-lg">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge className={getRoleBadgeColor(role)}>
                      {getRoleTitle(role)}
                    </Badge>
                    {user.zone && (
                      <span className="text-xs text-gray-500">{user.zone} Zone</span>
                    )}
                  </div>
                </div>
                
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600" 
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-800 focus:text-red-800 bg-red-50" 
                  onClick={forceLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Force Clear Login
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;