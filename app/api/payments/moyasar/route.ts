// app/api/payments/moyasar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createPayment, getPayment, processWebhook } from '@/lib/moyasar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("RECEIVED PAYLOAD FROM FRONTEND:", JSON.stringify(body, null, 2));

    const { amount, currency, source, description, metadata, callback_url, return_url, installments } = body;

    // Validate required fields
    if (!amount || !source) {
      console.error("Missing required fields. Received:", { amount, source });
      return NextResponse.json(
        { error: 'Amount and source are required' },
        { status: 400 }
      );
    }

    // Create payment with Moyasar
    const payment = await createPayment({
      amount,
      currency: currency || 'SAR',
      source,
      description: description || 'Hotel Booking Payment',
      metadata: metadata || {},
      callback_url,
      return_url,
      installments,
    });

    return NextResponse.json({
      success: true,
      payment
    });
  } catch (error: any) {
    console.error('Moyasar payment error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    });

    // Log additional system information that might help diagnose network issues
    console.error('System info:', {
      NODE_ENV: process.env.NODE_ENV,
      MOYASAR_API_URL: process.env.MOYASAR_API_URL,
      process_platform: process.platform,
      process_arch: process.arch,
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create payment'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('id');

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
  }

  try {
    const payment = await getPayment(paymentId);
    return NextResponse.json({ payment });
  } catch (error: any) {
    console.error('Moyasar get payment error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    });

    return NextResponse.json({
      error: error.message || 'Failed to retrieve payment'
    }, { status: 500 });
  }
}

// Handle Moyasar webhooks
export async function PUT(request: NextRequest) {
  const signature = request.headers.get('X-Moyasar-Signature');
  const timestamp = request.headers.get('X-Moyasar-Timestamp') || request.headers.get('X-Timestamp');
  const payload = await request.text();

  if (!signature) {
    console.error('Missing signature header');
    return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
  }

  if (!timestamp) {
    console.error('Missing timestamp header');
    return NextResponse.json({ error: 'Missing timestamp header' }, { status: 400 });
  }

  try {
    await processWebhook(payload, signature, timestamp);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Moyasar webhook error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process webhook'
    }, { status: 400 }); // Use 400 for signature errors, 500 for processing errors
  }
}