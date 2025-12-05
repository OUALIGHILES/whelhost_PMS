import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("RECEIVED PAYLOAD FROM FRONTEND FOR CHECKOUT:", JSON.stringify(body, null, 2));

    const {
      amount,
      currency = 'SAR',
      description = 'Hotel Booking Payment',
      metadata = {},
      callback_url,
      cancel_url, // Added cancel_url as per your requirements
    } = body;

    // Extract source but handle it separately for validation
    let { source = { type: "creditcard" } } = body;

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    // Validate source object structure
    if (!source || typeof source !== 'object' || !source.type) {
      return NextResponse.json(
        { error: 'Source object with type is required. Expected format: { "source": { "type": "creditcard" } }' },
        { status: 400 }
      );
    }

    // Validate that source type is one of the allowed values
    // For redirect-based checkout, we may need to allow 'url' type which doesn't require card details
    const allowedSourceTypes = ['creditcard', 'card', 'applepay', 'googlepay', 'samsungpay', 'stcpay', 'stcdcb', 'token', 'urpay', 'url'];
    if (!allowedSourceTypes.includes(source.type)) {
      return NextResponse.json(
        { error: `Invalid source type: ${source.type}. Allowed types are: ${allowedSourceTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Configuration from environment variables
    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY;
    const apiUrl = process.env.MOYASAR_API_URL ||
      (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? "https://api.sandbox.moyasar.com/v1/"
        : "https://api.moyasar.com/v1/");

    if (!moyasarSecretKey) {
      console.error('MOYASAR_SECRET_KEY is not configured');
      throw new Error('MOYASAR_SECRET_KEY is not configured');
    }

    // Check if using test keys in production, which is a configuration error
    const isUsingTestKey = moyasarSecretKey.startsWith('sk_test_');
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && isUsingTestKey) {
      console.error('Configuration error: Using test key in production environment');
      throw new Error('Configuration error: Cannot use test key in production environment');
    }

    // Validate API URL format
    try {
      new URL(apiUrl);
    } catch (urlError) {
      console.error('Invalid MOYASAR_API_URL:', apiUrl);
      throw new Error('Invalid MOYASAR_API_URL configuration');
    }

    // Create payment with Moyasar API using redirect-based source
    const credentials = `${moyasarSecretKey}:`;
    const encodedCredentials = Buffer.from(credentials).toString('base64'); // Use Buffer instead of btoa for server-side
    const basicAuth = `Basic ${encodedCredentials}`;

    // Add detailed error handling for fetch with timeout and network diagnostics
    let response;
    try {
      console.log(`Attempting to connect to Moyasar API at: ${apiUrl}payments`);
      console.log(`Using credentials starting with: ${moyasarSecretKey.substring(0, 10)}...`);
      console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${apiUrl}`);

      // Configure fetch with additional options for better network handling
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/json',
          'User-Agent': 'WhelHost-Hotel-Reservation-App/1.0',
          // Add headers that may help with network restrictions
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to smallest currency unit (e.g., fils for SAR)
          currency,
          description,
          source, // Use the validated source object from the request
          callback_url: callback_url || `${process.env.NEXT_PUBLIC_SITE_URL}/api/moyasar/webhook`,
          cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
          metadata: {
            ...metadata,
            created_at: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          }
        }),
      };

      // In some restricted environments, we need to handle the request differently
      response = await fetch(`${apiUrl}payments`, fetchOptions);

      console.log(`Moyasar API response status: ${response.status}`);

      // Log the full URL for diagnostics
      console.log(`Full API endpoint: ${apiUrl}payments`);
    } catch (fetchError: any) {
      console.error('Moyasar payment creation fetch error:', fetchError);
      console.error('Detailed error info:', {
        message: fetchError.message,
        name: fetchError.name,
        code: fetchError.code,
        stack: fetchError.stack,
        type: typeof fetchError,
        isTypeError: fetchError.constructor.name,
      });

      // Provide more meaningful error message with network diagnostics
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout - Moyasar API did not respond within the default time');
        throw new Error('Payment request timed out. This could be due to network restrictions. Please contact support or try again later.');
      } else if (fetchError.message.includes('ENOTFOUND')) {
        console.error('DNS resolution failed - could not find Moyasar API server');
        console.error('This could be due to:');
        console.error('- Incorrect API URL in environment variables');
        console.error('- Network connectivity issues');
        console.error('- DNS resolution problems');
        console.error('- Firewall blocking the API domain');
        throw new Error('Could not connect to Moyasar API. This may be due to network restrictions in your hosting environment. Please check with your hosting provider about outbound connection policies.');
      } else if (fetchError.message.includes('ECONNREFUSED')) {
        console.error('Connection refused by Moyasar API server');
        throw new Error('Connection to Moyasar API was refused. This may be due to network restrictions in your hosting environment.');
      } else if (fetchError.message.includes('ECONNRESET')) {
        console.error('Connection to Moyasar API was reset');
        throw new Error('Connection to Moyasar API was reset. This may be due to network restrictions in your hosting environment.');
      } else if (fetchError.message.includes('fetch failed')) {
        console.error('Generic fetch failure - possible network or certificate issue');
        console.error('This could be due to:');
        console.error('- SSL/TLS certificate issues');
        console.error('- Network connectivity problems');
        console.error('- Proxy or firewall blocking the connection');
        console.error('- Moyasar API service is temporarily unavailable');
        console.error('- Hosting environment with restricted outbound connections');

        // Special error message for this specific issue
        throw new Error('Cannot connect to Moyasar API due to network restrictions. This is common in some hosting environments that limit outbound connections to external APIs. Please use the "Payment Link" option instead, which will redirect the user directly to Moyasar securely.');
      } else if (fetchError.message.includes('ETIMEDOUT')) {
        console.error('Connection to Moyasar API timed out');
        throw new Error('Connection to Moyasar API timed out. This may be due to network restrictions in your hosting environment.');
      } else {
        throw new Error(`Moyasar connection failed: ${fetchError.message}. This may be due to network restrictions in your hosting environment. Please use the "Payment Link" option instead.`);
      }
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Moyasar API error:', errorData);
      console.error('Moyasar API status:', response.status);

      // Try to parse JSON error response if possible
      try {
        const errorJson = JSON.parse(errorData);
        console.error('Parsed error from Moyasar API:', errorJson);

        // Check for common authentication or configuration issues
        if (errorJson.type === 'authentication_error') {
          throw new Error(`Authentication failed: ${errorJson.message}. Please check your API keys.`);
        } else if (errorJson.type === 'validation_error') {
          throw new Error(`Validation error: ${errorJson.message}. Please check your request parameters.`);
        } else {
          throw new Error(`Moyasar API error: ${errorJson.message || errorData}`);
        }
      } catch {
        console.error('Could not parse error response as JSON:', errorData);
        throw new Error(`Moyasar API error: ${errorData}`);
      }
    }

    const payment = await response.json();

    // Validate response data
    if (!payment.id || !payment.url) {
      console.error('Invalid response from Moyasar API:', payment);
      throw new Error('Invalid response received from payment gateway');
    }

    // Return the checkout URL for redirect
    return NextResponse.json({
      success: true,
      checkout_url: payment.url, // This is the URL to redirect the customer to
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency
    });
  } catch (error: any) {
    console.error('Moyasar checkout creation error:', error);

    // Log additional system information that might help diagnose network issues
    console.error('System info:', {
      NODE_ENV: process.env.NODE_ENV,
      MOYASAR_API_URL: process.env.MOYASAR_API_URL,
      process_platform: process.platform,
      process_arch: process.arch,
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create checkout session',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}