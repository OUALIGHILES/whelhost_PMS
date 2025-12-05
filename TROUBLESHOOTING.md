# Troubleshooting Guide

## Common Issues and Solutions

### Supabase Fetch Failed Error

The "fetch failed" error is typically caused by network connectivity issues or misconfigured Supabase credentials. Here are the solutions implemented:

#### 1. Enhanced Error Handling

All Supabase client calls now include proper error handling:

- **Server-side Supabase client** (`lib/supabase/server.ts`): Added cache-control headers and better network error handling
- **Middleware** (`lib/supabase/middleware.ts`): Added try-catch blocks to gracefully handle fetch failures
- **Auth helper** (`lib/auth.ts`): Improved error handling for user validation
- **API routes**: Enhanced error handling for all Supabase operations

#### 2. Configuration

Make sure your `.env.local` contains the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Network Troubleshooting Steps

1. **Check your internet connection**
2. **Verify your Supabase project is active** in the Supabase dashboard
3. **Check firewall settings** - ensure your network allows requests to your Supabase URL
4. **Try accessing Supabase in incognito/private browser mode** to eliminate extension interference

#### 4. Common Causes of Fetch Errors

- Network connectivity issues
- Ad blockers or browser extensions interfering with requests
- Corporate firewalls blocking external requests
- Temporarily unavailable Supabase services
- Incorrect Supabase URL or API keys

#### 5. Testing the Fix

After implementing the fixes:

1. Restart your development server: `npm run dev`
2. Clear browser cache and cookies
3. Try accessing different pages to verify authentication flow works
4. Check browser console and server logs for any remaining errors

### Moyasar Payment Issues

Refer to `MOYASAR_FIXES.md` for specific payment-related fixes.

## Additional Tips

- If you're still experiencing issues, temporarily disable browser extensions that might interfere with network requests
- Check your local proxy settings if working in a corporate environment
- Verify that your Supabase project has row-level security rules properly configured
- Make sure your local timezone settings match the expected format