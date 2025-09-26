const mongoose = require('mongoose');
const Lead = require('./src/models/Lead');
const User = require('./src/models/User');
require('dotenv').config();

// Sample lead data for testing
const sampleLeads = [
  {
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1234567890',
    productType: 'Loan',
    salary: 75000,
    creditScore: 720,
    zone: 'Zone-A'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1234567891',
    productType: 'Credit Card',
    salary: 55000,
    creditScore: 680,
    zone: 'Zone-A'
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@email.com',
    phone: '+1234567892',
    productType: 'Account',
    salary: 90000,
    creditScore: 750,
    zone: 'Zone-B'
  },
  {
    name: 'Alice Brown',
    email: 'alice.brown@email.com',
    phone: '+1234567893',
    productType: 'Insurance',
    salary: 65000,
    creditScore: 650,
    zone: 'Zone-B'
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie.wilson@email.com',
    phone: '+1234567894',
    productType: 'Loan',
    salary: 120000,
    creditScore: 780,
    zone: 'Zone-A'
  },
  {
    name: 'Diana Davis',
    email: 'diana.davis@email.com',
    phone: '+1234567895',
    productType: 'Credit Card',
    salary: 45000,
    creditScore: 620,
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

// Seed leads function
const seedLeads = async () => {
  try {
    console.log('🌱 Starting lead seeding...');

    // Get existing users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('❌ No users found. Please run user seeding first.');
      return;
    }

    const admin = users.find(u => u.role === 'Higher Authority');
    const nodalOfficers = users.filter(u => u.role === 'Nodal Officer');
    const processingStaff = users.filter(u => u.role === 'Processing Staff');

    if (!admin || nodalOfficers.length === 0) {
      console.log('❌ Required user roles not found. Please seed users first.');
      return;
    }

    // Clear existing leads
    await Lead.deleteMany({});
    console.log('🗑️  Cleared existing leads');

    const createdLeads = [];

    // Create leads with proper assignments
    for (let i = 0; i < sampleLeads.length; i++) {
      const leadData = sampleLeads[i];
      
      // Find a creator based on zone
      let creator = admin; // Default to admin
      const zoneNodalOfficer = nodalOfficers.find(u => u.zone === leadData.zone);
      const zoneStaff = processingStaff.filter(u => u.zone === leadData.zone);
      
      if (Math.random() > 0.5 && zoneNodalOfficer) {
        creator = zoneNodalOfficer;
      } else if (Math.random() > 0.3 && zoneStaff.length > 0) {
        creator = zoneStaff[Math.floor(Math.random() * zoneStaff.length)];
      }

      // Create lead with fallback priority score (since ML service might not be running)
      const lead = new Lead({
        ...leadData,
        createdBy: creator._id,
        priorityScore: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
        status: i < 2 ? 'New' : (i < 4 ? 'In Progress' : 'Converted')
      });

      // Assign some leads to staff members
      if (i % 2 === 0 && zoneStaff.length > 0) {
        const assignee = zoneStaff[Math.floor(Math.random() * zoneStaff.length)];
        lead.assignedTo = assignee._id;
        
        // Add assignment audit trail
        lead.auditTrail.push({
          action: 'Lead Assigned',
          user: creator._id,
          details: `Assigned to ${assignee.username}`,
          timestamp: new Date()
        });
      }

      await lead.save();
      createdLeads.push(lead);
      
      console.log(`✅ Created lead: ${lead.name} (${lead.productType}) - Zone: ${lead.zone} - Score: ${lead.priorityScore}`);
    }

    console.log('\n🎉 Lead seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total leads created: ${createdLeads.length}`);
    console.log(`   - Zone-A leads: ${createdLeads.filter(l => l.zone === 'Zone-A').length}`);
    console.log(`   - Zone-B leads: ${createdLeads.filter(l => l.zone === 'Zone-B').length}`);
    console.log(`   - Assigned leads: ${createdLeads.filter(l => l.assignedTo).length}`);
    console.log(`   - Unassigned leads: ${createdLeads.filter(l => !l.assignedTo).length}`);

    // Show status distribution
    const statusCounts = {};
    createdLeads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });
    console.log('\n📈 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding leads:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
const runLeadSeeder = async () => {
  await connectDB();
  await seedLeads();
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Lead seeding interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  runLeadSeeder();
}

module.exports = { seedLeads, sampleLeads };