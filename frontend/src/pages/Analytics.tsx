import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Users,
  DollarSign,
  Target,
  Award
} from 'lucide-react';
import { mockAnalytics } from '@/data/mockData';
import { useRole } from '@/contexts/RoleContext';

const Analytics: React.FC = () => {
  const { currentRole } = useRole();

  // Color scheme for charts
  const COLORS = ['#FF6B35', '#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const exportData = () => {
    // Mock export functionality
    const csvData = mockAnalytics.monthlyTrends.map(item => 
      `${item.month},${item.leads},${item.converted}`
    ).join('\n');
    
    const blob = new Blob([`Month,Leads,Converted\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boi-analytics-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (currentRole !== 'authority') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="boi-card max-w-md">
          <CardContent className="text-center py-12">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Analytics dashboard is available only for Higher Authority users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Last 30 Days</span>
          </Button>
          <Button onClick={exportData} className="bg-orange-600 hover:bg-orange-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.totalLeads}</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.conversionRate}%</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+2.4% improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.activeLeads}</div>
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <TrendingDown className="w-3 h-3" />
              <span>-3 from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.avgProcessingTime} days</div>
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>1.2 days faster</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle>Monthly Lead Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockAnalytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#FF6B35" 
                  strokeWidth={2} 
                  name="Total Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="converted" 
                  stroke="#1E3A8A" 
                  strokeWidth={2} 
                  name="Converted"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle>Product Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockAnalytics.productDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ product, percentage }) => `${product}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {mockAnalytics.productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Performance */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle>Regional Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAnalytics.regionPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#FF6B35" name="Total Leads" />
                <Bar dataKey="conversion" fill="#1E3A8A" name="Conversion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Top Performing Region</p>
                  <p className="text-sm text-green-600">Bangalore - 35% conversion</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-800">Most Popular Product</p>
                  <p className="text-sm text-blue-600">Home Loan - 45 applications</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Popular</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-800">Processing Efficiency</p>
                  <p className="text-sm text-orange-600">12.5 days average time</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Improved</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-800">Quality Score</p>
                  <p className="text-sm text-purple-600">92% customer satisfaction</p>
                </div>
                <Badge className="bg-purple-100 text-purple-800">High</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="boi-card">
        <CardHeader>
          <CardTitle>Detailed Regional Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Region</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Total Leads</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Conversion Rate</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Avg Processing Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockAnalytics.regionPerformance.map((region) => (
                  <tr key={region.region} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{region.region}</td>
                    <td className="px-4 py-3">{region.leads}</td>
                    <td className="px-4 py-3">{region.conversion}%</td>
                    <td className="px-4 py-3">{(Math.random() * 5 + 10).toFixed(1)} days</td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={region.conversion >= 30 ? 'default' : 'secondary'}
                        className={region.conversion >= 30 ? 'bg-green-100 text-green-800' : ''}
                      >
                        {region.conversion >= 30 ? 'Excellent' : 'Good'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;