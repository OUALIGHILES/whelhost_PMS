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
      cancel_url,
    } = body;

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

    // Check if using test keys in production
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

    // Create payment with Moyasar API
    const credentials = `${moyasarSecretKey}:`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    const basicAuth = `Basic ${encodedCredentials}`;

    let response;
    try {
      console.log(`Attempting to connect to Moyasar API at: ${apiUrl}payments`);
      console.log(`Using credentials starting with: ${moyasarSecretKey.substring(0, 10)}...`);
      console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${apiUrl}`);

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Authorization': basicAuth,
          'Content-Type': 'application/json',
          'User-Agent': 'WhelHost-Hotel-Reservation-App/1.0',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to smallest currency unit (fils for SAR)
          currency,
          description,
          // For redirect checkout, don't include source at all
          // Moyasar will provide the payment form on their hosted page
          callback_url: callback_url || `${process.env.NEXT_PUBLIC_SITE_URL}/api/moyasar/webhook`,
          metadata: {
            ...metadata,
            created_at: new Date().toISOString(),
            environment: process.env.NODE_ENV,
          }
        }),
      };

      response = await fetch(`${apiUrl}payments`, fetchOptions);

      console.log(`Moyasar API response status: ${response.status}`);
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

      if (fetchError.name === 'AbortError') {
        console.error('Request timeout - Moyasar API did not respond within the default time');
        throw new Error('Payment request timed out. This could be due to network restrictions. Please contact support or try again later.');
      } else if (fetchError.message.includes('ENOTFOUND')) {
        console.error('DNS resolution failed - could not find Moyasar API server');
        throw new Error('Could not connect to Moyasar API. This may be due to network restrictions in your hosting environment. Please check with your hosting provider about outbound connection policies.');
      } else if (fetchError.message.includes('ECONNREFUSED')) {
        console.error('Connection refused by Moyasar API server');
        throw new Error('Connection to Moyasar API was refused. This may be due to network restrictions in your hosting environment.');
      } else if (fetchError.message.includes('ECONNRESET')) {
        console.error('Connection to Moyasar API was reset');
        throw new Error('Connection to Moyasar API was reset. This may be due to network restrictions in your hosting environment.');
      } else if (fetchError.message.includes('fetch failed')) {
        console.error('Generic fetch failure - possible network or certificate issue');
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

      try {
        const errorJson = JSON.parse(errorData);
        console.error('Parsed error from Moyasar API:', errorJson);

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
    if (!payment.id) {
      console.error('Invalid response from Moyasar API:', payment);
      throw new Error('Invalid response received from payment gateway');
    }

    // For redirect checkout, construct the checkout URL
    // Moyasar provides this in the payment object or we construct it
    const checkoutUrl = payment.source?.transaction_url || 
                       `${apiUrl.replace('/v1/', '')}/payment/${payment.id}`;

    // Return the checkout URL for redirect
    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status
    });
  } catch (error: any) {
    console.error('Moyasar checkout creation error:', error);

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