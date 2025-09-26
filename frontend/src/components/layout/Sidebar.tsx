import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  UserCheck,
  BarChart3,
  History,
  Download,
  Users,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['processing', 'nodal', 'authority'],
  },
  {
    path: '/leads',
    label: 'Lead Management',
    icon: FileText,
    roles: ['processing', 'nodal', 'authority'],
  },
  {
    path: '/leads/new',
    label: 'New Lead',
    icon: PlusCircle,
    roles: ['processing', 'nodal'],
    badge: 'Quick Add',
  },
  {
    path: '/assignments',
    label: 'Lead Assignment',
    icon: UserCheck,
    roles: ['nodal', 'authority'],
  },
  {
    path: '/analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    roles: ['authority'],
  },
  {
    path: '/audit',
    label: 'Audit Logs',
    icon: History,
    roles: ['authority'],
  },
  {
    path: '/export',
    label: 'Export Data',
    icon: Download,
    roles: ['nodal', 'authority'],
  },
];

const Sidebar: React.FC = () => {
  const { currentRole } = useRole();

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(currentRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm min-h-screen">
      <nav className="p-4 space-y-2">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors group',
                isActive && 'bg-orange-100 text-orange-800 font-medium shadow-sm'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Role-specific highlights */}
        {currentRole === 'processing' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Processing Centre</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Focus on lead entry and initial processing
            </p>
          </div>
        )}

        {currentRole === 'nodal' && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <UserCheck className="h-4 w-4" />
              <span className="text-sm font-medium">Zonal Operations</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Manage assignments and regional oversight
            </p>
          </div>
        )}

        {currentRole === 'authority' && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-2 text-purple-700">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Executive Dashboard</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Full system oversight and analytics
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;