const axios = require('axios');
const config = require('../config/env');

class MLPredictionService {
  constructor() {
    this.baseUrl = config.ML_SERVICE_URL || 'http://localhost:3001';
    this.timeout = 10000;
  }

  async predictLeadOutcomes(rawPayload = {}) {
    const payload = this.normalizePayload(rawPayload);

    try {
      console.log('🔮 Attempting ML prediction with payload:', payload);
      
      const response = await axios.post(
        `${this.baseUrl.replace(/\/$/, '')}/predict`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data || {};
      console.log('✅ ML service response:', data);

      return {
        leadCategory: data.leadCategory ?? data.lead_category ?? 'Standard',
        leadScore: this.toNumber(data.leadScore ?? data.lead_score, payload.priorityScore || 75),
        repaymentProbability: this.toNumber(
          data.repaymentProbability ?? data.repayment_probability,
          75
        ),
        repaymentDecision: data.repaymentDecision ?? data.repaymentProb ?? 'Yes'
      };
    } catch (error) {
      console.warn('⚠️ ML service unavailable, using fallback predictions:', error.message);
      
      // Enhanced fallback using heuristic scoring
      const fallbackScore = payload.priorityScore || this.heuristicScore(payload);
      
      return {
        leadCategory: this.categorizeByScore(fallbackScore),
        leadScore: fallbackScore,
        repaymentProbability: Math.min(95, fallbackScore + 10),
        repaymentDecision: fallbackScore >= 60 ? 'Yes' : 'Maybe'
      };
    }
  }

  normalizePayload(input) {
    const payload = { ...input };

    const numericFields = {
      priorityScore: this.toNumber(
        input.priorityScore ?? input.priority_score,
        undefined
      ),
      creditScore: this.toNumber(input.creditScore ?? input.credit_score),
      loanAmount: this.parseCurrency(input.loanAmount ?? input.loan_amount),
      customerAge: this.toNumber(input.customerAge ?? input.customer_age),
      customerIncome: this.parseCurrency(
        input.customerIncome ?? input.customer_income
      ),
      leadAge: this.toNumber(input.leadAge ?? input.lead_age, 0),
      daysSinceUpdate: this.toNumber(
        input.daysSinceUpdate ?? input.days_since_update,
        0
      )
    };

    if (!Number.isFinite(numericFields.priorityScore) || numericFields.priorityScore <= 0) {
      numericFields.priorityScore = this.heuristicScore({
        customerIncome: numericFields.customerIncome,
        customerAge: numericFields.customerAge,
        loanAmount: numericFields.loanAmount,
        customerOccupation: input.customerOccupation,
        creditScore: numericFields.creditScore
      });
    }

    Object.assign(payload, numericFields);

    const optionalFields = [
      'productType',
      'region',
      'zone',
      'customerOccupation',
      'repaymentHistory',
      'tenure',
      'existingLoans'
    ];

    optionalFields.forEach((field) => {
      if (input[field] !== undefined && payload[field] === undefined) {
        payload[field] = input[field];
      }
    });

    return payload;
  }

  heuristicScore({ customerIncome = 0, customerAge = 0, loanAmount = 0, customerOccupation, creditScore = 0 }) {
    let score = 50;

    if (creditScore > 0) {
      const normalizedCredit = Math.max(0, Math.min(1, (creditScore - 300) / 550));
      score += normalizedCredit * 20;
    }

    if (customerIncome > 0) {
      if (customerIncome > 1_000_000) score += 20;
      else if (customerIncome > 500_000) score += 10;
      else if (customerIncome > 250_000) score += 5;
    }

    if (customerAge >= 25 && customerAge <= 45) score += 10;
    else if (customerAge >= 46 && customerAge <= 60) score += 5;

    if (loanAmount > 0 && customerIncome > 0) {
      const ratio = loanAmount / customerIncome;
      if (ratio < 3) score += 10;
      else if (ratio < 5) score += 5;
    }

    if (typeof customerOccupation === 'string') {
      const occupation = customerOccupation.toLowerCase();
      const professionalRoles = ['doctor', 'engineer', 'software', 'manager', 'teacher', 'executive'];
      if (professionalRoles.some((role) => occupation.includes(role))) {
        score += 5;
      }
    }

    return Math.max(30, Math.min(95, Math.round(score)));
  }

  toNumber(value, fallback = 0) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  parseCurrency(value) {
    if (value === undefined || value === null) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const sanitized = value.toString().replace(/[^0-9.\-]/g, '');
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  categorizeByScore(score) {
    if (score >= 85) return 'Premium';
    if (score >= 70) return 'High Priority';
    if (score >= 55) return 'Standard';
    return 'Low Priority';
  }
}

module.exports = new MLPredictionService();
