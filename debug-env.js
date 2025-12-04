// debug-env.js - Debug script to check environment variables
console.log('🔍 Debug: Environment Variables Check');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MOYASAR_API_URL:', process.env.MOYASAR_API_URL);
console.log('MOYASAR_SECRET_KEY exists:', !!process.env.MOYASAR_SECRET_KEY);
console.log('Using default for development:', process.env.NODE_ENV === 'development' ? 'https://api.sandbox.moyasar.com/v1/' : 'https://api.moyasar.com/v1/');

const config = {
  secretKey: process.env.MOYASAR_SECRET_KEY,
  apiUrl: process.env.MOYASAR_API_URL || (process.env.NODE_ENV === 'development' ? 'https://api.sandbox.moyasar.com/v1/' : 'https://api.moyasar.com/v1/'),
};

console.log('\nComputed apiUrl:', config.apiUrl);