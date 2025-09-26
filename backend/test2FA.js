const mongoose = require('mongoose');
const User = require('./src/models/User');
const TwoFactorService = require('./src/services/twoFactorService');
const config = require('./src/config/env');

async function test2FA() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (let's use admin)
    const user = await User.findOne({ username: 'admin' });
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('📋 Current user 2FA status:', {
      username: user.username,
      twoFactorEnabled: user.twoFactorEnabled,
      hasSecret: !!user.twoFactorSecret,
      backupCodesCount: user.backupCodes ? user.backupCodes.length : 0
    });

    // If 2FA is not enabled, let's set it up for testing
    if (!user.twoFactorEnabled) {
      console.log('🔧 Setting up 2FA for testing...');
      
      // Generate secret
      const setup = await TwoFactorService.generateSecret(user._id, user.username);
      console.log('🔑 Secret generated');
      console.log('📱 Manual entry key:', setup.manualEntryKey);
      console.log('🖼️ QR Code length:', setup.qrCode.length);
      
      // For testing, let's enable 2FA with a dummy verification
      // In real usage, user would scan QR code and enter TOTP token
      console.log('⚠️ Note: In production, user must scan QR code and verify with TOTP token');
      console.log('💡 To test login with 2FA:');
      console.log('   1. Install Google Authenticator or Microsoft Authenticator');
      console.log('   2. Scan the QR code (check server logs for data URL)');
      console.log('   3. Enter the 6-digit code from your app');
      console.log('   4. Then you can test 2FA login');
    }

    mongoose.connection.close();
    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    mongoose.connection.close();
  }
}

test2FA();