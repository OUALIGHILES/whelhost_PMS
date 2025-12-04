# Moyasar Payment Integration Guide

This document provides details about the integration of Moyasar payment gateway in the hotel reservation application.

## Overview

The application integrates with Moyasar payment gateway to handle various payment methods including credit cards (Visa, Mastercard, MADA), STC Pay, and other supported payment methods.

## Configuration

### Environment Variables

The following environment variables need to be configured:

```env
# Test keys for development
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
MOYASAR_SECRET_KEY=sk_test_your_test_secret_key
MOYASAR_API_URL=https://api.sandbox.moyasar.com/v1/
MOYASAR_CURRENCY=SAR

# Production keys (uncomment when deploying to production)
# NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
# MOYASAR_SECRET_KEY=sk_live_your_live_secret_key
# MOYASAR_API_URL=https://api.moyasar.com/v1/
```

### Webhook Configuration

For production environments, you'll also need to configure:

```env
MOYASAR_WEBHOOK_SECRET=your_webhook_secret
```

## API Endpoints

### Payment Creation
- **Endpoint**: `POST /api/payments/moyasar`
- **Purpose**: Creates a new payment with Moyasar
- **Request Body**:
  ```json
  {
    "amount": 100,
    "currency": "SAR",
    "source": {
      "type": "creditcard",
      "number": "4111111111111111",
      "cvc": "123",
      "month": 12,
      "year": 25,
      "holder_name": "John Doe"
    },
    "description": "Payment description",
    "metadata": {},
    "callback_url": "https://...",
    "return_url": "https://...",
    "installments": 1
  }
  ```

### Payment Retrieval
- **Endpoint**: `GET /api/payments/moyasar?id={paymentId}`
- **Purpose**: Retrieves a payment by its ID

### Webhook Processing
- **Endpoint**: `PUT /api/payments/moyasar` or `POST /api/moyasar/webhook`
- **Purpose**: Processes payment notifications from Moyasar

## Components

### MoyasarCheckoutForm

Located at `components/checkout/moyasar-form.tsx`, this component provides a card form for users to enter payment information.

Features:
- Card number input with formatting
- Expiry month/year inputs
- CVC validation
- Cardholder name
- Real-time validation

### DirectMoyasarCheckout

Located at `components/payment/direct-moyasar-checkout.tsx`, this component allows for redirect-based payment flows (for methods like STC Pay).

## Webhook Handling

The application handles the following Moyasar webhook events:

- `payment.succeeded`: Update payment status to completed and record in database
- `payment.failed`: Update payment status to failed
- `payment.processing`: Payment is being processed
- `payment.captured`: Payment captured successfully
- `payment.refunded`: Payment was refunded
- `payment.partially_refunded`: Payment was partially refunded

## Database Integration

Payment information is stored in the `payments` table with the following Moyasar-specific fields:
- `moyasar_payment_id`: The unique ID from Moyasar
- `payment_method`: Set to 'moyasar'
- `status`: Payment status (pending, completed, failed, refunded)

## Security Considerations

- Payment card information is sent directly to Moyasar, not to your server
- All communications with Moyasar API are over HTTPS
- Webhook signatures are verified using HMAC-SHA256
- API keys are stored in environment variables

## Testing

### Test Card Numbers

For testing purposes, use the following card numbers with any valid expiry date and CVC:

- Visa: 4111 1111 1111 1111
- Mastercard: 5555 5555 5555 4444
- MADA: 4539 0000 0000 0006

### Test Environment

1. Ensure you're using test API keys
2. Set `MOYASAR_API_URL` to `https://api.sandbox.moyasar.com/v1/`
3. Run the application and test payment flows

### Testing Scripts

The project includes several test scripts:
- `test-moyasar.js`: Basic configuration test
- `test-moyasar-network.js`: Network connectivity test
- `test-moyasar-key.js`: API key validation test

## Troubleshooting

### Common Issues

1. **Network Connection Issues**: Ensure your server can connect to `api.sandbox.moyasar.com` (for sandbox) or `api.moyasar.com` (for production)

2. **API Key Validation**: Make sure your API keys are correctly configured and have the right permissions

3. **Webhook Signature Issues**: Verify that the `MOYASAR_WEBHOOK_SECRET` matches the secret configured in your Moyasar dashboard

4. **Payment Processing Errors**: Check the Moyasar dashboard for detailed error information

### Debugging

Use the debug environment script by running:
```bash
node debug-env.js
```

## Error Handling

The integration includes comprehensive error handling:
- Network timeout errors
- Invalid payment data
- API response errors
- Webhook verification failures
- Database operation errors

## Supported Payment Methods

- Credit Cards (Visa, Mastercard, MADA)
- STC Pay
- Other redirect-based payment methods supported by Moyasar