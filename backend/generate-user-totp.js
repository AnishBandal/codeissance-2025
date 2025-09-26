const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
require('dotenv').config();

const User = require('./src/models/User');

async function generateTOTPForUser(username) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the user
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`❌ User '${username}' not found`);
      console.log('Available users:');
      const allUsers = await User.find({}, 'username role twoFactorEnabled');
      allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.role}) - 2FA: ${u.twoFactorEnabled ? '✅' : '❌'}`);
      });
      return;
    }
    
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      console.log(`❌ 2FA is not enabled for user '${username}'`);
      return;
    }
    
    // Generate TOTP token
    const token = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: 'base32'
    });
    
    console.log('🔐 TOTP Token Generated Successfully!');
    console.log('');
    console.log(`👤 User: ${user.username} (${user.role})`);
    console.log(`🔑 Secret: ${user.twoFactorSecret}`);
    console.log(`📱 Current TOTP token: ${token}`);
    console.log('⏰ This token is valid for ~30 seconds');
    console.log('');
    console.log('🧪 Test the 2FA completion with:');
    console.log(`curl -X POST http://localhost:5000/api/auth/login-2fa -H "Content-Type: application/json" -d '{"userId":"${user._id}","token":"${token}"}'`);
    console.log('');
    console.log('📱 Or add this secret to Google Authenticator:');
    console.log('   1. Open Google Authenticator');
    console.log('   2. Tap "+" to add account');
    console.log('   3. Choose "Enter a setup key"');
    console.log(`   4. Account name: LeadVault ${user.role}`);
    console.log(`   5. Your key: ${user.twoFactorSecret}`);
    console.log('   6. Use the 6-digit code from the app');
    
  } catch (error) {
    console.error('❌ Error generating TOTP:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.log('Usage: node generate-user-totp.js <username>');
  console.log('Example: node generate-user-totp.js admin');
  console.log('Example: node generate-user-totp.js nodal_zone_a');
  console.log('Example: node generate-user-totp.js staff_alice');
  process.exit(1);
}

generateTOTPForUser(username);