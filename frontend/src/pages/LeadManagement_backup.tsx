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
  Loader2                  <TableHead className="cursor-pointer" onClick={() => handleSort('_id')}>
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      {getSortIcon('_id')} RefreshCw
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
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      
      const matchesPriority = priorityFilter === 'all' || 
                             (priorityFilter === 'high' && lead.priorityScore >= 80) ||
                             (priorityFilter === 'medium' && lead.priorityScore >= 60 && lead.priorityScore < 80) ||
                             (priorityFilter === 'low' && lead.priorityScore < 60);

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
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge variant="destructive" className="text-xs">High</Badge>;
    } else if (score >= 60) {
      return <Badge variant="default" className="text-xs">Medium</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-purple-100 text-purple-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Completed': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${statusColors[status] || ''}`}>
        {status}
      </Badge>
    );
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
        
        {(currentRole === 'processing' || currentRole === 'nodal') && (
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/leads/new">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Link>
          </Button>
        )}
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
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority (80+)</SelectItem>
                <SelectItem value="medium">Medium Priority (60-79)</SelectItem>
                <SelectItem value="low">Low Priority (&lt;60)</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              <span>Showing {filteredLeads.length} of {totalLeads} leads</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="boi-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center space-x-1">
                      <span>Lead ID</span>
                      {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('customerName')}>
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      {getSortIcon('customerName')}
                    </div>
                  </TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Loan Amount</TableHead>
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort('lastUpdated')}>
                    <div className="flex items-center space-x-1">
                      <span>Last Updated</span>
                      {getSortIcon('lastUpdated')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{lead.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.customerName}</p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{lead.productType}</TableCell>
                    <TableCell className="font-medium text-green-600">{lead.loanAmount}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(lead.priorityScore)}
                        <span className="text-sm text-gray-500">({lead.priorityScore})</span>
                      </div>
                    </TableCell>
                    <TableCell>{lead.assignedTo}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{lead.lastUpdated}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/leads/${lead.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        {(currentRole === 'processing' || currentRole === 'nodal') && (
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {(currentRole === 'nodal' || currentRole === 'authority') && (
                          <Button size="sm" variant="outline">
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedLeads.length === 0 && (
        <Card className="boi-card">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadManagement;