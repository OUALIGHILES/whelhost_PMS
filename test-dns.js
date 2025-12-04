// test-dns.js - Test DNS resolution for Moyasar API
const dns = require('dns');
const https = require('https');

async function testDNS() {
  console.log('🔍 Testing DNS resolution for Moyasar API...\n');
  
  const hostnames = [
    'api.sandbox.moyasar.com',
    'api.moyasar.com',
    'google.com' // Control test
  ];
  
  for (const hostname of hostnames) {
    console.log(`Testing DNS resolution for: ${hostname}`);
    try {
      const addresses = await new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      console.log(`  ✅ Resolved to: ${addresses}`);
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\nTesting HTTPS connectivity to google.com (control test)...');
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request('https://google.com', {
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
    
    console.log(`  ✅ Google.com connection successful (Status: ${response.statusCode})`);
  } catch (error) {
    console.log(`  ❌ Google.com connection failed: ${error.message}`);
  }
}

testDNS().catch(console.error);