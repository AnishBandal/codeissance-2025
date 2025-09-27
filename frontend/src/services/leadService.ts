import { apiCall, ApiResponse } from './api';

// Lead types matching backend schema
export interface BackendLead {
  _id: string;
  customerName: string;
  name?: string; // backward compatibility
  email: string;
  phone: string;
  productType: string;
  status: 'New' | 'Document Collection' | 'Initial Review' | 'Credit Assessment' | 'Final Review' | 'Approved' | 'Rejected' | 'Completed';
  priorityScore: number;
  assignedTo?: {
    _id: string;
    username: string;
    role: string;
  } | string;
  createdBy: {
    _id: string;
    username: string;
    role: string;
  };
  salary: number;
  customerIncome: string;
  creditScore: number;
  customerAge: number;
  customerOccupation: string;
  loanAmount?: string;
  aiInsight?: string;
  documents: (string | {
    _id?: string;
    filename?: string;
    originalName?: string;
    url?: string;
    publicId?: string;
    size?: number;
    mimetype?: string;
    uploadedAt?: string;
    uploadedBy?: string;
  })[];
  region: string;
  zone: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: Array<{
    action: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
}

export interface CreateLeadRequest {
  customerName: string;
  email: string;
  phone: string;
  productType: string;
  salary: number;
  customerIncome?: string;
  creditScore: number;
  customerAge: number;
  customerOccupation: string;
  loanAmount?: string;
  region?: string;
  documents?: string[];
  status?: string;
}

export interface UpdateLeadRequest {
  customerName?: string;
  email?: string;
  phone?: string;
  productType?: string;
  status?: string;
  assignedTo?: string;
  creditScore?: number;
  customerAge?: number;
  customerOccupation?: string;
  loanAmount?: string;
  documents?: string[];
  notes?: string;
}

export interface LeadsResponse {
  leads: BackendLead[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalLeads: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    userRole: string;
    userZone: string;
  };
}

export interface LeadFilters {
  status?: string;
  productType?: string;
  assignedTo?: string;
  zone?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface LeadStats {
  totalLeads: number;
  activeLeads: number;
  completedLeads: number;
  conversionRate: number;
  avgProcessingTime: number;
  statusBreakdown: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    leads: number;
    converted: number;
  }>;
  productDistribution: Array<{
    product: string;
    count: number;
    percentage: number;
  }>;
  regionPerformance: Array<{
    region: string;
    leads: number;
    conversion: number;
  }>;
  avgPriorityScore: number;
  scope: {
    role: string;
    zone: string;
    viewingOwnLeads: boolean;
  };
}

export interface LeadPredictionRequest {
  priorityScore?: number;
  creditScore?: number;
  loanAmount?: number | string;
  customerAge?: number | string;
  customerIncome?: number | string;
  leadAge?: number;
  daysSinceUpdate?: number;
  productType?: string;
  region?: string;
  zone?: string;
  customerOccupation?: string;
}

export interface LeadPredictionResponse {
  leadScore: number | null;
  leadCategory: string | null;
  repaymentProbability: number | null;
  repaymentDecision: string | null;
}

class LeadService {
  /**
   * Get all leads with filtering and pagination
   */
  async getLeads(filters: LeadFilters = {}): Promise<ApiResponse<LeadsResponse>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return await apiCall<LeadsResponse>({
      method: 'GET',
      url: `/leads?${params.toString()}`
    });
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<ApiResponse<{ lead: BackendLead }>> {
    return await apiCall<{ lead: BackendLead }>({
      method: 'GET',
      url: `/leads/${id}`
    });
  }

  /**
   * Create new lead
   */
  async createLead(leadData: CreateLeadRequest): Promise<ApiResponse<{ lead: BackendLead }>> {
    return await apiCall<{ lead: BackendLead }>({
      method: 'POST',
      url: '/leads',
      data: leadData
    });
  }

  /**
   * Update existing lead
   */
  async updateLead(id: string, updates: UpdateLeadRequest): Promise<ApiResponse<{ 
    lead: BackendLead; 
    emailSent?: boolean; 
    emailInfo?: Record<string, unknown>; 
  }>> {
    return await apiCall<{ 
      lead: BackendLead; 
      emailSent?: boolean; 
      emailInfo?: Record<string, unknown>; 
    }>({
          method: 'PATCH',
      url: `/leads/${id}`,
      data: updates
    });
  }

  /**
   * Delete lead (admin only)
   */
  async deleteLead(id: string): Promise<ApiResponse<{ message: string }>> {
    return await apiCall<{ message: string }>({
      method: 'DELETE',
      url: `/leads/${id}`
    });
  }

  /**
   * Revert lead to customer with email notification
   */
  async revertLeadToCustomer(id: string, reason?: string): Promise<ApiResponse<{ 
    lead: BackendLead; 
    emailSent: boolean; 
    emailInfo: Record<string, unknown>; 
  }>> {
    return await apiCall<{ 
      lead: BackendLead; 
      emailSent: boolean; 
      emailInfo: Record<string, unknown>; 
    }>({
      method: 'PUT',
      url: `/leads/${id}/revert`,
      data: { reason }
    });
  }

  /**
   * Send remarks to customer with email notification
   */
  async sendRemarksToCustomer(id: string, remarks: string): Promise<ApiResponse<{ 
    lead?: BackendLead; 
    emailSent: boolean; 
    emailInfo: Record<string, unknown>; 
  }>> {
    return await apiCall<{ 
      lead?: BackendLead; 
      emailSent: boolean; 
      emailInfo: Record<string, unknown>; 
    }>({
      method: 'POST',
      url: `/leads/${id}/send-remarks`,
      data: { remarks }
    });
  }

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<ApiResponse<LeadStats>> {
    return await apiCall<LeadStats>({
      method: 'GET',
      url: '/leads/stats'
    });
  }

  async getLeadPrediction(
    payload: LeadPredictionRequest
  ): Promise<ApiResponse<LeadPredictionResponse>> {
    return await apiCall<LeadPredictionResponse>({
      method: 'POST',
      url: '/ml/predict',
      data: payload
    });
  }

  /**
   * Export leads data
   */
  async exportLeads(
    format: 'csv' | 'json' = 'csv',
    filters: LeadFilters = {},
    dataset: 'leads' | 'audit' = 'leads'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    params.append('dataset', dataset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leads/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('leadvault_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }



  /**
   * Parse income string to number
   */
  private parseIncome(incomeStr: string): number {
    const cleanStr = incomeStr.replace(/[₹,\s]/g, '');
    return parseInt(cleanStr) || 0;
  }

  /**
   * Format salary to income string
   */
  formatIncome(salary: number): string {
    return `₹${salary.toLocaleString()}`;
  }
}

export const leadService = new LeadService();
export default leadService;