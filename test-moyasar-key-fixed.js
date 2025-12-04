// test-moyasar-key-fixed.js - Test script to verify Moyasar API key validity with proper dotenv loading
require('dotenv').config(); // Load environment variables from .env files

const https = require('https');
const { Buffer } = require('buffer');

const config = {
  secretKey: process.env.MOYASAR_SECRET_KEY,
  apiUrl: process.env.MOYASAR_API_URL || (process.env.NODE_ENV === 'development' ? 'https://api.sandbox.moyasar.com/v1/' : 'https://api.moyasar.com/v1/'),
};

async function testApiKey() {
  console.log('🔍 Testing Moyasar API key validity...\n');
  
  // Check if API key is provided
  if (!config.secretKey) {
    console.log('❌ MOYASAR_SECRET_KEY is not set in environment variables');
    console.log('   Please set your Moyasar secret key in .env.local file');
    console.log('   Example: MOYASAR_SECRET_KEY=sk_test_your_actual_key_here');
    return;
  }

  console.log(`📋 Using secret key prefix: ${config.secretKey.substring(0, 10)}...`);
  console.log(`🔗 API endpoint: ${config.apiUrl}\n`);

  // Validate key format
  if (!config.secretKey.startsWith('sk_test_') && !config.secretKey.startsWith('sk_live_')) {
    console.log('❌ Secret key format is invalid');
    console.log('   Secret keys should start with either "sk_test_" (for test) or "sk_live_" (for live)');
    return;
  }

  console.log(`✅ Key format is valid (starts with "${config.secretKey.substring(0, 8)}")`);

  // Test API connectivity by making a simple request
  try {
    console.log('\n📡 Testing API connectivity...');
    
    const credentials = Buffer.from(`${config.secretKey}:`).toString('base64');
    const basicAuth = `Basic ${credentials}`;
    
    const url = new URL(config.apiUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + 'payments',
      method: 'GET', // Use GET to list payments (won't charge anything)
      headers: {
        'Authorization': basicAuth,
        'Accept': 'application/json',
        'User-Agent': 'Moyasar-Key-Validator/1.0',
      },
      timeout: 10000,
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });

    if (response.statusCode === 200) {
      console.log('✅ API key is valid and authenticated successfully');
      try {
        const payments = JSON.parse(response.data);
        console.log(`   Found ${payments.count || payments.length || 'unknown'} payments in your account`);
      } catch (parseErr) {
        console.log('   Response received but could not parse payment list');
      }
    } else if (response.statusCode === 401) {
      console.log('❌ API key is invalid or unauthorized');
      console.log('   Please check that your Moyasar secret key is correct');
    } else if (response.statusCode === 403) {
      console.log('❌ Access forbidden - check your API key permissions');
    } else {
      console.log(`⚠️  API responded with status: ${response.statusCode}`);
      console.log('   Response:', response.data.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ API connectivity test failed:', err.message);
    if (err.code) {
      console.log('   Error code:', err.code);
    }
  }

  console.log('\n💡 Tips:');
  console.log('   - Make sure your key starts with "sk_test_" for testing or "sk_live_" for production');
  console.log('   - Ensure you are using the correct environment (sandbox vs live)');
  console.log('   - Check your internet connection if connectivity fails');
}

testApiKey().catch(console.error);