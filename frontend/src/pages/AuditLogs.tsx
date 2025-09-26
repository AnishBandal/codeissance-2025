import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRole } from '@/contexts/RoleContext';
import { mockAuditLogs, mockLeads } from '@/data/mockData';
import { 
  History, 
  Search, 
  Filter,
  Calendar,
  User,
  FileText,
  Clock,
  Activity,
  Download,
  Eye,
  Shield,
  TrendingUp
} from 'lucide-react';

interface ExtendedAuditLog {
  id: string;
  leadId: string;
  customerName: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogs: React.FC = () => {
  const { currentRole } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('last-7-days');

  // Extended mock audit logs with more realistic data
  const extendedAuditLogs: ExtendedAuditLog[] = [
    {
      id: "AL001",
      leadId: "LD001",
      customerName: "Rajesh Kumar",
      action: "Lead Created",
      user: "Amit Singh",
      timestamp: "2024-01-26T10:30:00Z",
      details: "Initial lead entry completed with all required documents",
      ipAddress: "192.168.1.101",
      userAgent: "Chrome/120.0"
    },
    {
      id: "AL002",
      leadId: "LD001", 
      customerName: "Rajesh Kumar",
      action: "Status Updated",
      user: "Priya Sharma",
      timestamp: "2024-01-26T14:20:00Z",
      details: "Status changed after document verification",
      oldValue: "New",
      newValue: "In Progress",
      ipAddress: "192.168.1.102",
      userAgent: "Firefox/121.0"
    },
    {
      id: "AL003",
      leadId: "LD001",
      customerName: "Rajesh Kumar", 
      action: "Assignment Changed",
      user: "Rajesh Gupta",
      timestamp: "2024-01-26T16:15:00Z",
      details: "Lead reassigned due to workload balancing",
      oldValue: "Amit Singh",
      newValue: "Priya Sharma",
      ipAddress: "192.168.1.103",
      userAgent: "Safari/17.2"
    },
    {
      id: "AL004",
      leadId: "LD002",
      customerName: "Sneha Patel",
      action: "Document Upload",
      user: "Amit Singh", 
      timestamp: "2024-01-26T11:45:00Z",
      details: "PAN Card and Income Certificate uploaded",
      ipAddress: "192.168.1.101",
      userAgent: "Chrome/120.0"
    },
    {
      id: "AL005",
      leadId: "LD003",
      customerName: "Mohammed Ali",
      action: "Priority Updated",
      user: "System",
      timestamp: "2024-01-26T13:30:00Z", 
      details: "AI priority score recalculated based on new data",
      oldValue: "65",
      newValue: "78",
      ipAddress: "System",
      userAgent: "Automated"
    },
    {
      id: "AL006",
      leadId: "LD002",
      customerName: "Sneha Patel",
      action: "Status Updated",
      user: "Priya Sharma",
      timestamp: "2024-01-26T15:20:00Z",
      details: "Lead approved after credit verification",
      oldValue: "Under Review", 
      newValue: "Approved",
      ipAddress: "192.168.1.102",
      userAgent: "Chrome/120.0"
    },
    {
      id: "AL007",
      leadId: "LD004",
      customerName: "Anita Desai",
      action: "Lead Viewed",
      user: "Rajesh Gupta",
      timestamp: "2024-01-26T09:15:00Z",
      details: "Lead details accessed for review",
      ipAddress: "192.168.1.103",
      userAgent: "Edge/120.0"
    },
    {
      id: "AL008",
      leadId: "LD005",
      customerName: "Suresh Reddy",
      action: "Status Updated",
      user: "Priya Sharma",
      timestamp: "2024-01-26T17:30:00Z",
      details: "Lead rejected due to insufficient credit score",
      oldValue: "Under Review",
      newValue: "Rejected", 
      ipAddress: "192.168.1.102",
      userAgent: "Firefox/121.0"
    }
  ];

  // Filter audit logs
  const filteredLogs = extendedAuditLogs.filter(log => {
    const matchesSearch = log.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    const matchesUser = userFilter === 'all' || log.user === userFilter;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Lead Created': return <FileText className="w-4 h-4 text-green-600" />;
      case 'Status Updated': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'Assignment Changed': return <User className="w-4 h-4 text-orange-600" />;
      case 'Document Upload': return <FileText className="w-4 h-4 text-purple-600" />;
      case 'Priority Updated': return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'Lead Viewed': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      'Lead Created': 'bg-green-100 text-green-800',
      'Status Updated': 'bg-blue-100 text-blue-800', 
      'Assignment Changed': 'bg-orange-100 text-orange-800',
      'Document Upload': 'bg-purple-100 text-purple-800',
      'Priority Updated': 'bg-yellow-100 text-yellow-800',
      'Lead Viewed': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {action}
      </Badge>
    );
  };

  const exportAuditLogs = () => {
    const csvData = filteredLogs.map(log => 
      `${log.timestamp},${log.leadId},${log.customerName},${log.action},${log.user},${log.details}`
    ).join('\n');
    
    const blob = new Blob([`Timestamp,Lead ID,Customer,Action,User,Details\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boi-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (currentRole !== 'authority') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="boi-card max-w-md">
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Audit logs are available only for Higher Authority users.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Complete system activity and security audit trail</p>
        </div>
        
        <Button onClick={exportAuditLogs} className="bg-orange-600 hover:bg-orange-700">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extendedAuditLogs.length}</div>
            <p className="text-xs text-blue-600">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-green-600">Unique users today</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Actions</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-red-600">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Actions</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-purple-600">Automated processes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="boi-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Lead Created</SelectItem>
                <SelectItem value="status">Status Updated</SelectItem>
                <SelectItem value="assignment">Assignment Changed</SelectItem>
                <SelectItem value="document">Document Upload</SelectItem>
                <SelectItem value="viewed">Lead Viewed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="Amit Singh">Amit Singh</SelectItem>
                <SelectItem value="Priya Sharma">Priya Sharma</SelectItem>
                <SelectItem value="Rajesh Gupta">Rajesh Gupta</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="boi-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <History className="w-5 h-5 mr-2 text-blue-600" />
              Audit Trail ({filteredLogs.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-orange-400">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getActionIcon(log.action)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActionBadge(log.action)}
                        <span className="text-sm font-medium text-gray-900">
                          Lead {log.leadId} - {log.customerName}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                      
                      {(log.oldValue && log.newValue) && (
                        <div className="text-xs bg-white p-2 rounded border">
                          <span className="text-gray-600">Changed from: </span>
                          <span className="text-red-600 font-medium">{log.oldValue}</span>
                          <span className="text-gray-600"> to: </span>
                          <span className="text-green-600 font-medium">{log.newValue}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{log.user}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </span>
                          {log.ipAddress && log.ipAddress !== 'System' && (
                            <span>IP: {log.ipAddress}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;