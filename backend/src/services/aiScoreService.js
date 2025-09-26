const axios = require('axios');
const config = require('../config/env');

class AIScoreService {
  constructor() {
    this.mlServiceUrl = config.ML_SERVICE_URL || 'http://localhost:8000';
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
        customerName: leadData.customerName || leadData.name
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
   * Generate AI insights for a lead using ML service
   * @param {Object} leadData - Lead data for insights
   * @returns {Promise<string>} AI-generated insight
   */
  async generateAIInsight(leadData) {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/insights`,
        { 
          lead: {
            customerName: leadData.customerName || leadData.name,
            creditScore: leadData.creditScore,
            salary: leadData.salary,
            customerAge: leadData.customerAge,
            customerOccupation: leadData.customerOccupation,
            productType: leadData.productType,
            loanAmount: leadData.loanAmount,
            region: leadData.region || leadData.zone
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.insight) {
        console.log('✅ AI insight generated successfully');
        return response.data.insight;
      } else {
        return this.generateFallbackInsight(leadData);
      }
      
    } catch (error) {
      console.warn('❌ ML insight service unavailable, generating fallback insight:', error.message);
      return this.generateFallbackInsight(leadData);
    }
  }

  /**
   * Extract features from lead data for ML model
   * @param {Object} leadData - Lead data
   * @returns {Array} Features array for ML model
   */
  extractFeatures(leadData) {
    // Enhanced feature extraction matching frontend schema
    return [
      leadData.creditScore || 0,
      leadData.salary || 0,
      leadData.customerAge || 30,    // Default age if not provided
      this.encodeProductType(leadData.productType),
      this.encodeRegion(leadData.region || leadData.zone),
      this.encodeOccupation(leadData.customerOccupation),
      this.parseLoanAmount(leadData.loanAmount)
    ];
  }

  /**
   * Enhanced fallback scoring algorithm
   * @param {Object} leadData - Lead data
   * @returns {number} Priority score (0-100)
   */
  fallbackScoring(leadData) {
    console.log('🔄 Using fallback scoring algorithm');
    
    let score = 20; // Base score (lower base for more variation)
    
    // Credit score impact (30% of total score)
    if (leadData.creditScore) {
      const creditScoreNormalized = Math.max(0, Math.min(1, (leadData.creditScore - 300) / (850 - 300)));
      score += creditScoreNormalized * 30;
    }
    
    // Salary/Income impact (25% of total score)  
    if (leadData.salary) {
      const salaryScore = Math.min(leadData.salary / 200000, 1) * 25;
      score += salaryScore;
    }
    
    // Age impact (15% of total score) - optimal age range 28-40
    if (leadData.customerAge) {
      const ageScore = Math.max(0, 15 - Math.abs(34 - leadData.customerAge) * 0.4);
      score += ageScore;
    }
    
    // Product type impact (15% of total score)
    const productTypeScores = {
      'Loan': 15,
      'Mortgage': 14,
      'Credit Card': 12,
      'Investment': 10,
      'Account': 8,
      'Insurance': 6
    };
    score += productTypeScores[leadData.productType] || 5;
    
    // Occupation impact (10% of total score)
    const occupationScore = this.getOccupationScore(leadData.customerOccupation);
    score += occupationScore;
    
    // Region/Zone impact (5% of total score)
    const regionScores = {
      'Zone-A': 5,
      'Zone-B': 4,
      'Zone-C': 3,
      'Metropolitan': 5,
      'Urban': 4,
      'Rural': 2
    };
    score += regionScores[leadData.region || leadData.zone] || 3;
    
    // Add some randomness for variety (±5 points)
    score += (Math.random() - 0.5) * 10;
    
    // Ensure score is within bounds
    const finalScore = Math.max(60, Math.min(99, Math.round(score)));
    
    console.log('📊 Fallback scoring breakdown:', {
      customerName: leadData.customerName || leadData.name,
      creditScore: leadData.creditScore,
      salary: leadData.salary,
      age: leadData.customerAge,
      productType: leadData.productType,
      finalScore
    });
    
    return finalScore;
  }

  /**
   * Generate fallback AI insight when ML service is unavailable
   * @param {Object} leadData - Lead data
   * @returns {string} Generated insight
   */
  generateFallbackInsight(leadData) {
    const insights = [];
    
    // Credit score analysis
    if (leadData.creditScore >= 750) {
      insights.push("⭐ Excellent credit profile - Priority customer for premium products");
    } else if (leadData.creditScore >= 700) {
      insights.push("✅ Strong credit history - Suitable for most financial products");
    } else if (leadData.creditScore >= 650) {
      insights.push("📊 Good credit score - Standard processing recommended");
    } else if (leadData.creditScore >= 600) {
      insights.push("⚠️ Fair credit score - May require additional documentation");
    } else {
      insights.push("🔍 Lower credit score - Detailed review and verification needed");
    }
    
    // Income analysis
    if (leadData.salary >= 150000) {
      insights.push("💰 High-income segment - Eligible for premium offerings");
    } else if (leadData.salary >= 75000) {
      insights.push("💼 Stable income profile - Good candidate for standard products");
    } else if (leadData.salary >= 30000) {
      insights.push("📈 Moderate income - Consider entry-level products");
    }
    
    // Age demographic analysis
    if (leadData.customerAge >= 25 && leadData.customerAge <= 35) {
      insights.push("🎯 Prime demographic - High growth potential");
    } else if (leadData.customerAge >= 36 && leadData.customerAge <= 50) {
      insights.push("💪 Established customer segment - Stable financial needs");
    } else if (leadData.customerAge > 50) {
      insights.push("🏛️ Senior segment - Focus on wealth preservation products");
    }
    
    // Product-specific insights
    if (leadData.productType === 'Loan' && leadData.loanAmount) {
      const amount = this.parseLoanAmount(leadData.loanAmount);
      const incomeRatio = amount / (leadData.salary || 1);
      if (incomeRatio > 6) {
        insights.push("📋 High loan-to-income ratio - Extended tenure may be required");
      } else if (incomeRatio < 3) {
        insights.push("✨ Conservative loan amount - Low risk profile");
      }
    }
    
    // Occupation-based insights
    if (leadData.customerOccupation) {
      const occupation = leadData.customerOccupation.toLowerCase();
      if (['doctor', 'engineer', 'manager', 'executive'].some(occ => occupation.includes(occ))) {
        insights.push("🎓 Professional occupation - Enhanced credit profile");
      } else if (['business', 'entrepreneur', 'self-employed'].some(occ => occupation.includes(occ))) {
        insights.push("🏢 Business owner - Variable income assessment needed");
      }
    }
    
    return insights.length > 0 ? insights.join(' | ') : 
      '📝 Standard processing recommended based on customer profile';
  }

  // Helper methods
  encodeProductType(productType) {
    const types = {
      'Loan': 1,
      'Mortgage': 2,
      'Credit Card': 3,
      'Investment': 4,
      'Account': 5,
      'Insurance': 6
    };
    return types[productType] || 0;
  }

  encodeRegion(region) {
    const regions = {
      'Zone-A': 1,
      'Zone-B': 2,
      'Zone-C': 3,
      'Metropolitan': 4,
      'Urban': 5,
      'Rural': 6
    };
    return regions[region] || 0;
  }

  encodeOccupation(occupation) {
    if (!occupation) return 0;
    
    const occ = occupation.toLowerCase();
    if (['doctor', 'physician', 'surgeon'].some(term => occ.includes(term))) return 1;
    if (['engineer', 'architect', 'developer'].some(term => occ.includes(term))) return 2;
    if (['manager', 'executive', 'director'].some(term => occ.includes(term))) return 3;
    if (['lawyer', 'advocate', 'attorney'].some(term => occ.includes(term))) return 4;
    if (['teacher', 'professor', 'educator'].some(term => occ.includes(term))) return 5;
    if (['business', 'entrepreneur', 'owner'].some(term => occ.includes(term))) return 6;
    return 7; // Others
  }

  getOccupationScore(occupation) {
    if (!occupation) return 3;
    
    const highValueOccupations = ['doctor', 'engineer', 'manager', 'executive', 'lawyer', 'consultant', 'architect'];
    const moderateOccupations = ['teacher', 'nurse', 'analyst', 'accountant', 'supervisor'];
    
    const occ = occupation.toLowerCase();
    
    if (highValueOccupations.some(term => occ.includes(term))) return 10;
    if (moderateOccupations.some(term => occ.includes(term))) return 7;
    if (occ.includes('business') || occ.includes('entrepreneur')) return 8;
    
    return 5; // Default for other occupations
  }

  parseLoanAmount(loanAmount) {
    if (!loanAmount) return 0;
    // Remove currency symbols and commas, extract number
    const cleanAmount = loanAmount.toString().replace(/[^\d.]/g, '');
    return parseFloat(cleanAmount) || 0;
  }
}

// Export singleton instance
module.exports = new AIScoreService();