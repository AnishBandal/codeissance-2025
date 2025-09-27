import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  assignmentService,
  type AssignmentOfficer,
  type AssignmentStats,
  type UnassignedLeadResponse,
} from '@/services/assignmentService';
import type { BackendLead } from '@/services/leadService';
import {
  UserCheck,
  Search,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
  Shuffle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const LeadAssignment: React.FC = () => {
  const { currentRole } = useRole();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [productFilter, setProductFilter] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [unassignedData, setUnassignedData] = useState<UnassignedLeadResponse | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [assigning, setAssigning] = useState(false);

  const extractErrorMessage = (error: unknown) => {
    if (!error) return 'Something went wrong';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object') {
      const err = error as { error?: string; message?: string };
      return err.error || err.message || 'Something went wrong';
    }
    return 'Something went wrong';
  };

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await assignmentService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw response;
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      setStatsError(message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUnassignedLeads = useCallback(async () => {
    try {
      setLeadsLoading(true);
      setLeadsError(null);
      const response = await assignmentService.getUnassignedLeads({
        page,
        limit: pageSize,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        loanType: productFilter || undefined,
      });

      if (response.success && response.data) {
        setUnassignedData(response.data);
      } else {
        throw response;
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      setLeadsError(message);
    } finally {
      setLeadsLoading(false);
    }
  }, [page, pageSize, priorityFilter, productFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUnassignedLeads();
  }, [fetchUnassignedLeads]);

  useEffect(() => {
    if (!unassignedData?.leads?.length) {
      setSelectedLeads([]);
      return;
    }

    setSelectedLeads((prev) =>
      prev.filter((id) => unassignedData.leads.some((lead) => lead._id === id))
    );
  }, [unassignedData]);

  const leads = useMemo(() => unassignedData?.leads ?? [], [unassignedData]);
  const pagination = useMemo(() => unassignedData?.pagination, [unassignedData]);

  const availableOfficers = useMemo(() => stats?.officers ?? [], [stats]);

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const lower = searchTerm.toLowerCase();
    return leads.filter((lead) => {
      const customerName = lead.customerName || lead.name || '';
      return (
        customerName.toLowerCase().includes(lower) ||
        lead._id.toLowerCase().includes(lower) ||
        lead.email?.toLowerCase().includes(lower) ||
        lead.phone?.toLowerCase().includes(lower)
      );
    });
  }, [leads, searchTerm]);

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((lead) => {
      if (lead.productType) set.add(lead.productType);
    });
    return Array.from(set);
  }, [leads]);

  const avgWorkload = useMemo(() => {
    if (!stats?.officers?.length) return 0;
    const total = stats.officers.reduce((sum, officer) => sum + officer.totalLeads, 0);
    return total / stats.officers.length;
  }, [stats]);

  const avgProcessingDays = useMemo(() => {
    if (!stats?.officers?.length) return 0;
    const total = stats.officers.reduce((sum, officer) => sum + officer.avgProcessingDays, 0);
    return total / stats.officers.length;
  }, [stats]);

  const handleLeadSelection = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredLeads.map((lead) => lead._id);
    if (visibleIds.every((id) => selectedLeads.includes(id))) {
      setSelectedLeads((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedLeads((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const assignLeads = async (strategy: 'auto' | 'manual', officer?: AssignmentOfficer) => {
    if (selectedLeads.length === 0) {
      toast({
        title: 'No leads selected',
        description: 'Select at least one lead to assign.',
        variant: 'destructive',
      });
      return;
    }

    if (strategy === 'manual' && !officer) {
      toast({
        title: 'Officer required',
        description: 'Pick an officer to assign the selected leads.',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    let successCount = 0;
    const failed: string[] = [];

    try {
      for (const leadId of selectedLeads) {
        try {
          const response = await assignmentService.assignLead({
            leadId,
            strategy,
            officerId: strategy === 'manual' ? officer?.officerId : undefined,
          });

          if (!response.success) {
            throw response;
          }

          successCount += 1;
        } catch (error) {
          console.error('Failed to assign lead', error);
          failed.push(leadId);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Assignment complete',
          description: `${successCount} lead(s) assigned successfully${
            officer ? ` to ${officer.username}` : ''
          }.`,
        });
      }

      if (failed.length > 0) {
        toast({
          title: 'Some assignments failed',
          description: `${failed.length} lead(s) could not be assigned. Please try again.`,
          variant: 'destructive',
        });
      }

      setSelectedLeads(failed);

      try {
        await Promise.all([fetchStats(), fetchUnassignedLeads()]);
      } catch (error) {
        console.error('Failed to refresh assignment data', error);
        toast({
          title: 'Refresh failed',
          description: 'Assignments saved, but refreshing data failed. Please retry.',
          variant: 'destructive',
        });
      }
    } finally {
      setAssigning(false);
    }
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge variant="destructive" className="text-xs">
          High
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge variant="default" className="text-xs">
          Medium
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Low
      </Badge>
    );
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value));
    } catch (error) {
      console.warn('Failed to format date', error);
      return value;
    }
  };

  const getWorkloadTone = (workload: number) => {
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
          <p className="text-gray-600">Distribute leads across nodal officers and keep workloads balanced.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {selectedLeads.length} selected
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => assignLeads('auto')}
            disabled={assigning || selectedLeads.length === 0}
            className="flex items-center space-x-2"
          >
            {assigning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            <span>{assigning ? 'Assigning…' : 'Balance Assign'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              fetchStats();
              fetchUnassignedLeads();
            }}
            disabled={statsLoading || leadsLoading}
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading || leadsLoading ? 'animate-spin' : ''}`} />
          </Button>
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
            <div className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.unassignedLeads ?? '—'}
            </div>
            <p className="text-xs text-red-600">Awaiting assignment in your zone</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '—' : stats?.totalOfficers ?? '—'}
            </div>
            <p className="text-xs text-blue-600">In the {stats?.zone ?? 'assigned'} zone</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Workload</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '—' : avgWorkload ? avgWorkload.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-orange-600">Leads per officer</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '—' : avgProcessingDays ? `${avgProcessingDays.toFixed(1)}d` : 'N/A'}
            </div>
            <p className="text-xs text-green-600">Average closure time</p>
          </CardContent>
        </Card>
      </div>

      {(statsError || leadsError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">
            {statsError && <p>Dashboard: {statsError}</p>}
            {leadsError && <p>Leads: {leadsError}</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Officers */}
        <Card className="boi-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Officer Workloads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading officer data…
              </div>
            )}

            {!statsLoading && availableOfficers.length === 0 && (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                No active officers found in your zone.
              </div>
            )}

            {availableOfficers.map((officer) => (
              <div key={officer.officerId} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{officer.username}</p>
                    <p className="text-sm text-gray-600">{officer.email}</p>
                    <p className="text-xs text-gray-500">Zone: {officer.zone}</p>
                  </div>
                  <div className={`rounded-full px-2 py-1 text-xs font-medium ${getWorkloadTone(officer.totalLeads)}`}>
                    {officer.totalLeads} leads
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
                  <div className="rounded bg-white p-2">
                    <p className="font-semibold text-gray-900">{officer.activeLeads}</p>
                    <p>Active</p>
                  </div>
                  <div className="rounded bg-white p-2">
                    <p className="font-semibold text-gray-900">{officer.completedLeads}</p>
                    <p>Completed</p>
                  </div>
                  <div className="rounded bg-white p-2">
                    <p className="font-semibold text-gray-900">{officer.avgProcessingDays || 0}d</p>
                    <p>Avg days</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => assignLeads('manual', officer)}
                  disabled={assigning || selectedLeads.length === 0}
                  className="mt-3 w-full bg-orange-600 hover:bg-orange-700"
                >
                  {assigning ? 'Assigning…' : `Assign Selected (${selectedLeads.length})`}
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
                
                <Select
                  value={priorityFilter}
                  onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => {
                    setPage(1);
                    setPriorityFilter(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={productFilter || 'all'}
                  onValueChange={(value) => {
                    setPage(1);
                    setProductFilter(value === 'all' ? '' : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Product Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {productOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={selectAllVisible}
                  disabled={filteredLeads.length === 0}
                >
                  {filteredLeads.length > 0 &&
                  filteredLeads.every((lead) => selectedLeads.includes(lead._id))
                    ? 'Deselect Visible'
                    : 'Select Visible'}
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
                    {leadsLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Fetching unassigned leads…
                        </TableCell>
                      </TableRow>
                    )}

                    {!leadsLoading && filteredLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-sm text-gray-500">
                          No leads match the current filters.
                        </TableCell>
                      </TableRow>
                    )}

                    {!leadsLoading &&
                      filteredLeads.map((lead) => (
                        <TableRow key={lead._id} className="hover:bg-gray-50">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead._id)}
                              onChange={() => handleLeadSelection(lead._id)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{lead._id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{lead.customerName || lead.name}</p>
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
                            <Badge
                              variant="outline"
                              className={
                                lead.status === 'New'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-gray-50'
                              }
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(lead.createdAt)}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Page {pagination.currentPage} of {pagination.totalPages} ·{' '}
                    {pagination.totalLeads} lead(s)
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={leadsLoading || !pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => (pagination.hasNext ? prev + 1 : prev))}
                      disabled={leadsLoading || !pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadAssignment;