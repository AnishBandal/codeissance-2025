import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useRole } from '@/contexts/RoleContext';
import { mockLeads, mockAnalytics } from '@/data/mockData';
import { 
  Plus, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { currentRole, currentUser } = useRole();

  // Get recent leads based on role
  const getRecentLeads = () => {
    const leads = mockLeads.slice(0, 5);
    if (currentRole === 'processing') {
      return leads.filter(lead => lead.assignedTo === currentUser.name);
    }
    return leads;
  };

  const recentLeads = getRecentLeads();

  // Get priority actions based on role
  const getPriorityActions = () => {
    switch (currentRole) {
      case 'processing':
        return [
          { 
            title: 'High Priority Leads',
            count: 3,
            description: 'Leads requiring immediate attention',
            icon: AlertTriangle,
            color: 'text-red-600',
            action: 'Review Now'
          },
          {
            title: 'Pending Documents',
            count: 5,
            description: 'Leads waiting for document verification',
            icon: Clock,
            color: 'text-orange-600',
            action: 'Process Documents'
          }
        ];
        
      case 'nodal':
        return [
          {
            title: 'Unassigned Leads',
            count: 8,
            description: 'New leads awaiting assignment',
            icon: AlertTriangle,
            color: 'text-red-600',
            action: 'Assign Now'
          },
          {
            title: 'Team Performance',
            count: 92,
            description: 'Current team efficiency score',
            icon: TrendingUp,
            color: 'text-green-600',
            action: 'View Details'
          }
        ];
        
      case 'authority':
        return [
          {
            title: 'System Alerts',
            count: 2,
            description: 'Issues requiring executive attention',
            icon: AlertTriangle,
            color: 'text-red-600',
            action: 'Review Alerts'
          },
          {
            title: 'Monthly Target',
            count: 85,
            description: 'Progress towards monthly goals',
            icon: CheckCircle,
            color: 'text-green-600',
            action: 'View Analytics'
          }
        ];
        
      default:
        return [];
    }
  };

  const priorityActions = getPriorityActions();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg p-6 border border-orange-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {currentUser.name}
        </h1>
        <p className="text-gray-600">
          {currentUser.roleTitle} • {currentUser.region}
        </p>
        <div className="mt-4 flex space-x-4">
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/leads/new">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Link>
          </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Priority Actions */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {priorityActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-lg font-bold">
                    {action.count}
                  </Badge>
                  <Button size="sm" variant="outline">
                    {action.action}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

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
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    <p className="text-sm text-gray-600">{lead.productType} • {lead.loanAmount}</p>
                    <p className="text-xs text-gray-500">Last updated: {lead.lastUpdated}</p>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Analytics for Higher Authority */}
      {currentRole === 'authority' && (
        <Card className="boi-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {mockAnalytics.productDistribution.map((product) => (
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