// Environment variables should already be loaded by index.js
const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/leadvault',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  
  // ML Service Configuration
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  
  // CORS Configuration
  // Allow multiple origins (frontend may run on 8080 or 3000, adjust as needed)
  CORS_ORIGIN: (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.split(',')) || [
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  
  // Security Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Validation
  validateConfig() {
    const requiredVars = [];
    
    // In production, require JWT_SECRET and MONGODB_URI
    if (this.NODE_ENV === 'production') {
      requiredVars.push('JWT_SECRET', 'MONGODB_URI');
    } else {
      // In development, only require JWT_SECRET if it's not using default
      if (!process.env.JWT_SECRET && this.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        requiredVars.push('JWT_SECRET');
      }
    }
    
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Log configuration status
    console.log('⚙️ Configuration loaded:');
    console.log(`   - Environment: ${this.NODE_ENV}`);
    console.log(`   - Port: ${this.PORT}`);
    console.log(`   - Database: ${this.MONGODB_URI ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   - JWT Secret: ${this.JWT_SECRET ? '✅ Configured' : '❌ Not configured'}`);
    
    // Warn about default values in production
    if (this.NODE_ENV === 'production') {
      if (this.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        console.warn('⚠️ WARNING: Using default JWT_SECRET in production!');
      }
    }
  }
};

// Validate configuration on load
try {
  config.validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = config;