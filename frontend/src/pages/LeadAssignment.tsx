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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/contexts/RoleContext';
import { mockLeads, mockUsers, Lead } from '@/data/mockData';
import { 
  UserCheck, 
  Search, 
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar
} from 'lucide-react';

const LeadAssignment: React.FC = () => {
  const { currentRole, currentUser } = useRole();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('unassigned');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Mock available officers for assignment
  const availableOfficers = [
    { id: 'PS001', name: 'Amit Singh', role: 'Processing Staff', workload: 12, region: 'Mumbai West' },
    { id: 'PS002', name: 'Priya Sharma', role: 'Processing Staff', workload: 8, region: 'Mumbai East' },
    { id: 'PS003', name: 'Rajesh Kumar', role: 'Processing Staff', workload: 15, region: 'Delhi NCR' },
    { id: 'PS004', name: 'Sneha Patel', role: 'Processing Staff', workload: 6, region: 'Ahmedabad' },
    { id: 'NO001', name: 'Mohammed Ali', role: 'Senior Officer', workload: 5, region: 'Mumbai Zone' },
  ];

  // Filter leads for assignment
  const getFilteredLeads = () => {
    let filtered = mockLeads.filter(lead => {
      const matchesSearch = lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'unassigned' && (lead.status === 'New' || !lead.assignedTo)) ||
                           (statusFilter === 'assigned' && lead.assignedTo && lead.status !== 'New') ||
                           (statusFilter === 'high-priority' && lead.priorityScore >= 80);

      return matchesSearch && matchesStatus;
    });

    return filtered.slice(0, 20); // Limit for demo
  };

  const filteredLeads = getFilteredLeads();

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkAssignment = (officerId: string, officerName: string) => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to assign",
        variant: "destructive",
      });
      return;
    }

    // Mock assignment logic
    toast({
      title: "Assignment Successful",
      description: `${selectedLeads.length} lead(s) assigned to ${officerName}`,
    });

    setSelectedLeads([]);
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

  const getWorkloadColor = (workload: number) => {
    if (workload >= 15) return 'text-red-600 bg-red-50';
    if (workload >= 10) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  if (currentRole === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="boi-card max-w-md">
          <CardContent className="text-center py-12">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Lead assignment is available only for Nodal Officers and Higher Authority.
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
          <h1 className="text-2xl font-bold text-gray-900">Lead Assignment</h1>
          <p className="text-gray-600">Assign leads to processing officers and manage workloads</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {selectedLeads.length} selected
          </Badge>
        </div>
      </div>

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Leads</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-red-600">Needs immediate attention</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableOfficers.length}</div>
            <p className="text-xs text-blue-600">Available for assignment</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Workload</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9.2</div>
            <p className="text-xs text-orange-600">Leads per officer</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-green-600">Completed today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Officers */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Available Officers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableOfficers.map((officer) => (
              <div key={officer.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{officer.name}</p>
                    <p className="text-sm text-gray-600">{officer.role}</p>
                    <p className="text-xs text-gray-500">{officer.region}</p>
                  </div>
                  <Badge className={`text-xs ${getWorkloadColor(officer.workload)}`}>
                    {officer.workload} leads
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleBulkAssignment(officer.id, officer.name)}
                  disabled={selectedLeads.length === 0}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Assign Selected ({selectedLeads.length})
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leads for Assignment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
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
                    <SelectItem value="all">All Leads</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="assigned">Already Assigned</SelectItem>
                    <SelectItem value="high-priority">High Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    const allLeadIds = filteredLeads.map(lead => lead.id);
                    setSelectedLeads(selectedLeads.length === allLeadIds.length ? [] : allLeadIds);
                  }}
                >
                  {selectedLeads.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Leads Table */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle>Leads for Assignment ({filteredLeads.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Lead ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-gray-50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleLeadSelection(lead.id)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{lead.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.customerName}</p>
                            <p className="text-sm text-gray-500">{lead.region}</p>
                          </div>
                        </TableCell>
                        <TableCell>{lead.productType}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getPriorityBadge(lead.priorityScore)}
                            <span className="text-sm text-gray-500">({lead.priorityScore})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            lead.status === 'New' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'
                          }>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{lead.createdDate}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadAssignment;