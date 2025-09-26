import { apiCall, ApiResponse } from './api';

// Audit log types
export interface AuditLog {
  id: string;
  leadId?: string;
  customerName?: string;
  action: string;
  user: {
    id: string;
    username: string;
    role: string;
    zone: string;
  };
  timestamp: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLogs: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuditLogFilters {
  leadId?: string;
  action?: string;
  user?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class AuditService {
  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<ApiResponse<AuditLogsResponse>> {
    const params = new URLSearchParams();
    
    if (filters.leadId) params.append('leadId', filters.leadId);
    if (filters.action) params.append('action', filters.action);
    if (filters.user) params.append('user', filters.user);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return await apiCall<AuditLogsResponse>({
      method: 'GET',
      url: `/audit-logs?${params.toString()}`
    });
  }

  /**
   * Get audit logs for a specific lead
   */
  async getLeadAuditLogs(leadId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<AuditLogsResponse>> {
    return await this.getAuditLogs({
      leadId,
      page,
      limit,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  /**
   * Get recent audit logs (last 100)
   */
  async getRecentAuditLogs(): Promise<ApiResponse<AuditLogsResponse>> {
    return await this.getAuditLogs({
      page: 1,
      limit: 100,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(): Promise<ApiResponse<{
    totalLogs: number;
    logsToday: number;
    logsThisWeek: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ username: string; count: number }>;
  }>> {
    return await apiCall({
      method: 'GET',
      url: '/audit-logs/stats'
    });
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;