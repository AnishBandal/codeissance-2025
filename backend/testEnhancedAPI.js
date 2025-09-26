const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testEnhancedAPI = async () => {
  try {
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // Test enhanced lead retrieval
    const leadsResponse = await axios.get(`${BASE_URL}/leads?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const leads = leadsResponse.data.data.leads;
    console.log(`\n📋 Retrieved ${leads.length} leads with enhanced fields:`);
    
    leads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.customerName || lead.name}`);
      console.log(`   📧 Email: ${lead.email}`);
      console.log(`   📱 Phone: ${lead.phone}`);
      console.log(`   🏷️  Product: ${lead.productType}`);
      console.log(`   💰 Income: ${lead.customerIncome || `₹${lead.salary}`}`);
      console.log(`   📊 Credit Score: ${lead.creditScore}`);
      console.log(`   👤 Age: ${lead.customerAge}`);
      console.log(`   💼 Occupation: ${lead.customerOccupation}`);
      console.log(`   🏦 Loan Amount: ${lead.loanAmount || 'N/A'}`);
      console.log(`   🌍 Region: ${lead.region || lead.zone}`);
      console.log(`   📋 Status: ${lead.status}`);
      console.log(`   ⭐ Priority Score: ${lead.priorityScore}`);
      console.log(`   🤖 AI Insight: ${lead.aiInsight?.substring(0, 80)}...`);
      console.log(`   📄 Documents: ${lead.documents?.length || 0} files`);
      console.log(`   📅 Created: ${new Date(lead.createdAt).toLocaleDateString()}`);
    });

    // Test audit logs
    console.log('\n📝 Testing audit logs...');
    const auditResponse = await axios.get(`${BASE_URL}/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const auditLogs = auditResponse.data.data.auditLogs;
    console.log(`\n📋 Retrieved ${auditLogs.length} audit log entries:`);
    
    auditLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.action} - ${log.customerName}`);
      console.log(`   👤 User: ${log.user} (${log.userRole})`);
      console.log(`   🕒 Time: ${new Date(log.timestamp).toLocaleString()}`);
      console.log(`   📝 Details: ${log.details}`);
      if (log.oldValue && log.newValue) {
        console.log(`   🔄 Change: "${log.oldValue}" → "${log.newValue}"`);
      }
    });

    // Test creating a new lead with all fields
    console.log('\n🆕 Testing enhanced lead creation...');
    const newLead = {
      customerName: 'Test Enhanced Lead',
      email: 'test.enhanced@example.com',
      phone: '+91-9999999999',
      productType: 'Loan',
      salary: 75000,
      customerIncome: '₹75,000',
      creditScore: 690,
      customerAge: 29,
      customerOccupation: 'Software Developer',
      loanAmount: '₹10,00,000',
      region: 'Zone-A',
      documents: ['resume.pdf', 'salary_slip.pdf', 'bank_statement.pdf']
    };

    const createResponse = await axios.post(`${BASE_URL}/leads`, newLead, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (createResponse.data.success) {
      const createdLead = createResponse.data.data.lead;
      console.log('✅ Enhanced lead created successfully!');
      console.log(`   🆔 ID: ${createdLead.id}`);
      console.log(`   👤 Name: ${createdLead.customerName}`);
      console.log(`   ⭐ Priority Score: ${createdLead.priorityScore}`);
      console.log(`   🤖 AI Insight: ${createdLead.aiInsight?.substring(0, 100)}...`);
      console.log(`   📄 Documents: ${createdLead.documents?.length} files`);
    }

    console.log('\n🎉 Enhanced API testing completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testEnhancedAPI();