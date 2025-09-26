const axios = require('axios');
const config = require('../config/env');

class ScoreService {
  constructor() {
    this.mlServiceUrl = config.ML_SERVICE_URL;
    this.timeout = 10000; // 10 seconds timeout
  }

  /**
   * Calculate lead priority score using FastAPI ML service
   * @param {Object} leadData - Lead data for scoring
   * @returns {Promise<number>} Priority score (0-100)
   */
  async calculatePriorityScore(leadData) {
    try {
      const features = this.extractFeatures(leadData);
      
      console.log('📊 Sending lead data to ML service:', {
        url: `${this.mlServiceUrl}/api/predict`,
        features: features.length
      });

      const response = await axios.post(
        `${this.mlServiceUrl}/api/predict`,
        { features },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const conversionProbability = response.data.conversion_probability;
      const priorityScore = Math.round(conversionProbability * 100);

      console.log('✅ ML service response:', {
        probability: conversionProbability,
        score: priorityScore
      });

      return Math.min(Math.max(priorityScore, 0), 100); // Ensure 0-100 range

    } catch (error) {
      console.error('❌ ML service error:', error.message);
      
      // Fallback scoring logic if ML service is unavailable
      return this.fallbackScoring(leadData);
    }
  }

  /**
   * Extract features from lead data for ML model
   * @param {Object} leadData - Lead data
   * @returns {Array<number>} Feature array
   */
  extractFeatures(leadData) {
    // Convert lead data to numerical features for ML model
    const features = [
      // Salary (normalized to 0-1 scale, assuming max salary 1M)
      Math.min(leadData.salary / 1000000, 1),
      
      // Credit score (normalized to 0-1 scale)
      (leadData.creditScore - 300) / 550,
      
      // Product type encoding
      this.encodeProductType(leadData.productType),
      
      // Age estimation based on salary (rough approximation)
      this.estimateAgeFromSalary(leadData.salary),
      
      // Employment status (assumed employed if salary > 0)
      leadData.salary > 0 ? 1 : 0
    ];

    return features;
  }

  /**
   * Encode product type as numerical value
   * @param {string} productType - Product type
   * @returns {number} Encoded value
   */
  encodeProductType(productType) {
    const encoding = {
      'Loan': 0.25,
      'Credit Card': 0.5,
      'Account': 0.75,
      'Insurance': 1.0
    };
    return encoding[productType] || 0.5;
  }

  /**
   * Estimate age from salary (rough approximation)
   * @param {number} salary - Annual salary
   * @returns {number} Normalized age estimate (0-1)
   */
  estimateAgeFromSalary(salary) {
    // Rough estimation: higher salary usually means older/more experienced
    if (salary < 30000) return 0.2; // Young professional
    if (salary < 60000) return 0.4; // Mid-level
    if (salary < 100000) return 0.6; // Senior
    if (salary < 200000) return 0.8; // Executive
    return 1.0; // Senior executive
  }

  /**
   * Fallback scoring when ML service is unavailable
   * @param {Object} leadData - Lead data
   * @returns {number} Priority score (0-100)
   */
  fallbackScoring(leadData) {
    console.log('⚠️ Using fallback scoring algorithm');

    let score = 50; // Base score

    // Credit score factor (30% weight)
    if (leadData.creditScore >= 750) score += 20;
    else if (leadData.creditScore >= 650) score += 10;
    else if (leadData.creditScore < 550) score -= 15;

    // Salary factor (25% weight)
    if (leadData.salary >= 100000) score += 15;
    else if (leadData.salary >= 60000) score += 8;
    else if (leadData.salary < 30000) score -= 10;

    // Product type factor (20% weight)
    const productMultiplier = {
      'Loan': 1.2,
      'Credit Card': 1.0,
      'Account': 0.9,
      'Insurance': 0.8
    };
    score *= (productMultiplier[leadData.productType] || 1.0);

    // Email validation factor (10% weight)
    if (leadData.email && leadData.email.includes('@')) score += 5;

    // Phone factor (15% weight)
    if (leadData.phone && leadData.phone.length >= 10) score += 8;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  /**
   * Test ML service connectivity
   * @returns {Promise<boolean>} Service availability
   */
  async testConnectivity() {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.log('⚠️ ML service not available:', error.message);
      return false;
    }
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    const isAvailable = await this.testConnectivity();
    return {
      service: 'ML Scoring Service',
      url: this.mlServiceUrl,
      available: isAvailable,
      fallback: !isAvailable,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ScoreService();