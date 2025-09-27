import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/services/leadService';
import type { BackendLead, LeadStats } from '@/services/leadService';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const [recentLeads, setRecentLeads] = useState<BackendLead[]>([]);
  const [analytics, setAnalytics] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Load recent leads and analytics on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load recent leads
        const leadsResponse = await leadService.getLeads({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' });
        if (leadsResponse.success && leadsResponse.data) {
          setRecentLeads(leadsResponse.data.leads);
        }

        // Load analytics data for Higher Authority
        if (role === 'authority') {
          const analyticsResponse = await leadService.getLeadStats();
          if (analyticsResponse.success && analyticsResponse.data) {
            setAnalytics(analyticsResponse.data);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [role]);

  // Get role title for display
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



  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg p-6 border border-orange-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username || 'User'}
        </h1>
        <p className="text-gray-600">
          {getRoleTitle(role)} • {user?.zone || 'Unknown Zone'}
        </p>
        <div className="mt-4 flex space-x-4">
          {/* Only Processing Staff and Nodal Officers can create new leads */}
          {(role === 'processing' || role === 'nodal') && (
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                New Lead
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/leads">
              View All Leads
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <DashboardStats />

      {/* Recent Leads */}
      <Card className="boi-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Recent Leads
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/leads">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading leads...</span>
                </div>
              ) : recentLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent leads found</p>
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">{lead.customerName}</p>
                        <Badge 
                          variant={
                            lead.priorityScore >= 80 ? 'destructive' : 
                            lead.priorityScore >= 60 ? 'default' : 
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {lead.priorityScore >= 80 ? 'High' : 
                           lead.priorityScore >= 60 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{lead.productType} • {lead.loanAmount || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        Last updated: {new Date(lead.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {lead.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      {/* Quick Analytics for Higher Authority */}
      {role === 'authority' && analytics && (
        <Card className="boi-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.productDistribution.map((product) => (
                <div key={product.product} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{product.count}</p>
                  <p className="text-sm text-gray-600">{product.product}</p>
                  <p className="text-xs text-gray-500">{product.percentage}% of total</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;