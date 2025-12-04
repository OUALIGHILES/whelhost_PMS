// test-moyasar-network.js - Network connectivity test for Moyasar API
const https = require('https');
const http = require('http');
const { URL } = require('url');

const config = {
  secretKey: process.env.MOYASAR_SECRET_KEY,
  apiUrl: process.env.MOYASAR_API_URL || 'https://api.moyasar.com/v1/',
  publishableKey: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY,
};

async function testMoyasarConnectivity() {
  console.log('🔍 Testing Moyasar API connectivity...\n');

  // 1. Check environment variables
  console.log('📋 Environment Variable Check:');
  if (!config.secretKey) {
    console.log('  ❌ MOYASAR_SECRET_KEY is not set');
  } else {
    console.log('  ✅ MOYASAR_SECRET_KEY is set');
  }

  if (!config.publishableKey) {
    console.log('  ❌ NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY is not set');
  } else {
    console.log('  ✅ NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY is set');
  }

  console.log('\n  Endpoint URL:', config.apiUrl);

  // 2. Parse the API URL
  try {
    const parsedUrl = new URL(config.apiUrl);
    console.log('\n🌐 URL Parsing:', {
      protocol: parsedUrl.protocol,
      host: parsedUrl.host,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname
    });

    // 3. Test DNS resolution
    console.log('\n🔍 Testing DNS Resolution...');
    const dns = require('dns');

    const resolvedAddresses = await new Promise((resolve, reject) => {
      dns.lookup(parsedUrl.hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('  ✅ DNS Resolution successful:', resolvedAddresses);
  } catch (err) {
    console.log('\n❌ Error in URL parsing or DNS resolution:', err.message);
    return;
  }

  // 4. Test raw HTTPS request
  console.log('\n📡 Testing Raw HTTPS Request...');
  try {
    const testUrl = new URL(config.apiUrl);

    const options = {
      hostname: testUrl.hostname,
      port: 443,
      path: testUrl.pathname + 'health', // Check health endpoint if available
      method: 'GET',
      headers: {
        'User-Agent': 'Moyasar-Connectivity-Test/1.0',
        'Accept': 'application/json',
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

    console.log('  ✅ Raw HTTPS Request successful');
    console.log('    Status:', response.statusCode);
    console.log('    Response length:', response.data.length, 'bytes');
  } catch (err) {
    console.log('  ❌ Raw HTTPS Request failed:', err.message);
  }

  // 5. Test payment creation with detailed diagnostics
  if (config.secretKey) {
    console.log('\n💳 Testing Payment Creation (with sample data)...');

    const credentials = Buffer.from(`${config.secretKey}:`).toString('base64');
    const basicAuth = `Basic ${credentials}`;

    // Mock minimal payment data for testing connectivity
    const paymentData = {
      amount: 1000, // 10 SAR in fils
      currency: 'SAR',
      description: 'Test payment for connectivity check',
      source: {
        type: 'url',
      },
      metadata: {
        test: 'connectivity-check',
        timestamp: new Date().toISOString()
      }
    };

    try {
      console.log('  Attempting payment creation request...');
      console.log('  Using API Key prefix:', config.secretKey.substring(0, 10) + '...');

      const testUrl = new URL(config.apiUrl);
      const options = {
        hostname: testUrl.hostname,
        port: 443,
        path: testUrl.pathname + 'payments',
        method: 'POST',
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/json',
          'Content-Length': JSON.stringify(paymentData).length,
          'User-Agent': 'Moyasar-Connectivity-Test/1.0',
        },
        timeout: 15000,
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
          reject(new Error('Payment creation request timeout'));
        });

        req.write(JSON.stringify(paymentData));
        req.end();
      });

      console.log('  ✅ Payment Creation Request completed');
      console.log('    Status:', response.statusCode);
      console.log('    Response length:', response.data.length, 'bytes');

      if (response.statusCode >= 400) {
        console.log('    Response body:', response.data.substring(0, 200) + '...');
      }
    } catch (err) {
      console.log('  ❌ Payment Creation Request failed:', err.message);
      if (err.code) {
        console.log('    Error code:', err.code);
      }
    }
  }

  console.log('\n✅ Connectivity test completed');

  if (!config.secretKey) {
    console.log('\n💡 To run a complete test, set your MOYASAR_SECRET_KEY environment variable');
  }
}

// Run the test
testMoyasarConnectivity().catch(console.error);