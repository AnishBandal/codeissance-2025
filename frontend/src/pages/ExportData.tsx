import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/contexts/RoleContext';
import { leadService, type LeadStats, type LeadFilters } from '@/services/leadService';
import {
  Download,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  History,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ExportFormat = 'csv' | 'json';

interface DateRange {
  from?: Date;
  to?: Date;
}

type ExportDataset = 'leads' | 'audit';
type RoleSlug = 'processing' | 'nodal' | 'authority';

interface DataTypeOption {
  id: ExportDataset;
  label: string;
  description: string;
  icon: LucideIcon;
  count: number | string;
  roles: ReadonlyArray<RoleSlug>;
}

const ExportData: React.FC = () => {
  const { currentRole } = useRole();
  const { toast } = useToast();

  const [selectedDataset, setSelectedDataset] = useState<ExportDataset>('leads');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportFormats: Array<{ value: ExportFormat; label: string; description: string }> = useMemo(
    () => [
      { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
      { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    ],
    []
  );

  const dataTypes = useMemo<DataTypeOption[]>(
    () => [
      {
        id: 'leads',
        label: 'Lead Data',
        description: 'Customer leads with real-time details',
        icon: FileText,
        count: loadingStats ? '—' : stats?.totalLeads ?? 0,
        roles: ['nodal', 'authority'],
      },
      {
        id: 'audit',
        label: 'Audit Logs',
        description: 'Detailed lead activity trail with timestamps',
        icon: History,
        count: '—',
        roles: ['nodal', 'authority'],
      },
    ],
    [loadingStats, stats]
  );

  const availableDataTypes = useMemo(
    () => dataTypes.filter((type) => type.roles.includes(currentRole as RoleSlug)),
    [dataTypes, currentRole]
  );

  const productOptions = useMemo(() => {
    if (!stats?.productDistribution?.length) {
      return [] as string[];
    }
    return stats.productDistribution
      .map((item) => item.product)
      .filter((product): product is string => Boolean(product));
  }, [stats]);

  const extractErrorMessage = (error: unknown) => {
    if (!error) return 'Something went wrong';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object') {
      const payload = error as { error?: string; message?: string };
      return payload.error || payload.message || 'Something went wrong';
    }
    return 'Something went wrong';
  };

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setLoadingStats(true);
        setError(null);
        const response = await leadService.getLeadStats();
        if (!isMounted) return;

        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.error || response.message || 'Failed to load lead stats');
        }
      } catch (err) {
        if (isMounted) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDatasetChange = (value: ExportDataset) => {
    setSelectedDataset(value);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filters: LeadFilters = {};

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (productFilter !== 'all') {
        filters.productType = productFilter;
      }

      if (dateRange.from) {
        filters.startDate = dateRange.from.toISOString();
      }

      if (dateRange.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        filters.endDate = endDate.toISOString();
      }

      const dataset = selectedDataset;
      const blob = await leadService.exportLeads(exportFormat, filters, dataset);
      const datasetMeta = dataTypes.find((type) => type.id === dataset);
      const datasetLabel = datasetMeta?.label ?? dataset;

      const fileName = `boi-${dataset}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `${datasetLabel} exported as ${exportFormat.toUpperCase()} file.`,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (currentRole === 'processing') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="boi-card max-w-md">
          <CardContent className="py-12 text-center">
            <Download className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Access Restricted</h3>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Data</h1>
          <p className="text-gray-600">Export live lead data with the latest filters applied</p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {dataTypes.find((type) => type.id === selectedDataset)?.label ?? 'Lead Data'} selected
          </Badge>
        </div>
      </div>

      {/* Export Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '—' : stats?.totalLeads ?? '0'}</div>
            <p className="text-xs text-blue-600">Within your current scope</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '—' : stats?.activeLeads ?? '0'}</div>
            <p className="text-xs text-green-600">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Leads</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '—' : stats?.completedLeads ?? '0'}</div>
            <p className="text-xs text-green-600">Converted successfully</p>
          </CardContent>
        </Card>

        <Card className="boi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats
                ? '—'
                : stats?.conversionRate !== undefined
                ? `${stats.conversionRate.toFixed(1)}%`
                : '0%'}
            </div>
            <p className="text-xs text-orange-600">Overall conversion</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Data Selection */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5 text-blue-600" />
                Select Dataset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableDataTypes.length > 0 ? (
                <RadioGroup
                  value={selectedDataset}
                  onValueChange={(value) => handleDatasetChange(value as ExportDataset)}
                  className="space-y-3"
                >
                  {availableDataTypes.map((dataType) => (
                    <label
                      key={dataType.id}
                      htmlFor={`dataset-${dataType.id}`}
                      className={cn(
                        'flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors',
                        selectedDataset === dataType.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent bg-gray-50 hover:border-gray-200'
                      )}
                    >
                      <RadioGroupItem value={dataType.id} id={`dataset-${dataType.id}`} />
                      <div className="flex flex-1 items-center space-x-3">
                        <dataType.icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{dataType.label}</div>
                          <p className="text-sm text-gray-600">{dataType.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {loadingStats ? '—' : dataType.count} records
                        </Badge>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  No exportable datasets available for your role.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="boi-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-5 w-5 text-blue-600" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="status-filter">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
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

                <div>
                  <Label htmlFor="product-filter">Product Type</Label>
                  <Select value={productFilter} onValueChange={setProductFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {productOptions.map((product) => (
                        <SelectItem key={product} value={product}>
                          {product}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format-select">Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map((formatOption) => (
                        <SelectItem key={formatOption.value} value={formatOption.value}>
                          {formatOption.label} - {formatOption.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Date Range</Label>
                <div className="mt-2 flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !dateRange.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, 'PPP') : 'From date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date ?? undefined }))}
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
                          'flex-1 justify-start text-left font-normal',
                          !dateRange.to && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, 'PPP') : 'To date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date ?? undefined }))}
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Selected dataset:</span>
                  <span className="font-medium">{dataTypes.find((type) => type.id === selectedDataset)?.label ?? 'Lead Data'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export format:</span>
                  <span className="font-medium uppercase">{exportFormat}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date range:</span>
                  <span className="font-medium">
                    {dateRange.from || dateRange.to
                      ? `${dateRange.from ? format(dateRange.from, 'MMM dd') : 'Start'} - ${
                          dateRange.to ? format(dateRange.to, 'MMM dd') : 'Present'
                        }`
                      : 'All dates'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status filter:</span>
                  <span className="font-medium">{statusFilter === 'all' ? 'All statuses' : statusFilter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Product filter:</span>
                  <span className="font-medium">{productFilter === 'all' ? 'All products' : productFilter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Records in scope:</span>
                  <span className="font-medium">{loadingStats ? '—' : stats?.totalLeads ?? '0'}</span>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting || !selectedDataset || loadingStats}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isExporting ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </span>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
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
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Data is exported as per current filters and date range.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600 flex-shrink-0" />
                <span>All exports are logged for audit purposes.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Sensitive data follows bank security protocols.</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-orange-600 flex-shrink-0" />
                <span>Large exports may take a few minutes to process.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportData;