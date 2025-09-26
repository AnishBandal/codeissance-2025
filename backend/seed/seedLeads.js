const mongoose = require('mongoose');
const Lead = require('../src/models/Lead');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const aiScoreService = require('../src/services/aiScoreService');
require('dotenv').config();

// Enhanced sample data matching frontend interface
const sampleLeads = [
  {
    customerName: 'Rajesh Kumar Sharma',
    email: 'rajesh.sharma@email.com',
    phone: '+91-9876543210',
    productType: 'Loan',
    salary: 85000,
    customerIncome: '₹85,000',
    creditScore: 720,
    customerAge: 32,
    customerOccupation: 'Software Engineer',
    loanAmount: '₹15,00,000',
    region: 'Zone-A',
    documents: ['pan_card.pdf', 'salary_slip.pdf', 'bank_statement.pdf']
  },
  {
    customerName: 'Priya Patel',
    email: 'priya.patel@email.com',
    phone: '+91-9876543211',
    productType: 'Credit Card',
    salary: 65000,
    customerIncome: '₹65,000',
    creditScore: 680,
    customerAge: 28,
    customerOccupation: 'Marketing Manager',
    loanAmount: null,
    region: 'Zone-A',
    documents: ['id_proof.pdf', 'income_certificate.pdf']
  },
  {
    customerName: 'Amit Singh',
    email: 'amit.singh@email.com',
    phone: '+91-9876543212',
    productType: 'Mortgage',
    salary: 120000,
    customerIncome: '₹1,20,000',
    creditScore: 750,
    customerAge: 35,
    customerOccupation: 'Senior Manager',
    loanAmount: '₹50,00,000',
    region: 'Zone-B',
    documents: ['property_papers.pdf', 'income_proof.pdf', 'identity_proof.pdf']
  },
  {
    customerName: 'Sneha Reddy',
    email: 'sneha.reddy@email.com',
    phone: '+91-9876543213',
    productType: 'Investment',
    salary: 95000,
    customerIncome: '₹95,000',
    creditScore: 710,
    customerAge: 30,
    customerOccupation: 'Doctor',
    loanAmount: null,
    region: 'Zone-B',
    documents: ['medical_license.pdf', 'bank_statement.pdf']
  },
  {
    customerName: 'Vikram Gupta',
    email: 'vikram.gupta@email.com',
    phone: '+91-9876543214',
    productType: 'Loan',
    salary: 45000,
    customerIncome: '₹45,000',
    creditScore: 620,
    customerAge: 26,
    customerOccupation: 'Sales Executive',
    loanAmount: '₹8,00,000',
    region: 'Zone-A',
    documents: ['salary_certificate.pdf', 'pan_card.pdf']
  },
  {
    customerName: 'Anita Desai',
    email: 'anita.desai@email.com',
    phone: '+91-9876543215',
    productType: 'Account',
    salary: 75000,
    customerIncome: '₹75,000',
    creditScore: 690,
    customerAge: 29,
    customerOccupation: 'Business Analyst',
    loanAmount: null,
    region: 'Zone-A',
    documents: ['identity_proof.pdf', 'address_proof.pdf']
  },
  {
    customerName: 'Ravi Krishnan',
    email: 'ravi.krishnan@email.com',
    phone: '+91-9876543216',
    productType: 'Insurance',
    salary: 55000,
    customerIncome: '₹55,000',
    creditScore: 650,
    customerAge: 42,
    customerOccupation: 'Teacher',
    loanAmount: null,
    region: 'Zone-B',
    documents: ['employment_certificate.pdf', 'medical_reports.pdf']
  },
  {
    customerName: 'Meera Joshi',
    email: 'meera.joshi@email.com',
    phone: '+91-9876543217',
    productType: 'Credit Card',
    salary: 110000,
    customerIncome: '₹1,10,000',
    creditScore: 780,
    customerAge: 38,
    customerOccupation: 'Executive Director',
    loanAmount: null,
    region: 'Zone-A',
    documents: ['executive_certificate.pdf', 'income_statement.pdf', 'bank_statement.pdf']
  },
  {
    customerName: 'Suresh Chandra',
    email: 'suresh.chandra@email.com',
    phone: '+91-9876543218',
    productType: 'Loan',
    salary: 35000,
    customerIncome: '₹35,000',
    creditScore: 580,
    customerAge: 24,
    customerOccupation: 'Junior Developer',
    loanAmount: '₹5,00,000',
    region: 'Zone-B',
    documents: ['offer_letter.pdf', 'pan_card.pdf']
  },
  {
    customerName: 'Kavita Nair',
    email: 'kavita.nair@email.com',
    phone: '+91-9876543219',
    productType: 'Mortgage',
    salary: 140000,
    customerIncome: '₹1,40,000',
    creditScore: 760,
    customerAge: 41,
    customerOccupation: 'Architect',
    loanAmount: '₹75,00,000',
    region: 'Zone-A',
    documents: ['architect_license.pdf', 'property_valuation.pdf', 'income_proof.pdf', 'bank_statement.pdf']
  },
  {
    customerName: 'Deepak Verma',
    email: 'deepak.verma@email.com',
    phone: '+91-9876543220',
    productType: 'Investment',
    salary: 200000,
    customerIncome: '₹2,00,000',
    creditScore: 820,
    customerAge: 45,
    customerOccupation: 'Business Owner',
    loanAmount: null,
    region: 'Zone-B',
    documents: ['business_registration.pdf', 'financial_statements.pdf', 'tax_returns.pdf']
  },
  {
    customerName: 'Sunita Agarwal',
    email: 'sunita.agarwal@email.com',
    phone: '+91-9876543221',
    productType: 'Account',
    salary: 48000,
    customerIncome: '₹48,000',
    creditScore: 640,
    customerAge: 31,
    customerOccupation: 'Nurse',
    loanAmount: null,
    region: 'Zone-A',
    documents: ['nursing_license.pdf', 'employment_letter.pdf']
  },
  {
    customerName: 'Manoj Tiwari',
    email: 'manoj.tiwari@email.com',
    phone: '+91-9876543222',
    productType: 'Loan',
    salary: 68000,
    customerIncome: '₹68,000',
    creditScore: 700,
    customerAge: 33,
    customerOccupation: 'Operations Manager',
    loanAmount: '₹12,00,000',
    region: 'Zone-B',
    documents: ['manager_certificate.pdf', 'salary_slip.pdf', 'bank_statement.pdf']
  },
  {
    customerName: 'Lakshmi Iyer',
    email: 'lakshmi.iyer@email.com',
    phone: '+91-9876543223',
    productType: 'Credit Card',
    salary: 82000,
    customerIncome: '₹82,000',
    creditScore: 730,
    customerAge: 36,
    customerOccupation: 'Consultant',
    loanAmount: null,
    region: 'Zone-A',
    documents: ['consultant_agreement.pdf', 'income_certificate.pdf']
  },
  {
    customerName: 'Rahul Bansal',
    email: 'rahul.bansal@email.com',
    phone: '+91-9876543224',
    productType: 'Insurance',
    salary: 52000,
    customerIncome: '₹52,000',
    creditScore: 660,
    customerAge: 39,
    customerOccupation: 'Accountant',
    loanAmount: null,
    region: 'Zone-B',
    documents: ['ca_certificate.pdf', 'employment_proof.pdf']
  },
  {
    customerName: 'Pooja Mehta',
    email: 'pooja.mehta@email.com',
    phone: '+91-9876543225',
    productType: 'Mortgage',
    salary: 105000,
    customerIncome: '₹1,05,000',
    creditScore: 740,
    customerAge: 34,
    customerOccupation: 'Product Manager',
    loanAmount: '₹60,00,000',
    region: 'Zone-A',
    documents: ['employment_letter.pdf', 'property_agreement.pdf', 'income_proof.pdf']
  },
  {
    customerName: 'Arjun Kapoor',
    email: 'arjun.kapoor@email.com',
    phone: '+91-9876543226',
    productType: 'Investment',
    salary: 175000,
    customerIncome: '₹1,75,000',
    creditScore: 790,
    customerAge: 40,
    customerOccupation: 'Investment Banker',
    loanAmount: null,
    region: 'Zone-B',
    documents: ['banker_certificate.pdf', 'portfolio_statement.pdf', 'income_statement.pdf']
  },
  {
    customerName: 'Neha Saxena',
    email: 'neha.saxena@email.com',
    phone: '+91-9876543227',
    productType: 'Loan',
    salary: 58000,
    customerIncome: '₹58,000',
    creditScore: 670,
    customerAge: 27,
    customerOccupation: 'HR Executive',
    loanAmount: '₹9,00,000',
    region: 'Zone-A',
    documents: ['hr_certificate.pdf', 'salary_slip.pdf']
  },
  {
    customerName: 'Sanjay Rao',
    email: 'sanjay.rao@email.com',
    phone: '+91-9876543228',
    productType: 'Account',
    salary: 92000,
    customerIncome: '₹92,000',
    creditScore: 720,
    customerAge: 37,
    customerOccupation: 'Senior Analyst',
    loanAmount: null,
    region: 'Zone-B',
    documents: ['analyst_certificate.pdf', 'bank_statement.pdf']
  },
  {
    customerName: 'Divya Pillai',
    email: 'divya.pillai@email.com',
    phone: '+91-9876543229',
    productType: 'Credit Card',
    salary: 63000,
    customerIncome: '₹63,000',
    creditScore: 685,
    customerAge: 25,
    customerOccupation: 'Digital Marketer',
    loanAmount: null,
    region: 'Zone-A',
    documents: ['employment_letter.pdf', 'income_certificate.pdf']
  }
];

// Additional status options for variety
const statusOptions = ['New', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Completed'];

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

// Seed leads function with enhanced data
const seedLeads = async () => {
  try {
    console.log('🌱 Starting enhanced lead seeding...');

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

    // Clear existing leads and audit logs
    await Lead.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('🗑️  Cleared existing leads and audit logs');

    const createdLeads = [];
    const auditLogs = [];

    console.log('📊 Generating priority scores and AI insights...');

    // Create leads with enhanced data
    for (let i = 0; i < sampleLeads.length; i++) {
      const leadData = sampleLeads[i];
      
      // Find appropriate creator based on region/zone
      let creator = admin; // Default to admin
      const regionNodalOfficer = nodalOfficers.find(u => u.zone === leadData.region);
      const regionStaff = processingStaff.filter(u => u.zone === leadData.region);
      
      if (Math.random() > 0.6 && regionNodalOfficer) {
        creator = regionNodalOfficer;
      } else if (Math.random() > 0.4 && regionStaff.length > 0) {
        creator = regionStaff[Math.floor(Math.random() * regionStaff.length)];
      }

      // Generate priority score using AI service
      const priorityScore = await aiScoreService.calculatePriorityScore(leadData);
      
      // Generate AI insight
      const aiInsight = await aiScoreService.generateAIInsight(leadData);

      // Create realistic timestamps (last 30 days)
      const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const updatedDate = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);

      // Assign random but realistic status
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      // Create lead with all frontend-compatible fields
      const lead = new Lead({
        ...leadData,
        zone: leadData.region, // Sync zone with region
        createdBy: creator._id,
        priorityScore,
        aiInsight,
        status,
        createdAt: createdDate,
        updatedAt: updatedDate
      });

      // Assign some leads to staff members (60% assignment rate)
      if (Math.random() > 0.4 && regionStaff.length > 0) {
        const assignee = regionStaff[Math.floor(Math.random() * regionStaff.length)];
        lead.assignedTo = assignee._id;
        
        // Add assignment audit trail to the lead
        lead.auditTrail.push({
          action: 'Lead Assigned',
          user: creator._id,
          details: `Assigned to ${assignee.username}`,
          timestamp: new Date(createdDate.getTime() + 60000) // 1 minute after creation
        });

        // Create separate audit log entry
        auditLogs.push({
          leadId: lead._id,
          customerName: lead.customerName,
          action: 'Lead Assigned',
          user: creator._id,
          timestamp: new Date(createdDate.getTime() + 60000),
          details: `Lead assigned to ${assignee.username} for ${lead.productType}`,
          newValue: assignee.username
        });
      }

      // Add status change audit if not "New"
      if (status !== 'New') {
        const statusChangeTime = new Date(createdDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
        
        lead.auditTrail.push({
          action: 'Status Changed',
          user: lead.assignedTo || creator._id,
          details: `Status changed from New to ${status}`,
          timestamp: statusChangeTime
        });

        auditLogs.push({
          leadId: lead._id,
          customerName: lead.customerName,
          action: 'Status Changed',
          user: lead.assignedTo || creator._id,
          timestamp: statusChangeTime,
          details: `Lead status updated to ${status}`,
          oldValue: 'New',
          newValue: status
        });
      }

      await lead.save();
      createdLeads.push(lead);
      
      console.log(`✅ Created lead: ${lead.customerName} (${lead.productType}) - Region: ${lead.region} - Score: ${lead.priorityScore} - Status: ${lead.status}`);
    }

    // Bulk create audit logs
    if (auditLogs.length > 0) {
      await AuditLog.insertMany(auditLogs);
      console.log(`📝 Created ${auditLogs.length} audit log entries`);
    }

    console.log('\n🎉 Enhanced lead seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Total leads created: ${createdLeads.length}`);
    console.log(`   - Zone-A leads: ${createdLeads.filter(l => l.region === 'Zone-A').length}`);
    console.log(`   - Zone-B leads: ${createdLeads.filter(l => l.region === 'Zone-B').length}`);
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

    // Show product type distribution
    const productCounts = {};
    createdLeads.forEach(lead => {
      productCounts[lead.productType] = (productCounts[lead.productType] || 0) + 1;
    });
    console.log('\n🏷️  Product Type Distribution:');
    Object.entries(productCounts).forEach(([product, count]) => {
      console.log(`   - ${product}: ${count}`);
    });

    // Show priority score distribution
    const avgScore = createdLeads.reduce((sum, lead) => sum + lead.priorityScore, 0) / createdLeads.length;
    const highPriority = createdLeads.filter(l => l.priorityScore >= 80).length;
    const mediumPriority = createdLeads.filter(l => l.priorityScore >= 60 && l.priorityScore < 80).length;
    const lowPriority = createdLeads.filter(l => l.priorityScore < 60).length;
    
    console.log('\n⭐ Priority Score Analysis:');
    console.log(`   - Average Score: ${avgScore.toFixed(2)}`);
    console.log(`   - High Priority (80+): ${highPriority}`);
    console.log(`   - Medium Priority (60-79): ${mediumPriority}`);
    console.log(`   - Low Priority (<60): ${lowPriority}`);

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