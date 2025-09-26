// Load environment variables first
require('dotenv').config();

const speakeasy = require('speakeasy');

// The test secret we set for admin user
const testSecret = 'JBSWY3DPEHPK3PXP';

console.log('🔐 Generating TOTP token for testing...');
console.log('🔑 Secret:', testSecret);

const token = speakeasy.totp({
  secret: testSecret,
  encoding: 'base32'
});

console.log('📱 Current TOTP token:', token);
console.log('⏰ This token is valid for ~30 seconds');
console.log('');
console.log('🧪 Test the 2FA completion with:');
console.log(`curl -X POST http://localhost:5000/api/auth/login-2fa -H "Content-Type: application/json" -d '{"userId":"68d662a53d685addc57d0500","token":"${token}"}'`);
console.log('');
console.log('📱 Or add this secret to Google Authenticator:');
console.log('   1. Open Google Authenticator');
console.log('   2. Tap "+" to add account');
console.log('   3. Choose "Enter a setup key"');
console.log('   4. Account name: LeadVault Admin');
console.log('   5. Your key:', testSecret);
console.log('   6. Use the 6-digit code from the app');