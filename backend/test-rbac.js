// Test script for RBAC system
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials from seed data
const testUsers = {
  admin: { username: 'admin', password: 'Admin123!' },
  nodal_a: { username: 'nodal_zone_a', password: 'Nodal123!' },
  staff: { username: 'staff_alice', password: 'Staff123!' }
};

let tokens = {};

const testRBAC = async () => {
  console.log('🧪 Testing RBAC System...\n');
  
  try {
    // Step 1: Login as each user type
    console.log('1️⃣ Testing Login...');
    for (const [userType, credentials] of Object.entries(testUsers)) {
      try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, credentials);
        tokens[userType] = response.data.data.token;
        console.log(`✅ ${userType} login successful`);
      } catch (error) {
        console.log(`❌ ${userType} login failed:`, error.response?.data?.message);
      }
    }
    
    // Step 2: Test anonymous access (should fail)
    console.log('\n2️⃣ Testing Anonymous Access (should fail)...');
    try {
      await axios.post(`${BASE_URL}/api/auth/create-nodal-officer`, {
        username: 'test',
        password: 'test123',
        zone: 'Zone-C'
      });
      console.log('❌ Anonymous access allowed (SECURITY ISSUE!)');
    } catch (error) {
      console.log('✅ Anonymous access properly blocked');
    }
    
    // Step 3: Test Higher Authority creating Nodal Officer
    console.log('\n3️⃣ Testing Higher Authority Creating Nodal Officer...');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/create-nodal-officer`, {
        username: 'nodal_zone_c',
        password: 'Nodal123!',
        zone: 'Zone-C'
      }, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log('✅ Higher Authority can create Nodal Officer');
      console.log(`   Created: ${response.data.data.user.username} in ${response.data.data.user.zone}`);
    } catch (error) {
      console.log('❌ Higher Authority cannot create Nodal Officer:', error.response?.data?.message);
    }
    
    // Step 4: Test Nodal Officer creating Processing Staff
    console.log('\n4️⃣ Testing Nodal Officer Creating Processing Staff...');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/create-processing-staff`, {
        username: 'staff_new',
        password: 'Staff123!'
      }, {
        headers: { Authorization: `Bearer ${tokens.nodal_a}` }
      });
      console.log('✅ Nodal Officer can create Processing Staff');
      console.log(`   Created: ${response.data.data.user.username} in ${response.data.data.user.zone}`);
    } catch (error) {
      console.log('❌ Nodal Officer cannot create Processing Staff:', error.response?.data?.message);
    }
    
    // Step 5: Test Processing Staff trying to create users (should fail)
    console.log('\n5️⃣ Testing Processing Staff Creating Users (should fail)...');
    try {
      await axios.post(`${BASE_URL}/api/auth/create-nodal-officer`, {
        username: 'should_fail',
        password: 'test123',
        zone: 'Zone-D'
      }, {
        headers: { Authorization: `Bearer ${tokens.staff}` }
      });
      console.log('❌ Processing Staff can create Nodal Officer (SECURITY ISSUE!)');
    } catch (error) {
      console.log('✅ Processing Staff properly blocked from creating Nodal Officer');
    }
    
    try {
      await axios.post(`${BASE_URL}/api/auth/create-processing-staff`, {
        username: 'should_fail_2',
        password: 'test123'
      }, {
        headers: { Authorization: `Bearer ${tokens.staff}` }
      });
      console.log('❌ Processing Staff can create Processing Staff (SECURITY ISSUE!)');
    } catch (error) {
      console.log('✅ Processing Staff properly blocked from creating Processing Staff');
    }
    
    // Step 6: Test audit trail
    console.log('\n6️⃣ Testing Audit Trail...');
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/my-created-users`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log('✅ Audit trail working for Higher Authority');
      console.log(`   Created users count: ${response.data.data.count}`);
    } catch (error) {
      console.log('❌ Audit trail failed:', error.response?.data?.message);
    }
    
    console.log('\n🎉 RBAC Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
if (require.main === module) {
  testRBAC();
}

module.exports = { testRBAC };