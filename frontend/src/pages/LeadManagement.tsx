import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  UserCheck,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { leadService, type BackendLead } from '@/services/leadService';
import { useToast } from '@/hooks/use-toast';

const LeadManagement: React.FC = () => {
  const { currentRole } = useRole();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEditLeads = hasPermission('update_leads');
  
  // State management
  const [leads, setLeads] = useState<BackendLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof BackendLead>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Load leads from backend
  useEffect(() => {
    loadLeads();
  }, [currentPage, statusFilter, sortField, sortDirection]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await leadService.getLeads({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: sortField,
        sortOrder: sortDirection
      });

      if (response.success && response.data) {
        setLeads(response.data.leads);
        setTotalPages(response.data.pagination.totalPages);
        setTotalLeads(response.data.pagination.totalLeads);
      } else {
        toast({
          title: "Error loading leads",
          description: response.error || "Failed to load leads",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error loading leads",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter leads locally (for search)
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead._id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || 
                             (priorityFilter === 'high' && lead.priorityScore >= 80) ||
                             (priorityFilter === 'medium' && lead.priorityScore >= 60 && lead.priorityScore < 80) ||
                             (priorityFilter === 'low' && lead.priorityScore < 60);

      return matchesSearch && matchesPriority;
    });
  }, [leads, searchTerm, priorityFilter]);

  const handleSort = (field: keyof BackendLead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Document Collection': 'bg-yellow-100 text-yellow-800',
      'Initial Review': 'bg-blue-100 text-blue-800',
      'Credit Assessment': 'bg-purple-100 text-purple-800',
      'Final Review': 'bg-indigo-100 text-indigo-800',
      'Under Review': 'bg-purple-100 text-purple-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Completed': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priorityScore: number) => {
    if (priorityScore >= 80) {
      return <Badge variant="destructive" className="text-xs">High</Badge>;
    } else if (priorityScore >= 60) {
      return <Badge variant="default" className="text-xs">Medium</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  const getSortIcon = (field: keyof BackendLead) => {
    if (sortField !== field) return <Minus className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <TrendingUp className="w-4 h-4 text-blue-600" />
      : <TrendingDown className="w-4 h-4 text-blue-600" />;
  };

  const refreshLeads = () => {
    loadLeads();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600">Manage and track customer leads</p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={refreshLeads}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {(currentRole === 'processing' || currentRole === 'nodal') && (
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/leads/new">
                <Plus className="w-4 h-4 mr-2" />
                New Lead
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Document Collection">Document Collection</SelectItem>
                  <SelectItem value="Initial Review">Initial Review</SelectItem>
                  <SelectItem value="Credit Assessment">Credit Assessment</SelectItem>
                  <SelectItem value="Final Review">Final Review</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority (≥80)</SelectItem>
                  <SelectItem value="medium">Medium Priority (60-79)</SelectItem>
                  <SelectItem value="low">Low Priority (&lt;60)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Results</label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-gray-50">
                <span className="text-sm text-gray-600">
                  Showing {filteredLeads.length} of {totalLeads} leads
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-500">Loading leads...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('_id')}>
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      {getSortIcon('_id')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('customerName')}>
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      {getSortIcon('customerName')}
                    </div>
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('priorityScore')}>
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      {getSortIcon('priorityScore')}
                    </div>
                  </TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('updatedAt')}>
                    <div className="flex items-center space-x-1">
                      <span>Last Updated</span>
                      {getSortIcon('updatedAt')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead._id}>
                    <TableCell className="font-mono text-sm">
                      {lead._id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{lead.customerName}</p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{lead.productType}</p>
                        <p className="text-sm text-gray-500">{lead.loanAmount || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(lead.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(lead.priorityScore)}
                        <span className="text-sm text-gray-600">({lead.priorityScore})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeof lead.assignedTo === 'object' && lead.assignedTo ? (
                        <div className="flex items-center space-x-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{lead.assignedTo.username}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(lead.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/leads/${lead._id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        {canEditLeads && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/leads/${lead._id}`} state={{ startEditing: true }}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredLeads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No leads found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;