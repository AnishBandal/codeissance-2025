const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
require('dotenv').config();

const User = require('./src/models/User');

async function enableAll2FA() {
  try {
    console.log('🔐 Enabling 2FA for all users...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await User.find({});
    console.log(`📋 Found ${users.length} users`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      if (!user.twoFactorEnabled) {
        // Generate a unique secret for each user
        const secret = speakeasy.generateSecret({
          name: `LeadVault ${user.role}`,
          account: user.username,
          issuer: 'LeadVault'
        });
        
        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
          backupCodes.push({
            code: Math.random().toString(36).substring(2, 12).toUpperCase(),
            used: false
          });
        }
        
        // Update user
        user.twoFactorSecret = secret.base32;
        user.twoFactorEnabled = true;
        user.backupCodes = backupCodes;
        
        await user.save();
        updatedCount++;
        
        console.log(`✅ ${user.username} (${user.role}) - 2FA enabled`);
        console.log(`   Secret: ${secret.base32}`);
        console.log(`   QR Setup URL: ${secret.otpauth_url}`);
        console.log(`   Backup codes: ${backupCodes.slice(0, 3).map(bc => bc.code).join(', ')}...`);
        console.log('');
      } else {
        console.log(`⏭️  ${user.username} - 2FA already enabled`);
      }
    }
    
    console.log(`🎉 Successfully enabled 2FA for ${updatedCount} users`);
    console.log('');
    console.log('📱 Setup Instructions:');
    console.log('1. Open Google Authenticator or Microsoft Authenticator');
    console.log('2. Tap "+" to add account');
    console.log('3. Choose "Enter a setup key"');
    console.log('4. Use the account name and secret shown above');
    console.log('5. Use the 6-digit code from the app during login');
    
  } catch (error) {
    console.error('❌ Error enabling 2FA:', error);
  } finally {
    mongoose.connection.close();
  }
}

enableAll2FA();