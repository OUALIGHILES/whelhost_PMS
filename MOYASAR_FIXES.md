# Moyasar Payment Integration Fixes

## Issues Fixed

1. **Buffer vs btoa issue**: Fixed the usage of `btoa()` in server-side code. In Next.js API routes running on the server, `btoa()` is not available. We now use a conditional approach:
   - `btoa()` for browser/client-side code
   - `Buffer.from().toString('base64')` for server-side code

2. **Fetch error handling**: Added proper error handling to catch fetch failures with try-catch blocks around all fetch calls in the Moyasar library.

3. **API route improvements**: Enhanced the `/api/moyasar/create-checkout` route with better error handling for fetch operations.

4. **Enhanced network error diagnostics**: Added comprehensive error handling with specific messages for different types of network errors (ENOTFOUND, ECONNREFUSED, ECONNRESET, ETIMEDOUT, etc.)

5. **Environment-specific API URL**: Updated configuration to automatically use sandbox URL in development and test environments.

6. **Timeout handling**: Implemented configurable timeouts with AbortController to prevent hanging requests.

## Files Modified

- `lib/moyasar.ts`: Fixed all fetch calls with enhanced error handling, timeout support, and conditional base64 encoding
- `app/api/moyasar/create-checkout/route.ts`: Enhanced error handling for the checkout creation API with network diagnostics
- `app/api/payments/moyasar/route.ts`: Added enhanced error logging and diagnostics
- `app/api/moyasar/webhook/route.ts`: Added enhanced error logging for webhook processing
- `lib/moyasar-config.ts`: Added configurable timeout settings

## Environment Variables Required

Make sure to set the following environment variables in your `.env.local` file with REAL Moyasar keys:

```env
MOYASAR_SECRET_KEY=sk_test_your_actual_test_secret_key
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_test_your_actual_test_publishable_key
MOYASAR_API_URL=https://api.sandbox.moyasar.com/v1/  # Use this for testing
MOYASAR_CURRENCY=SAR
MOYASAR_WEBHOOK_SECRET=your_actual_webhook_secret
```

⚠️ **IMPORTANT**: You MUST use actual valid Moyasar API keys from your Moyasar dashboard, not placeholder values. Using placeholder keys will result in the "ENOTFOUND" error.

## Testing the Fix

1. Start the development server:
```bash
npm run dev
```

2. Visit the payment form and try to process a payment. The "fetch failed" error should now be resolved.

3. Check the browser console and server logs for any remaining errors.

## Troubleshooting Network Issues

If you still get "getaddrinfo ENOTFOUND" errors:

1. Verify your internet connection
2. Check that you're using real Moyasar API keys (not placeholder values)
3. Ensure your firewall is not blocking connections to api.sandbox.moyasar.com (for sandbox) or api.moyasar.com (for production)
4. If you're behind a corporate firewall or proxy, you may need to configure it to allow connections to api.sandbox.moyasar.com (for sandbox) or api.moyasar.com (for production)

## Advanced Troubleshooting

If you're still experiencing "fetch failed" errors:

1. **Test network connectivity**: Try accessing `https://api.sandbox.moyasar.com/v1/` (for sandbox) or `https://api.moyasar.com/v1/` (for production) directly in your browser to verify the domain is reachable.

2. **Check for proxy configuration**: If you're on a corporate network, you may need to configure Node.js to work with your proxy:
   ```bash
   # Set proxy environment variables if needed
   export HTTPS_PROXY=http://your-proxy-server:port
   export HTTP_PROXY=http://your-proxy-server:port
   ```

3. **Verify API key format**: Make sure your secret key begins with `sk_test_` and your publishable key begins with `pk_test_`.

4. **Check for certificate issues**: Some networks may have SSL/TLS certificate issues with external APIs.

5. **Sandbox endpoint resolution**: If `api.sandbox.moyasar.com` doesn't resolve on your network, this is normal in some corporate environments. The application will automatically use the appropriate API URL based on your environment variables and NODE_ENV setting.

## Notes

- The fix ensures compatibility both on the server-side (Next.js API routes) and client-side (browser)
- Proper error messages will now be returned instead of generic "fetch failed" errors
- The application now gracefully handles network failures and other fetch-related errors
- Network diagnostics and enhanced logging help identify specific issues when they occur