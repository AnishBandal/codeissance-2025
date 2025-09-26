const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

// Sample users data
const sampleUsers = [
  {
    username: 'admin',
    password: 'Admin123!',
    role: 'Higher Authority',
    zone: null
  },
  {
    username: 'nodal_zone_a',
    password: 'Nodal123!',
    role: 'Nodal Officer',
    zone: 'Zone-A'
  },
  {
    username: 'nodal_zone_b',
    password: 'Nodal123!',
    role: 'Nodal Officer',
    zone: 'Zone-B'
  },
  {
    username: 'staff_alice',
    password: 'Staff123!',
    role: 'Processing Staff',
    zone: 'Zone-A'
  },
  {
    username: 'staff_bob',
    password: 'Staff123!',
    role: 'Processing Staff',
    zone: 'Zone-A'
  },
  {
    username: 'staff_charlie',
    password: 'Staff123!',
    role: 'Processing Staff',
    zone: 'Zone-B'
  },
  {
    username: 'staff_diana',
    password: 'Staff123!',
    role: 'Processing Staff',
    zone: 'Zone-B'
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://darshanjain24:december912@cluster0.il5ni.mongodb.net/leadvault';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed database function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing users (optional - comment out if you want to keep existing data)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create users with relationships
    const createdUsers = [];

    // First create Higher Authority
    const admin = new User(sampleUsers[0]);
    await admin.save();
    createdUsers.push(admin);
    console.log(`✅ Created Higher Authority: ${admin.username}`);

    // Create Nodal Officers (created by Higher Authority)
    for (let i = 1; i <= 2; i++) {
      const nodalUser = new User({
        ...sampleUsers[i],
        createdBy: admin._id
      });
      await nodalUser.save();
      createdUsers.push(nodalUser);
      console.log(`✅ Created Nodal Officer: ${nodalUser.username} (Zone: ${nodalUser.zone})`);
    }

    // Create Processing Staff (created by respective Nodal Officers)
    const nodalZoneA = createdUsers.find(u => u.username === 'nodal_zone_a');
    const nodalZoneB = createdUsers.find(u => u.username === 'nodal_zone_b');

    // Zone-A staff
    for (let i = 3; i <= 4; i++) {
      const staffUser = new User({
        ...sampleUsers[i],
        createdBy: nodalZoneA._id
      });
      await staffUser.save();
      createdUsers.push(staffUser);
      console.log(`✅ Created Processing Staff: ${staffUser.username} (Zone: ${staffUser.zone})`);
    }

    // Zone-B staff
    for (let i = 5; i <= 6; i++) {
      const staffUser = new User({
        ...sampleUsers[i],
        createdBy: nodalZoneB._id
      });
      await staffUser.save();
      createdUsers.push(staffUser);
      console.log(`✅ Created Processing Staff: ${staffUser.username} (Zone: ${staffUser.zone})`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Higher Authority: 1 user`);
    console.log(`   - Nodal Officers: 2 users (Zone-A, Zone-B)`);
    console.log(`   - Processing Staff: 4 users (2 per zone)`);
    console.log(`   - Total users created: ${createdUsers.length}`);

    console.log('\n🔐 Login Credentials:');
    console.log('Higher Authority:');
    console.log('  Username: admin | Password: Admin123!');
    console.log('\nNodal Officers:');
    console.log('  Username: nodal_zone_a | Password: Nodal123! | Zone: Zone-A');
    console.log('  Username: nodal_zone_b | Password: Nodal123! | Zone: Zone-B');
    console.log('\nProcessing Staff:');
    console.log('  Username: staff_alice | Password: Staff123! | Zone: Zone-A');
    console.log('  Username: staff_bob | Password: Staff123! | Zone: Zone-A');
    console.log('  Username: staff_charlie | Password: Staff123! | Zone: Zone-B');
    console.log('  Username: staff_diana | Password: Staff123! | Zone: Zone-B');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Seeding interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedDatabase, sampleUsers };