import React from 'react';
import { FileText, Clock, CheckCircle, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { mockAnalytics } from '@/data/mockData';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => (
  <Card className="boi-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {trend && (
        <Badge variant="secondary" className="mt-1 text-xs">
          {trend}
        </Badge>
      )}
    </CardContent>
  </Card>
);

const DashboardStats: React.FC = () => {
  const { currentRole } = useRole();

  const getStatsForRole = () => {
    switch (currentRole) {
      case 'processing':
        return [
          {
            title: 'My Assigned Leads',
            value: 23,
            icon: FileText,
            trend: '+5 this week',
            color: 'text-blue-600'
          },
          {
            title: 'Pending Review',
            value: 8,
            icon: Clock,
            trend: 'Due today',
            color: 'text-orange-600'
          },
          {
            title: 'Completed Today',
            value: 4,
            icon: CheckCircle,
            trend: '+2 vs yesterday',
            color: 'text-green-600'
          },
          {
            title: 'Average Processing Time',
            value: '2.5 days',
            icon: TrendingUp,
            trend: 'Improved',
            color: 'text-purple-600'
          }
        ];

      case 'nodal':
        return [
          {
            title: 'Team Leads',
            value: mockAnalytics.activeLeads,
            icon: Users,
            trend: '+12 this month',
            color: 'text-blue-600'
          },
          {
            title: 'Pending Assignment',
            value: 15,
            icon: AlertCircle,
            trend: 'Needs attention',
            color: 'text-red-600'
          },
          {
            title: 'Monthly Conversions',
            value: '32%',
            icon: TrendingUp,
            trend: '+4% vs last month',
            color: 'text-green-600'
          },
          {
            title: 'Team Performance',
            value: 'Excellent',
            icon: CheckCircle,
            trend: '95% target achieved',
            color: 'text-green-600'
          }
        ];

      case 'authority':
        return [
          {
            title: 'Total Leads',
            value: mockAnalytics.totalLeads,
            icon: FileText,
            trend: '+18% this quarter',
            color: 'text-blue-600'
          },
          {
            title: 'Conversion Rate',
            value: `${mockAnalytics.conversionRate}%`,
            icon: TrendingUp,
            trend: '+2.4% vs last quarter',
            color: 'text-green-600'
          },
          {
            title: 'Active Processing',
            value: mockAnalytics.activeLeads,
            icon: Clock,
            trend: 'In pipeline',
            color: 'text-orange-600'
          },
          {
            title: 'Avg Processing Time',
            value: `${mockAnalytics.avgProcessingTime} days`,
            icon: CheckCircle,
            trend: '-1.2 days improved',
            color: 'text-purple-600'
          }
        ];

      default:
        return [];
    }
  };

  const stats = getStatsForRole();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default DashboardStats;