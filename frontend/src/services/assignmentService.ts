import { apiCall, type ApiResponse } from './api';
import type { BackendLead } from './leadService';

export interface AssignmentOfficer {
  officerId: string;
  username: string;
  email: string;
  zone: string;
  activeLeads: number;
  completedLeads: number;
  totalLeads: number;
  avgProcessingDays: number;
}

export interface AssignmentStats {
  unassignedLeads: number;
  zone: string;
  totalOfficers: number;
  officers: AssignmentOfficer[];
}

export interface AssignmentPagination {
  currentPage: number;
  totalPages: number;
  totalLeads: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UnassignedLeadResponse {
  leads: BackendLead[];
  pagination: AssignmentPagination;
}

export interface AssignLeadPayload {
  leadId: string;
  officerId?: string;
  strategy?: 'manual' | 'auto';
}

export interface AssignLeadResponse {
  lead: BackendLead;
  assignedOfficer: {
    id: string;
    username: string;
    email: string;
    zone: string;
  };
  strategy: 'manual' | 'auto';
  assignedBy: string;
}

export interface UnassignedLeadQuery {
  page?: number;
  limit?: number;
  priority?: 'high' | 'medium' | 'low';
  loanType?: string;
}

class AssignmentService {
  async getStats(): Promise<ApiResponse<AssignmentStats>> {
    return await apiCall<AssignmentStats>({
      method: 'GET',
      url: '/assignment/stats',
    });
  }

  async getUnassignedLeads(
    params: UnassignedLeadQuery = {}
  ): Promise<ApiResponse<UnassignedLeadResponse>> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return await apiCall<UnassignedLeadResponse>({
      method: 'GET',
      url: `/assignment/unassigned?${searchParams.toString()}`,
    });
  }

  async assignLead(
    payload: AssignLeadPayload
  ): Promise<ApiResponse<AssignLeadResponse>> {
    return await apiCall<AssignLeadResponse>({
      method: 'POST',
      url: '/assignment/assign',
      data: payload,
    });
  }
}

export const assignmentService = new AssignmentService();
export default assignmentService;
