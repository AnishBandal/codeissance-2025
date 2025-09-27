import { apiCall, type ApiResponse } from './api';

export interface MLPrediction {
  leadCategory: string;
  leadScore: number;
  repaymentProbability: number;
  repaymentDecision: string;
}

export interface MLPredictionRequest {
  priorityScore?: number;
  creditScore: number;
  loanAmount: number | string;
  customerAge: number;
  customerIncome: number | string;
  customerOccupation?: string;
  productType?: string;
  region?: string;
  leadAge?: number;
  daysSinceUpdate?: number;
}

export interface MLHealthResponse {
  success: boolean;
  message: string;
  testResult: MLPrediction;
  serviceUrl: string;
}

class MLService {
  /**
   * Get ML predictions for lead data
   */
  async predict(data: MLPredictionRequest): Promise<ApiResponse<MLPrediction>> {
    return await apiCall<MLPrediction>({
      method: 'POST',
      url: '/ml/predict',
      data
    });
  }

  /**
   * Check ML service health
   */
  async checkHealth(): Promise<ApiResponse<MLHealthResponse>> {
    return await apiCall<MLHealthResponse>({
      method: 'GET',
      url: '/ml/health'
    });
  }

  /**
   * Extract numeric value from string/number input
   */
  private parseNumeric(value: string | number, fallback: number = 0): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  /**
   * Prepare lead data for ML prediction
   */
  preparePredictionData(leadData: Partial<MLPredictionRequest>): MLPredictionRequest {
    return {
      priorityScore: leadData.priorityScore || undefined,
      creditScore: leadData.creditScore || 650,
      loanAmount: this.parseNumeric(leadData.loanAmount || 0),
      customerAge: leadData.customerAge || 35,
      customerIncome: this.parseNumeric(leadData.customerIncome || 0),
      customerOccupation: leadData.customerOccupation || '',
      productType: leadData.productType || '',
      region: leadData.region || '',
      leadAge: leadData.leadAge || 0,
      daysSinceUpdate: leadData.daysSinceUpdate || 0
    };
  }
}

export const mlService = new MLService();
export default mlService;