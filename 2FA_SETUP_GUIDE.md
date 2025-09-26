# 2FA Setup Guide for LeadVault

## 🔐 Two-Factor Authentication (2FA) is now enabled for ALL users!

All users in the LeadVault system now require 2FA for enhanced security. This includes:
- Higher Authority (admin)
- Nodal Officers (nodal_zone_a, nodal_zone_b, etc.)
- Processing Staff (staff_alice, staff_bob, staff_charlie, staff_diana)

## 📱 Setting Up Your Authenticator App

### Step 1: Download an Authenticator App
- **Google Authenticator** (iOS/Android)
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)

### Step 2: Add Your LeadVault Account
1. Open your authenticator app
2. Tap "+" or "Add Account"
3. Choose "Enter a setup key" or "Manual entry"
4. Enter your account details:
   - **Account name**: LeadVault [Your Role]
   - **Your key**: [Your unique secret from the setup output]

### Step 3: Get Your Secret Key
Your unique 2FA secret was displayed when 2FA was enabled. If you need it again, contact your system administrator.

## 🚀 Login Process

1. **Enter Username & Password**: Use your regular credentials
2. **2FA Prompt**: The system will show a 2FA input form
3. **Enter TOTP Code**: 
   - Open your authenticator app
   - Find your LeadVault account
   - Enter the 6-digit code shown
4. **Success**: You'll be logged in to the dashboard

## 🧪 Testing Your Setup

### For Developers/Admins:
Generate a TOTP token for any user:
```bash
node generate-user-totp.js username
```

Examples:
```bash
node generate-user-totp.js admin
node generate-user-totp.js nodal_zone_a
node generate-user-totp.js staff_alice
```

## 👥 Demo Credentials

All these users now require 2FA:

- **Higher Authority**: admin / Admin123!
- **Nodal Officer**: nodal_zone_a / Nodal123!
- **Processing Staff**: staff_alice / Staff123!

## 🔧 Troubleshooting

### Token Not Working?
- Ensure your device's time is synchronized
- TOTP codes change every 30 seconds
- Try generating a fresh code

### Lost Access?
- Contact your system administrator
- Backup codes are available (if implemented)

### Technical Issues?
- Check that the backend server is running
- Verify database connectivity
- Check browser console for errors

## 🛡️ Security Benefits

- **Enhanced Security**: Protects against password-only attacks
- **Role-based Access**: All roles now have consistent security
- **Industry Standard**: Uses TOTP (Time-based One-Time Password)
- **Compatible**: Works with all major authenticator apps

## 📞 Support

For technical support or to reset 2FA:
- Contact your system administrator
- Check the application logs
- Verify your authenticator app setup

---
*Last updated: September 27, 2025*