const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const usersRoutes = require('./routes/users');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// CORS configuration (support array + dynamic validation)
const allowedOrigins = Array.isArray(config.CORS_ORIGIN) ? config.CORS_ORIGIN : [config.CORS_ORIGIN];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin or non-browser
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LeadVault API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/2fa', require('./routes/twoFactor'));
app.use('/api/leads', require('./routes/leadSync')); // Added for offline sync support

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'INVALID_ID'
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate field value',
      error: 'DUPLICATE_FIELD'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    error: 'INTERNAL_ERROR'
  });
});

module.exports = app;