const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testAuth = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin123!'
    });
    
    console.log('✅ Login successful!');
    const token = response.data.data.token;
    const user = response.data.data.user;
    console.log('Token:', token.substring(0, 50) + '...');
    console.log('User:', user.username, user.role);
    
    // Test getting leads
    const leadsResponse = await axios.get(`${BASE_URL}/leads`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\n✅ Leads response:', leadsResponse.data);
    if (leadsResponse.data.leads) {
      console.log(`Retrieved ${leadsResponse.data.leads.length} leads`);
      console.log('First lead:', leadsResponse.data.leads[0]?.name || 'No leads found');
    } else {
      console.log('No leads array found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testAuth();