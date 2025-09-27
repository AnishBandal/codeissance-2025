import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Clock, CheckCircle, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { leadService, type LeadStats } from '@/services/leadService';

const formatNumber = (value: number | undefined | null, options: Intl.NumberFormatOptions = {}) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '--';
  }
  return new Intl.NumberFormat('en-IN', options).format(value);
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color, loading }) => (
  <Card className="boi-card">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">
        {loading ? (
          <div className="h-6 w-16 rounded bg-gray-200 animate-pulse" />
        ) : value}
      </div>
      {trend && !loading && (
        <Badge variant="secondary" className="mt-1 text-xs">
          {trend}
        </Badge>
      )}
    </CardContent>
  </Card>
);

const DashboardStats: React.FC = () => {
  const { currentRole } = useRole();
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await leadService.getLeadStats();

        if (response.success && response.data && isMounted) {
          setStats(response.data);
        } else if (isMounted) {
          setError(response.error || 'Unable to fetch dashboard statistics');
          setStats(null);
        }
      } catch (err) {
        if (isMounted) {
          const apiError = err as { message?: string; error?: string };
          const message = apiError?.message || apiError?.error || 'Unable to fetch dashboard statistics';
          setError(message);
          setStats(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [currentRole]);

  const cards = useMemo<StatCardProps[]>(() => {
    const status = stats?.statusBreakdown || {};
    const conversionRate = stats ? `${formatNumber(stats.conversionRate, { maximumFractionDigits: 1 })}%` : '--';
    const avgProcessing = stats ? `${formatNumber(stats.avgProcessingTime, { maximumFractionDigits: 1 })} days` : '--';
    const avgPriority = stats ? formatNumber(stats.avgPriorityScore) : '--';

    switch (currentRole) {
      case 'processing':
        return [
          {
            title: 'My Active Leads',
            value: stats ? formatNumber(stats.activeLeads) : '--',
            icon: FileText,
            trend: stats ? `${(status['Document Collection'] || 0) + (status['Initial Review'] || 0) + (status['Credit Assessment'] || 0) + (status['Final Review'] || 0)} in progress` : undefined,
            color: 'text-blue-600',
            loading,
          },
          {
            title: 'Awaiting Review',
            value: stats ? formatNumber((status['Initial Review'] || 0) + (status['Credit Assessment'] || 0) + (status['Final Review'] || 0)) : '--',
            icon: AlertCircle,
            trend: stats ? `${status['New'] || 0} new leads` : undefined,
            color: 'text-orange-600',
            loading,
          },
          {
            title: 'Completed Leads',
            value: stats ? formatNumber(stats.completedLeads) : '--',
            icon: CheckCircle,
            trend: stats ? `${status['Approved'] || 0} approved` : undefined,
            color: 'text-green-600',
            loading,
          },
          {
            title: 'Avg Processing Time',
            value: avgProcessing,
            icon: Clock,
            color: 'text-purple-600',
            loading,
          },
        ];

      case 'nodal':
        return [
          {
            title: 'Zone Leads',
            value: stats ? formatNumber(stats.totalLeads) : '--',
            icon: Users,
            trend: stats ? `${status['New'] || 0} new this month` : undefined,
            color: 'text-blue-600',
            loading,
          },
          {
            title: 'In Progress',
            value: stats ? formatNumber((status['Document Collection'] || 0) + (status['Initial Review'] || 0) + (status['Credit Assessment'] || 0) + (status['Final Review'] || 0)) : '--',
            icon: Clock,
            trend: stats ? `${(status['Initial Review'] || 0) + (status['Credit Assessment'] || 0) + (status['Final Review'] || 0)} in review` : undefined,
            color: 'text-orange-600',
            loading,
          },
          {
            title: 'Completed Leads',
            value: stats ? formatNumber(stats.completedLeads) : '--',
            icon: CheckCircle,
            trend: stats ? `${status['Approved'] || 0} approved` : undefined,
            color: 'text-green-600',
            loading,
          },
          {
            title: 'Conversion Rate',
            value: conversionRate,
            icon: TrendingUp,
            color: 'text-green-600',
            loading,
          },
        ];

      case 'authority':
      default:
        return [
          {
            title: 'Total Leads',
            value: stats ? formatNumber(stats.totalLeads) : '--',
            icon: FileText,
            trend: stats ? `${status['New'] || 0} new this month` : undefined,
            color: 'text-blue-600',
            loading,
          },
          {
            title: 'Active Pipeline',
            value: stats ? formatNumber(stats.activeLeads) : '--',
            icon: TrendingUp,
            trend: stats ? `${(status['Document Collection'] || 0) + (status['Initial Review'] || 0) + (status['Credit Assessment'] || 0) + (status['Final Review'] || 0)} in progress` : undefined,
            color: 'text-indigo-600',
            loading,
          },
          {
            title: 'Completed Leads',
            value: stats ? formatNumber(stats.completedLeads) : '--',
            icon: CheckCircle,
            trend: stats ? `${status['Approved'] || 0} approved` : undefined,
            color: 'text-green-600',
            loading,
          },
          {
            title: 'Avg Priority Score',
            value: avgPriority,
            icon: Users,
            trend: stats ? `Conversion ${conversionRate}` : undefined,
            color: 'text-purple-600',
            loading,
          },
        ];
    }
  }, [currentRole, stats, loading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
      {error && (
        <Card className="boi-card md:col-span-2 lg:col-span-4 border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Dashboard data unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;