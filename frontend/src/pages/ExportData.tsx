import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/contexts/RoleContext';
import { mockLeads, mockAnalytics } from '@/data/mockData';
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon,
  Filter,
  Database,
  BarChart,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ExportData: React.FC = () => {
  const { currentRole } = useRole();
  const { toast } = useToast();
  
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['leads']);
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(2024, 0, 1),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const dataTypes = [
    {
      id: 'leads',
      label: 'Lead Data',
      description: 'Customer leads with all details',
      icon: FileText,
      count: mockLeads.length,
      roles: ['nodal', 'authority']
    },
    {
      id: 'analytics',
      label: 'Analytics Data', 
      description: 'Performance metrics and trends',
      icon: BarChart,
      count: 4,
      roles: ['authority']
    },
    {
      id: 'users',
      label: 'User Activity',
      description: 'User actions and assignments',
      icon: Users,
      count: 156,
      roles: ['authority']
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      description: 'Complete system audit trail',
      icon: Database,
      count: 248,
      roles: ['authority']
    }
  ];

  const exportFormats = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'pdf', label: 'PDF', description: 'Portable document format' },
    { value: 'json', label: 'JSON', description: 'JavaScript object notation' }
  ];

  // Filter data types based on user role
  const availableDataTypes = dataTypes.filter(type => 
    type.roles.includes(currentRole)
  );

  const handleDataTypeChange = (dataTypeId: string, checked: boolean) => {
    setSelectedDataTypes(prev => 
      checked 
        ? [...prev, dataTypeId]
        : prev.filter(id => id !== dataTypeId)
    );
  };

  const generateExportData = (dataType: string) => {
    switch (dataType) {
      case 'leads':
        return mockLeads.filter(lead => {
          if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
          const leadDate = new Date(lead.createdDate);
          if (dateRange.from && leadDate < dateRange.from) return false;
          if (dateRange.to && leadDate > dateRange.to) return false;
          return true;
        }).map(lead => ({
          'Lead ID': lead.id,
          'Customer Name': lead.customerName,
          'Email': lead.email,
          'Phone': lead.phone,
          'Product Type': lead.productType,
          'Loan Amount': lead.loanAmount,
          'Status': lead.status,
          'Priority Score': lead.priorityScore,
          'Assigned To': lead.assignedTo,
          'Region': lead.region,
          'Credit Score': lead.creditScore,
          'Created Date': lead.createdDate,
          'Last Updated': lead.lastUpdated
        }));
        
      case 'analytics':
        return mockAnalytics.monthlyTrends.map(trend => ({
          'Month': trend.month,
          'Total Leads': trend.leads,
          'Converted': trend.converted,
          'Conversion Rate': ((trend.converted / trend.leads) * 100).toFixed(2) + '%'
        }));
        
      case 'users':
        return [
          { 'User': 'Amit Singh', 'Role': 'Processing Staff', 'Active Leads': 23, 'Completed': 45 },
          { 'User': 'Priya Sharma', 'Role': 'Nodal Officer', 'Active Leads': 18, 'Completed': 67 },
          { 'User': 'Rajesh Gupta', 'Role': 'Higher Authority', 'Active Leads': 12, 'Completed': 89 }
        ];
        
      case 'audit':
        return [
          { 'Timestamp': '2024-01-26 10:30', 'User': 'Amit Singh', 'Action': 'Lead Created', 'Lead ID': 'LD001' },
          { 'Timestamp': '2024-01-26 14:20', 'User': 'Priya Sharma', 'Action': 'Status Updated', 'Lead ID': 'LD001' },
          { 'Timestamp': '2024-01-26 16:15', 'User': 'Rajesh Gupta', 'Action': 'Assignment Changed', 'Lead ID': 'LD001' }
        ];
        
      default:
        return [];
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data type to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      for (const dataType of selectedDataTypes) {
        const data = generateExportData(dataType);
        const dataTypeLabel = dataTypes.find(dt => dt.id === dataType)?.label || dataType;
        
        if (exportFormat === 'csv') {
          const csvContent = convertToCSV(data);
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `boi-${dataType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else if (exportFormat === 'json') {
          const jsonContent = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `boi-${dataType}-${format(new Date(), 'yyyy-MM-dd')}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }

      toast({
        title: "Export Successful",
        description: `${selectedDataTypes.length} dataset(s) exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }

    setIsExporting(false);
  };

  if (currentRole === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="boi-card max-w-md">
          <CardContent className="text-center py-12">
            <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Data export is available only for Nodal Officers and Higher Authority.
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
          <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
          <p className="text-gray-600">Export system data in various formats for analysis</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {selectedDataTypes.length} datasets selected
          </Badge>
        </div>
      </div>

      {/* Export Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Leads</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLeads.length}</div>
            <p className="text-xs text-blue-600">Ready for export</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export History</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-green-600">This month</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-green-600">Complete records</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Export</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-orange-600">ago</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Types */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                Select Data Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableDataTypes.map((dataType) => (
                <div key={dataType.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id={dataType.id}
                    checked={selectedDataTypes.includes(dataType.id)}
                    onCheckedChange={(checked) => handleDataTypeChange(dataType.id, checked as boolean)}
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <dataType.icon className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <Label htmlFor={dataType.id} className="font-medium cursor-pointer">
                        {dataType.label}
                      </Label>
                      <p className="text-sm text-gray-600">{dataType.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {dataType.count} records
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2 text-orange-600" />
                Export Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status-filter">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
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
                </div>

                <div>
                  <Label htmlFor="format-select">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label} - {format.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Date Range</Label>
                <div className="flex space-x-2 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Summary */}
        <div className="space-y-6">
          <Card className="boi-card">
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Selected datasets:</span>
                  <span className="font-medium">{selectedDataTypes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Export format:</span>
                  <span className="font-medium uppercase">{exportFormat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date range:</span>
                  <span className="font-medium">
                    {dateRange.from && dateRange.to 
                      ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                      : 'All dates'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated size:</span>
                  <span className="font-medium">~2.4 MB</span>
                </div>
              </div>

              <Button 
                onClick={handleExport}
                disabled={isExporting || selectedDataTypes.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isExporting ? (
                  <>Exporting...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="boi-card">
            <CardHeader>
              <CardTitle>Export Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Data is exported as per current filters and date range</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>All exports are logged for audit purposes</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Sensitive data follows bank security protocols</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>Large exports may take a few minutes to process</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportData;