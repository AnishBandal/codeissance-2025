import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { auditService, type AuditLog } from '@/services/auditService';
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
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';

const AuditLogs: React.FC = () => {
  const { currentRole } = useRole();
  const { toast } = useToast();
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('last-7-days');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load audit logs from backend
  const loadAuditLogs = async (page: number = 1, filters: any = {}) => {
    try {
      setLoading(true);
      const response = await auditService.getAuditLogs({
        page,
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'desc',
        ...filters
      });

      setAuditLogs(response.data.auditLogs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: "Error Loading Audit Logs",
        description: "Failed to load audit logs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Handle search and filtering
  const handleSearch = () => {
    const filters: any = {};
    if (actionFilter !== 'all') filters.action = actionFilter;
    if (userFilter !== 'all') filters.user = userFilter;
    
    loadAuditLogs(1, filters);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setUserFilter('all');
    setDateRange('last-7-days');
    loadAuditLogs();
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadAuditLogs(newPage);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadAuditLogs(newPage);
    }
  };

  // Filter displayed logs by search term (client-side for better UX)
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      (log.customerName && log.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.leadId && log.leadId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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
      `${log.timestamp},${log.leadId || 'N/A'},${log.customerName || 'N/A'},${log.action},${log.user.username},${log.details.replace(/,/g, ';')}`
    ).join('\n');
    
    const blob = new Blob([`Timestamp,Lead ID,Customer,Action,User,Details\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Loading audit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-orange-600" />
            Audit Logs
          </h1>
          <p className="text-gray-600">Track all system activities and user actions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => loadAuditLogs(currentPage)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAuditLogs} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="boi-card">
          <CardContent className="p-4">
            <div className="flex items-center">
              <History className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Today's Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredLogs.filter(log => {
                    const logDate = new Date(log.timestamp);
                    const today = new Date();
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(auditLogs.map(log => log.user.username)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Current Page</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.currentPage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="boi-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Lead Created">Lead Created</SelectItem>
                  <SelectItem value="Status Updated">Status Updated</SelectItem>
                  <SelectItem value="Assignment Changed">Assignment Changed</SelectItem>
                  <SelectItem value="Document Upload">Document Upload</SelectItem>
                  <SelectItem value="Priority Updated">Priority Updated</SelectItem>
                  <SelectItem value="Lead Viewed">Lead Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {Array.from(new Set(auditLogs.map(log => log.user.username))).map(username => (
                    <SelectItem key={username} value={username}>{username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button onClick={resetFilters} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="boi-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <History className="w-5 h-5 mr-2 text-green-600" />
              Audit Trail ({filteredLogs.length} entries)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          {getActionBadge(log.action)}
                          <span className="text-sm text-gray-600">
                            by <span className="font-medium">{log.user.username}</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            ({log.user.role})
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-900 mb-1">
                          {log.customerName && (
                            <span className="font-medium">{log.customerName}</span>
                          )}
                          {log.leadId && log.customerName && <span> • </span>}
                          {log.leadId && (
                            <span className="text-blue-600">Lead #{log.leadId}</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700">{log.details}</p>
                        
                        {(log.oldValue || log.newValue) && (
                          <div className="mt-2 text-xs text-gray-600">
                            {log.oldValue && (
                              <span>From: <span className="font-mono bg-gray-100 px-1 rounded">{log.oldValue}</span></span>
                            )}
                            {log.oldValue && log.newValue && <span> → </span>}
                            {log.newValue && (
                              <span>To: <span className="font-mono bg-gray-100 px-1 rounded">{log.newValue}</span></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                      {log.ipAddress && (
                        <div className="text-xs text-gray-400">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                Showing page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalLogs} total entries)
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrev}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button 
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;