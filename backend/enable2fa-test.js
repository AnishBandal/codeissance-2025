// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

async function enable2FAForTesting() {
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

    console.log('📋 Current user status:', {
      username: user.username,
      twoFactorEnabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret
    });

    // Enable 2FA for testing (with a dummy secret)
    const dummySecret = 'JBSWY3DPEHPK3PXP'; // Base32 encoded test secret
    
    await User.findByIdAndUpdate(user._id, {
      twoFactorSecret: dummySecret,
      twoFactorEnabled: true,
      backupCodes: [
        { code: 'BACKUP01', used: false },
        { code: 'BACKUP02', used: false }
      ]
    });

    console.log('✅ 2FA enabled for admin user');
    console.log('🔑 Test secret:', dummySecret);
    console.log('🎯 Now try logging in as admin - it should require 2FA');
    console.log('📱 Use this secret in Google Authenticator for testing');

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

enable2FAForTesting();