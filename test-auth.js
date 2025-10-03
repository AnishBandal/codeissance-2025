// Test authentication script
const axios = require('axios');

const testAuth = async () => {
  console.log('🧪 Testing Authentication...\n');
  
  try {
    // Step 1: Test if backend is running
    console.log('1. Testing backend connection...');
    try {
      const healthCheck = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message);
      return;
    }
    
    // Step 2: Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'staff_alice@example.com', // Default test user
      password: 'Staff123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('👤 User:', loginResponse.data.data?.user?.username);
      console.log('🔑 Token received:', !!loginResponse.data.data?.token);
      
      const token = loginResponse.data.data?.token;
      
      // Step 3: Test authenticated request
      console.log('\n3. Testing authenticated lead creation...');
      const leadData = {
        customerName: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        productType: 'Personal Loan',
        loanAmount: 100000,
        customerAge: 30,
        customerOccupation: 'Software Engineer',
        customerIncome: '50000',
        salary: 50000,
        creditScore: 750,
        region: 'Zone A',
        status: 'New'
      };
      
      const leadResponse = await axios.post('http://localhost:5000/api/leads', leadData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (leadResponse.data.success) {
        console.log('✅ Lead creation successful');
        console.log('📄 Lead ID:', leadResponse.data.data?.lead?._id);
      } else {
        console.log('❌ Lead creation failed:', leadResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('🔒 Authentication issue - check token or login credentials');
    }
  }
};

testAuth();