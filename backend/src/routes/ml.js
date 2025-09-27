const express = require('express');
const router = express.Router();
const mlPredictionService = require('../services/mlPredictionService');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/ml/predict
 * @desc    Get ML predictions for lead data
 * @access  Private
 */
router.post('/predict', authenticateToken, async (req, res) => {
  try {
    const leadData = req.body;
    
    console.log('🔮 ML prediction request from user:', req.user.username);
    
    const predictions = await mlPredictionService.predictLeadOutcomes(leadData);
    
    res.json({
      success: true,
      data: predictions,
      message: 'ML predictions generated successfully'
    });
    
  } catch (error) {
    console.error('ML prediction route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ML predictions',
      error: 'ML_PREDICTION_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/ml/health
 * @desc    Check ML service health
 * @access  Private
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    // Test with dummy data
    const testData = {
      priorityScore: 75,
      creditScore: 700,
      loanAmount: 500000,
      customerAge: 35,
      customerIncome: 800000
    };
    
    const predictions = await mlPredictionService.predictLeadOutcomes(testData);
    
    res.json({
      success: true,
      message: 'ML service is healthy',
      testResult: predictions,
      serviceUrl: mlPredictionService.baseUrl
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service is not available',
      error: error.message,
      serviceUrl: mlPredictionService.baseUrl
    });
  }
});

module.exports = router;