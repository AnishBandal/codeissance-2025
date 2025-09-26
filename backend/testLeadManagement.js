const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const testUsers = {
  admin: {
    username: 'admin',
    password: 'Admin123!'
  },
  nodalOfficer: {
    username: 'nodal_zone_a',
    password: 'Nodal123!'
  },
  processingStaff: {
    username: 'staff_alice',
    password: 'Staff123!'
  }
};

let tokens = {};

// Utility function for API calls
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// Login function
const loginUser = async (username, password) => {
  console.log(`\n🔐 Logging in as ${username}...`);
  const result = await apiCall('POST', '/auth/login', { username, password });
  
  if (result.success) {
    console.log(`✅ Login successful for ${username}`);
    return result.data.data.token; // Fixed token path
  } else {
    console.log(`❌ Login failed for ${username}:`, result.error);
    return null;
  }
};

// Test authentication for all users
const testAuthentication = async () => {
  console.log('🔒 Testing Authentication...');
  
  for (const [role, credentials] of Object.entries(testUsers)) {
    const token = await loginUser(credentials.username, credentials.password);
    if (token) {
      tokens[role] = token;
    }
  }
  
  console.log(`\n📊 Authentication Summary: ${Object.keys(tokens).length}/${Object.keys(testUsers).length} users logged in successfully`);
};

// Test lead creation
const testLeadCreation = async () => {
  console.log('\n📝 Testing Lead Creation...');
  
  const testLead = {
    name: 'Test Lead',
    email: 'test.lead@email.com',
    phone: '+1234567999',
    productType: 'Loan',
    salary: 80000,
    creditScore: 700,
    zone: 'Zone-A'
  };

  // Test with different roles
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\n👤 Testing lead creation as ${role}...`);
    const result = await apiCall('POST', '/leads', testLead, token);
    
    if (result.success) {
      console.log(`✅ Lead created successfully by ${role}`);
      console.log(`   Lead ID: ${result.data.data.lead._id}`);
      console.log(`   Priority Score: ${result.data.data.lead.priorityScore}`);
    } else {
      console.log(`❌ Lead creation failed by ${role}:`, result.error);
    }
  }
};

// Test lead retrieval with role-based filtering
const testLeadRetrieval = async () => {
  console.log('\n📋 Testing Lead Retrieval with Role-Based Filtering...');
  
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\n👤 Testing lead retrieval as ${role}...`);
    const result = await apiCall('GET', '/leads', null, token);
    
    if (result.success) {
      const leads = result.data.data.leads;
      const pagination = result.data.data.pagination;
      console.log(`✅ Retrieved ${leads.length} leads for ${role}`);
      console.log(`   Total leads: ${pagination.totalLeads}`);
      console.log(`   Current page: ${pagination.currentPage}`);
      
      // Show first few leads
      if (leads.length > 0) {
        console.log('   Sample leads:');
        leads.slice(0, 3).forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.name} - ${lead.productType} - ${lead.status} - Zone: ${lead.zone}`);
        });
      }
    } else {
      console.log(`❌ Lead retrieval failed for ${role}:`, result.error);
    }
  }
};

// Test lead filtering and pagination
const testLeadFiltering = async () => {
  console.log('\n🔍 Testing Lead Filtering and Pagination...');
  
  const adminToken = tokens.admin;
  
  if (!adminToken) {
    console.log('❌ Admin token not available for filtering tests');
    return;
  }

  // Test status filtering
  console.log('\n📊 Testing status filtering...');
  const statusResult = await apiCall('GET', '/leads?status=New', null, adminToken);
  if (statusResult.success) {
    console.log(`✅ Found ${statusResult.data.data.leads.length} leads with status 'New'`);
  }

  // Test product type filtering
  console.log('\n🏷️  Testing product type filtering...');
  const productResult = await apiCall('GET', '/leads?productType=Loan', null, adminToken);
  if (productResult.success) {
    console.log(`✅ Found ${productResult.data.data.leads.length} leads with product type 'Loan'`);
  }

  // Test zone filtering
  console.log('\n🌍 Testing zone filtering...');
  const zoneResult = await apiCall('GET', '/leads?zone=Zone-A', null, adminToken);
  if (zoneResult.success) {
    console.log(`✅ Found ${zoneResult.data.data.leads.length} leads in 'Zone-A'`);
  }

  // Test pagination
  console.log('\n📄 Testing pagination...');
  const pageResult = await apiCall('GET', '/leads?page=1&limit=3', null, adminToken);
  if (pageResult.success) {
    console.log(`✅ Retrieved page 1 with ${pageResult.data.data.leads.length} leads (limit: 3)`);
    console.log(`   Total pages: ${pageResult.data.data.pagination.totalPages}`);
  }

  // Test sorting
  console.log('\n🔢 Testing sorting by priority score...');
  const sortResult = await apiCall('GET', '/leads?sortBy=priorityScore&sortOrder=desc', null, adminToken);
  if (sortResult.success) {
    console.log(`✅ Retrieved leads sorted by priority score (descending)`);
    if (sortResult.data.data.leads.length > 0) {
      console.log(`   Highest score: ${sortResult.data.data.leads[0].priorityScore}`);
      console.log(`   Lowest score: ${sortResult.data.data.leads[sortResult.data.data.leads.length - 1].priorityScore}`);
    }
  }
};

// Test lead updates
const testLeadUpdates = async () => {
  console.log('\n✏️  Testing Lead Updates...');
  
  // First, get a lead to update
  const adminToken = tokens.admin;
  if (!adminToken) {
    console.log('❌ Admin token not available for update tests');
    return;
  }

  const leadsResult = await apiCall('GET', '/leads?limit=1', null, adminToken);
  if (!leadsResult.success || leadsResult.data.data.leads.length === 0) {
    console.log('❌ No leads available for update testing');
    return;
  }

  const leadId = leadsResult.data.data.leads[0]._id;
  console.log(`🎯 Testing updates on lead: ${leadId}`);

  // Test status update
  console.log('\n📊 Testing status update...');
  const statusUpdate = {
    status: 'In Progress',
    notes: 'Lead contacted and showing interest'
  };
  
  const updateResult = await apiCall('PUT', `/leads/${leadId}`, statusUpdate, adminToken);
  if (updateResult.success) {
    console.log('✅ Lead status updated successfully');
    console.log(`   New status: ${updateResult.data.data.lead.status}`);
    console.log(`   Audit trail entries: ${updateResult.data.data.lead.auditTrail.length}`);
  } else {
    console.log('❌ Lead status update failed:', updateResult.error);
  }

  // Test assignment
  console.log('\n👥 Testing lead assignment...');
  
  // Get processing staff for assignment
  const usersResult = await apiCall('GET', '/users/my-created-users', null, adminToken);
  if (usersResult.success) {
    const processingStaff = usersResult.data.data.users.filter(u => u.role === 'Processing Staff');
    
    if (processingStaff.length > 0) {
      const assignmentUpdate = {
        assignedTo: processingStaff[0]._id,
        notes: 'Assigned to processing staff for follow-up'
      };
      
      const assignResult = await apiCall('PUT', `/leads/${leadId}`, assignmentUpdate, adminToken);
      if (assignResult.success) {
        console.log('✅ Lead assigned successfully');
        console.log(`   Assigned to: ${processingStaff[0].username}`);
      } else {
        console.log('❌ Lead assignment failed:', assignResult.error);
      }
    }
  }
};

// Test lead deletion (admin only)
const testLeadDeletion = async () => {
  console.log('\n🗑️  Testing Lead Deletion...');
  
  const adminToken = tokens.admin;
  if (!adminToken) {
    console.log('❌ Admin token not available for deletion tests');
    return;
  }

  // Create a test lead first
  const testLead = {
    name: 'Delete Test Lead',
    email: 'delete.test@email.com',
    phone: '+1234567000',
    productType: 'Credit Card',
    salary: 50000,
    creditScore: 650,
    zone: 'Zone-A'
  };

  const createResult = await apiCall('POST', '/leads', testLead, adminToken);
  if (!createResult.success) {
    console.log('❌ Failed to create test lead for deletion');
    return;
  }

  const leadId = createResult.data.data.lead._id;
  console.log(`🎯 Created test lead for deletion: ${leadId}`);

  // Test deletion with different roles
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\n👤 Testing deletion as ${role}...`);
    
    if (role === 'admin') {
      const deleteResult = await apiCall('DELETE', `/leads/${leadId}`, null, token);
      if (deleteResult.success) {
        console.log(`✅ Lead deleted successfully by ${role}`);
        break; // Lead is deleted, can't test with other roles
      } else {
        console.log(`❌ Lead deletion failed by ${role}:`, deleteResult.error);
      }
    } else {
      const deleteResult = await apiCall('DELETE', `/leads/${leadId}`, null, token);
      if (!deleteResult.success && deleteResult.status === 403) {
        console.log(`✅ Deletion properly blocked for ${role} (403 Forbidden)`);
      } else {
        console.log(`❌ Unexpected result for ${role}:`, deleteResult);
      }
    }
  }
};

// Test lead statistics
const testLeadStatistics = async () => {
  console.log('\n📈 Testing Lead Statistics...');
  
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`\n👤 Testing statistics as ${role}...`);
    const result = await apiCall('GET', '/leads/stats', null, token);
    
    if (result.success) {
      console.log(`✅ Statistics retrieved for ${role}:`);
      console.log(`   Total leads: ${result.data.data.totalLeads}`);
      console.log(`   Status breakdown:`, result.data.data.statusBreakdown);
      console.log(`   Product type breakdown:`, result.data.data.productTypeBreakdown);
      console.log(`   Average priority score: ${result.data.data.averagePriorityScore?.toFixed(2)}`);
    } else {
      console.log(`❌ Statistics retrieval failed for ${role}:`, result.error);
    }
  }
};

// Main test runner
const runLeadTests = async () => {
  console.log('🚀 Starting Lead Management API Tests...\n');
  console.log('========================================');
  
  try {
    // Test authentication first
    await testAuthentication();
    
    if (Object.keys(tokens).length === 0) {
      console.log('❌ No users authenticated. Cannot proceed with tests.');
      return;
    }

    // Run all lead management tests
    await testLeadCreation();
    await testLeadRetrieval();
    await testLeadFiltering();
    await testLeadUpdates();
    await testLeadDeletion();
    await testLeadStatistics();

    console.log('\n========================================');
    console.log('🎉 Lead Management API Tests Completed!');
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Tests interrupted');
  process.exit(0);
});

// Run tests if called directly
if (require.main === module) {
  runLeadTests();
}

module.exports = { runLeadTests, apiCall, testUsers };