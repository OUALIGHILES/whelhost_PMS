import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'SAR',
      description = 'Hotel Booking Payment',
      callback_url,
      metadata = {}
    } = body;

    // On s'attend à ce que le frontend envoie aussi les infos de carte :
    const { name, number, month, year, cvc } = body.source || {};

    if (!amount || !name || !number || !month || !year || !cvc) {
      return NextResponse.json({ error: 'Missing payment/card fields' }, { status: 400 });
    }

    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY!;
    const apiUrl = (process.env.NODE_ENV === 'development'
      ? 'https://api.sandbox.moyasar.com/v1'
      : 'https://api.moyasar.com/v1') + '/payments';

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${moyasarSecretKey}:`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        description,
        callback_url,
        source: {
          type: 'creditcard',
          name,
          number,
          month,
          year,
          cvc
        },
        metadata
      })
    });

    const payment = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: payment }, { status: res.status });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}