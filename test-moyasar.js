// test-moyasar.js - Simple test script to verify Moyasar functionality
const https = require('https');

// Test configuration - Only use environment variables, no hardcoded defaults
const config = {
  secretKey: process.env.MOYASAR_SECRET_KEY,
  apiUrl: process.env.MOYASAR_API_URL || (process.env.NODE_ENV === 'development' ? 'https://api-test.moyasar.com/v1/' : 'https://api.moyasar.com/v1/'),
  publishableKey: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY,
};

console.log('Testing Moyasar configuration...');
console.log('API URL:', config.apiUrl);

// Check environment variables
if (!process.env.MOYASAR_SECRET_KEY) {
  console.log('\n⚠️  WARNING: MOYASAR_SECRET_KEY environment variable is not set');
  console.log('Please set this in your .env file to test payment functionality');
} else {
  console.log('\n✓ MOYASAR_SECRET_KEY environment variable is set');
  console.log('Key (first 10 chars):', config.secretKey.substring(0, 10));
}

if (!process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY) {
  console.log('⚠️  WARNING: NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY environment variable is not set');
  console.log('Please set this in your .env file to test payment functionality');
} else {
  console.log('✓ NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY environment variable is set');
  console.log('Key (first 10 chars):', config.publishableKey.substring(0, 10));
}

// Function to create basic auth header (browser-compatible version)
function createBasicAuth() {
  if (!config.secretKey) {
    throw new Error('MOYASAR_SECRET_KEY is not set');
  }
  const credentials = `${config.secretKey}:`;
  return `Basic ${btoa(credentials)}`;
}

// Test payment creation function (for Node.js environment)
function createBasicAuthNode(secretKey) {
  if (!secretKey) {
    throw new Error('Secret key is required');
  }
  const credentials = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${credentials}`;
}

// Test the API endpoint structure
console.log('\nTesting API endpoint access...');
console.log('Expected payment creation endpoint:', config.apiUrl + 'payments');
console.log('Expected payment retrieval endpoint:', config.apiUrl + 'payments/{id}');

// Test authentication header creation
if (config.secretKey) {
  console.log('\nTesting authentication header creation...');
  try {
    // In browser environment we would use btoa(), but in Node.js we need Buffer
    const credentials = Buffer.from(`${config.secretKey}:`).toString('base64');
    const basicAuth = `Basic ${credentials}`;
    console.log('✓ Authentication header created successfully');
    console.log('Auth header (first 20 chars):', basicAuth.substring(0, 20) + '...');
  } catch (error) {
    console.log('✗ Error creating authentication header:', error.message);
  }
} else {
  console.log('\n⚠️  Cannot test authentication header - secret key not provided');
}

console.log('\nMoyasar payment integration test completed.');
console.log('Note: This is a basic configuration check. For full functionality test:');
console.log('1. Start your Next.js server with `npm run dev`');
console.log('2. Visit http://localhost:3000/test-moyasar');
console.log('3. Try the payment creation test to verify the API endpoints work');
console.log('\nFor testing, make sure to set your test keys in the .env file:');
console.log('MOYASAR_SECRET_KEY=sk_test_...your_test_key...');
console.log('NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_test_...your_test_key...');