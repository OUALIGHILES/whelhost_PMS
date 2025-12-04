import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processWebhook } from '@/lib/moyasar';

export async function POST(request: NextRequest) {
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
    // Process the webhook using the updated library function with timestamp
    // The library function includes proper HMAC signature verification
    await processWebhook(payload, signature, timestamp);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Moyasar webhook error:', error);
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
      error: error.message || 'Failed to process webhook'
    }, { status: 400 }); // Use 400 for signature errors, 500 for processing errors
  }
}