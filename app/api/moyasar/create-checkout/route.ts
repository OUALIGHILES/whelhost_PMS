import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency = 'SAR',
      description = 'Hotel Booking Payment',
      metadata = {},
      callback_url
    } = await request.json();

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
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

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Perform the API call with enhanced error handling
      response = await fetch(`${apiUrl}payments`, {
        method: 'POST',
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/json',
          'User-Agent': 'WhelHost-Hotel-Reservation-App/1.0'
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to smallest currency unit (e.g., fils for SAR)
          currency,
          description,
          source: {
            type: "url", // Using URL source type to get redirect URL
          },
          metadata: {
            ...metadata,
            created_at: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          },
          callback_url: callback_url || `${process.env.NEXT_PUBLIC_SITE_URL}/api/moyasar/webhook`,
        }),
        signal: controller.signal // Add timeout signal
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

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
        console.error('Request timeout - Moyasar API did not respond within 15 seconds');
        throw new Error('Payment request timed out. Please try again later.');
      } else if (fetchError.message.includes('ENOTFOUND')) {
        console.error('DNS resolution failed - could not find Moyasar API server');
        console.error('This could be due to:');
        console.error('- Incorrect API URL in environment variables');
        console.error('- Network connectivity issues');
        console.error('- DNS resolution problems');
        console.error('- Firewall blocking the API domain');
        throw new Error('Could not connect to Moyasar API (DNS resolution failed). Please check your internet connection and firewall settings.');
      } else if (fetchError.message.includes('ECONNREFUSED')) {
        console.error('Connection refused by Moyasar API server');
        throw new Error('Connection to Moyasar API was refused. Please check your network settings.');
      } else if (fetchError.message.includes('ECONNRESET')) {
        console.error('Connection to Moyasar API was reset');
        throw new Error('Connection to Moyasar API was reset. Please check your network connection.');
      } else if (fetchError.message.includes('fetch failed')) {
        console.error('Generic fetch failure - possible network or certificate issue');
        console.error('This could be due to:');
        console.error('- SSL/TLS certificate issues');
        console.error('- Network connectivity problems');
        console.error('- Proxy or firewall blocking the connection');
        console.error('- Moyasar API service is temporarily unavailable');
        throw new Error('Network error occurred while connecting to Moyasar API. Please verify your network connection and that Moyasar API is accessible from your location.');
      } else if (fetchError.message.includes('ETIMEDOUT')) {
        console.error('Connection to Moyasar API timed out');
        throw new Error('Connection to Moyasar API timed out. Please try again later.');
      } else {
        throw new Error(`Moyasar connection failed: ${fetchError.message}`);
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