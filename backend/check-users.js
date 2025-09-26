// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config/env');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({}).select('username role twoFactorEnabled');
    
    console.log('📋 Available users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - 2FA: ${user.twoFactorEnabled}`);
    });

    mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

checkUsers();