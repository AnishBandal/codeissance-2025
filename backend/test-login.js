// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const user = await User.findOne({ username: 'admin' });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('📋 Admin user found:', {
      username: user.username,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      isActive: user.isActive
    });

    // Test password
    const passwords = ['admin123', 'admin', 'password', 'Admin123'];
    
    for (const pwd of passwords) {
      const isValid = await user.comparePassword(pwd);
      console.log(`🔑 Password "${pwd}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (isValid) break;
    }

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

testLogin();