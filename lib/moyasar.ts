// lib/moyasar.ts

import { MOYASAR_CONFIG, getMoyasarHeaders, validatePaymentAmount, validateCardNumber, validateExpiryDate, validateCVC } from './moyasar-config';

export type PlanId = 'monthly' | 'yearly';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  amount: number; // Amount in SAR (will be converted to halalas for Moyasar)
  displayPrice: number;
  period: string;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    description: 'Perfect for getting started',
    amount: 199,
    displayPrice: 199,
    period: 'month',
    features: [
      "Unlimited rooms and units",
      "Real-time booking calendar",
      "Advanced analytics & reports",
      "Smart lock integration",
      "Guest communication tools",
      "Invoice generation & payments",
      "Channel management",
      "Task management for staff",
      "Priority support",
    ]
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Plan',
    description: 'Save 16% compared to monthly',
    amount: 1990,
    displayPrice: 1990,
    period: 'year',
    features: [
      "Unlimited rooms and units",
      "Real-time booking calendar",
      "Advanced analytics & reports",
      "Smart lock integration",
      "Guest communication tools",
      "Invoice generation & payments",
      "Channel management",
      "Task management for staff",
      "Priority support",
    ]
  }
};

// Credit Card Source Interface
export interface CreditCardSource {
  type: 'creditcard';
  number: string;
  cvc: string;
  month: number;
  year: number;
  holder_name: string;
}

// STC Pay Source Interface
export interface STCPaySource {
  type: 'stcpay';
  phone: string;
}

// URL Source Interface (for redirect-based payments)
export interface URLSource {
  type: 'url';
}

// Source Interface Union
export type PaymentSource = CreditCardSource | STCPaySource | URLSource;

export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  source: PaymentSource;
  metadata?: Record<string, string>;
  callback_url?: string;
  invoice_number?: string;
  return_url?: string;
  supported_networks?: string[];
  installments?: number;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  fee: number;
  refunded_amount: number;
  source: {
    type: string;
    company?: string;
    holder_name?: string;
    phone?: string;
    status?: string;
  };
  created_at: string;
  url?: string; // For redirect-based payments
  gateway_id?: string;
  failure_reason?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  callback_url?: string;
  return_url?: string;
  supported_networks?: string[];
  installments?: number;
}

export interface PaymentIntentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  source: {
    type: string;
    company?: string;
    holder_name?: string;
    phone?: string;
    status?: string;
  };
  url?: string;
  metadata?: Record<string, string>;
}

/**
 * Create a payment with Moyasar - supports all payment source types
 */
export async function createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  // Validate payment amount
  if (!validatePaymentAmount(paymentData.amount)) {
    throw new Error(`Invalid payment amount: ${paymentData.amount}. Amount must be between 1 SAR and 100,000 SAR`);
  }

  // Validate source-specific data
  if (paymentData.source.type === 'creditcard') {
    const cardSource = paymentData.source as CreditCardSource;
    if (!validateCardNumber(cardSource.number)) {
      throw new Error('Invalid card number provided');
    }
    if (!validateExpiryDate(cardSource.month.toString(), cardSource.year.toString())) {
      throw new Error('Invalid card expiry date provided');
    }
    if (!validateCVC(cardSource.cvc)) {
      throw new Error('Invalid CVC provided');
    }
  } else if (paymentData.source.type === 'stcpay') {
    const stcSource = paymentData.source as STCPaySource;
    // Validate STC Pay phone number
    if (!/^9665\d{8}$/.test(stcSource.phone)) {
      throw new Error('Invalid STC Pay phone number. Expected format: 9665XXXXXXXX');
    }
  }

  const headers = getMoyasarHeaders();
  let response;
  try {
    console.log(`Attempting to connect to Moyasar API at: ${MOYASAR_CONFIG.apiUrl}payments`);
    console.log(`Using credentials starting with: ${MOYASAR_CONFIG.secretKey?.substring(0, 10) || 'NOT_SET'}...`);
    console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${MOYASAR_CONFIG.apiUrl}`);

    // Diagnostic logging for the payload being sent to Moyasar
    const payload = {
      amount: Math.round(paymentData.amount * 100), // Convert to smallest currency unit (fils for SAR)
      currency: paymentData.currency,
      source: {
        type: paymentData.source.type,
        // Conditionally include only relevant fields based on source type
        ...(paymentData.source.type === 'creditcard' && {
          number: (paymentData.source as CreditCardSource).number,
          cvc: (paymentData.source as CreditCardSource).cvc,
          month: (paymentData.source as CreditCardSource).month,
          year: (paymentData.source as CreditCardSource).year,
          holder_name: (paymentData.source as CreditCardSource).holder_name,
        }),
        ...(paymentData.source.type === 'stcpay' && {
          phone: (paymentData.source as STCPaySource).phone,
        }),
      },
      description: paymentData.description,
      metadata: {
        ...paymentData.metadata || {},
        request_source: 'hotel_reservation_app',
        environment: process.env.NODE_ENV || 'unknown',
      },
      callback_url: paymentData.callback_url,
      return_url: paymentData.return_url,
      supported_networks: paymentData.supported_networks || MOYASAR_CONFIG.supportedNetworks,
      installments: paymentData.installments || MOYASAR_CONFIG.form.defaultInstallmentPlan,
    };

    console.log("PAYLOAD SENT TO MOYASAR:", JSON.stringify(payload, null, 2));

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOYASAR_CONFIG.timeouts.connection); // Timeout from config

    response = await fetch(`${MOYASAR_CONFIG.apiUrl}payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes

    console.log(`Moyasar API response status: ${response.status}`);
  } catch (fetchError: any) {
    console.error('Moyasar payment creation fetch error:', fetchError);
    console.error('Detailed error info:', {
      message: fetchError.message,
      name: fetchError.name,
      code: fetchError.code,
      stack: fetchError.stack,
    });

    // Provide more meaningful error message with network diagnostics
    if (fetchError.name === 'AbortError') {
      console.error('Request timeout - Moyasar API did not respond within the allowed time');
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
      throw new Error(`Moyasar payment creation fetch failed: ${fetchError.message}`);
    }
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Moyasar API error response: ${errorData}`);
    console.error(`Moyasar API status: ${response.status}`);

    let errorMessage = `Moyasar payment creation failed: ${errorData}`;

    try {
      // Try to parse JSON error response for better error messages
      const errorJson = JSON.parse(errorData);

      // Check for common authentication or configuration issues
      if (errorJson.type === 'authentication_error') {
        errorMessage = `Authentication failed: ${errorJson.message}. Please check your API keys.`;
      } else if (errorJson.type === 'validation_error') {
        errorMessage = `Validation error: ${errorJson.message}. Please check your payment parameters.`;
      } else if (errorJson.message) {
        errorMessage = `Moyasar payment creation failed: ${errorJson.message}`;
      }
    } catch (parseError) {
      // If not JSON, use the raw error data
      console.error('Could not parse error response as JSON:', parseError);
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Create a payment intent with Moyasar
 */
export async function createPaymentIntent(paymentData: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  // Validate payment amount
  if (!validatePaymentAmount(paymentData.amount)) {
    throw new Error(`Invalid payment amount: ${paymentData.amount}. Amount must be between 1 SAR and 100,000 SAR`);
  }

  const headers = getMoyasarHeaders();
  let response;
  try {
    console.log(`Attempting to connect to Moyasar API at: ${MOYASAR_CONFIG.apiUrl}payment-intents`);
    console.log(`Using credentials starting with: ${MOYASAR_CONFIG.secretKey?.substring(0, 10) || 'NOT_SET'}...`);
    console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${MOYASAR_CONFIG.apiUrl}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOYASAR_CONFIG.timeouts.connection); // Timeout from config

    response = await fetch(`${MOYASAR_CONFIG.apiUrl}payment-intents`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: Math.round(paymentData.amount * 100), // Convert to smallest currency unit (fils for SAR)
        currency: paymentData.currency,
        description: paymentData.description,
        metadata: {
          ...paymentData.metadata || {},
          request_source: 'hotel_reservation_app',
          environment: process.env.NODE_ENV || 'unknown',
        },
        callback_url: paymentData.callback_url,
        return_url: paymentData.return_url,
        supported_networks: paymentData.supported_networks || MOYASAR_CONFIG.supportedNetworks,
        installments: paymentData.installments || MOYASAR_CONFIG.form.defaultInstallmentPlan,
      }),
      signal: controller.signal // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes

    console.log(`Moyasar API response status: ${response.status}`);
  } catch (fetchError: any) {
    console.error('Moyasar payment intent creation fetch error:', fetchError);
    console.error('Detailed error info:', {
      message: fetchError.message,
      name: fetchError.name,
      code: fetchError.code,
      stack: fetchError.stack,
    });

    // Provide more meaningful error message with network diagnostics
    if (fetchError.name === 'AbortError') {
      console.error('Request timeout - Moyasar API did not respond within the allowed time');
      throw new Error('Payment intent request timed out. Please try again later.');
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
      throw new Error(`Moyasar payment intent creation fetch failed: ${fetchError.message}`);
    }
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Moyasar API error response: ${errorData}`);
    console.error(`Moyasar API status: ${response.status}`);

    let errorMessage = `Moyasar payment intent creation failed: ${errorData}`;

    try {
      // Try to parse JSON error response for better error messages
      const errorJson = JSON.parse(errorData);

      // Check for common authentication or configuration issues
      if (errorJson.type === 'authentication_error') {
        errorMessage = `Authentication failed: ${errorJson.message}. Please check your API keys.`;
      } else if (errorJson.type === 'validation_error') {
        errorMessage = `Validation error: ${errorJson.message}. Please check your payment parameters.`;
      } else if (errorJson.message) {
        errorMessage = `Moyasar payment intent creation failed: ${errorJson.message}`;
      }
    } catch (parseError) {
      // If not JSON, use the raw error data
      console.error('Could not parse error response as JSON:', parseError);
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Retrieve a payment by ID from Moyasar
 */
export async function getPayment(paymentId: string): Promise<PaymentResponse> {
  const headers = getMoyasarHeaders();
  let response;
  try {
    console.log(`Attempting to connect to Moyasar API at: ${MOYASAR_CONFIG.apiUrl}payments/${paymentId}`);
    console.log(`Using credentials starting with: ${MOYASAR_CONFIG.secretKey?.substring(0, 10) || 'NOT_SET'}...`);
    console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${MOYASAR_CONFIG.apiUrl}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOYASAR_CONFIG.timeouts.connection); // Timeout from config

    response = await fetch(`${MOYASAR_CONFIG.apiUrl}payments/${paymentId}`, {
      method: 'GET',
      headers,
      signal: controller.signal // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes

    console.log(`Moyasar API response status: ${response.status}`);
  } catch (fetchError: any) {
    console.error('Moyasar payment retrieval fetch error:', fetchError);
    console.error('Detailed error info:', {
      message: fetchError.message,
      name: fetchError.name,
      code: fetchError.code,
      stack: fetchError.stack,
    });

    // Provide more meaningful error message with network diagnostics
    if (fetchError.name === 'AbortError') {
      console.error('Request timeout - Moyasar API did not respond within the allowed time');
      throw new Error('Payment retrieval request timed out. Please try again later.');
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
      throw new Error(`Moyasar payment retrieval fetch failed: ${fetchError.message}`);
    }
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Moyasar API error response: ${errorData}`);
    console.error(`Moyasar API status: ${response.status}`);

    let errorMessage = `Moyasar payment retrieval failed: ${errorData}`;

    try {
      // Try to parse JSON error response for better error messages
      const errorJson = JSON.parse(errorData);

      // Check for common authentication or configuration issues
      if (errorJson.type === 'authentication_error') {
        errorMessage = `Authentication failed: ${errorJson.message}. Please check your API keys.`;
      } else if (errorJson.type === 'validation_error') {
        errorMessage = `Validation error: ${errorJson.message}. Please check your payment parameters.`;
      } else if (errorJson.message) {
        errorMessage = `Moyasar payment retrieval failed: ${errorJson.message}`;
      }
    } catch (parseError) {
      // If not JSON, use the raw error data
      console.error('Could not parse error response as JSON:', parseError);
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Verify a payment with Moyasar (alias for getPayment)
 */
export async function verifyPayment(paymentId: string): Promise<PaymentResponse> {
  return await getPayment(paymentId);
}

/**
 * Retrieve all payments for the account
 */
export async function listPayments(filters?: {
  from?: string;
  to?: string;
  status?: string;
  source_type?: string;
  page?: number;
  per_page?: number;
}): Promise<{ items: PaymentResponse[]; has_more: boolean }> {
  const headers = getMoyasarHeaders(false); // Don't include content-type for GET requests
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const queryString = params.toString();
  const url = `${MOYASAR_CONFIG.apiUrl}payments${queryString ? '?' + queryString : ''}`;

  try {
    console.log(`Attempting to connect to Moyasar API at: ${url}`);
    console.log(`Using credentials starting with: ${MOYASAR_CONFIG.secretKey?.substring(0, 10) || 'NOT_SET'}...`);
    console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${MOYASAR_CONFIG.apiUrl}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOYASAR_CONFIG.timeouts.connection); // Timeout from config

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes

    console.log(`Moyasar API response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Moyasar API error response: ${errorData}`);
      console.error(`Moyasar API status: ${response.status}`);

      let errorMessage = `Moyasar payments list failed: ${errorData}`;

      try {
        // Try to parse JSON error response for better error messages
        const errorJson = JSON.parse(errorData);

        // Check for common authentication or configuration issues
        if (errorJson.type === 'authentication_error') {
          errorMessage = `Authentication failed: ${errorJson.message}. Please check your API keys.`;
        } else if (errorJson.type === 'validation_error') {
          errorMessage = `Validation error: ${errorJson.message}. Please check your payment parameters.`;
        } else if (errorJson.message) {
          errorMessage = `Moyasar payments list failed: ${errorJson.message}`;
        }
      } catch (parseError) {
        // If not JSON, use the raw error data
        console.error('Could not parse error response as JSON:', parseError);
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (fetchError: any) {
    console.error('Moyasar payments list fetch error:', fetchError);
    console.error('Detailed error info:', {
      message: fetchError.message,
      name: fetchError.name,
      code: fetchError.code,
      stack: fetchError.stack,
    });

    // Provide more meaningful error message with network diagnostics
    if (fetchError.name === 'AbortError') {
      console.error('Request timeout - Moyasar API did not respond within the allowed time');
      throw new Error('Payment list request timed out. Please try again later.');
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
      throw new Error(`Moyasar payments list fetch failed: ${fetchError.message}`);
    }
  }
}

/**
 * Capture a payment that is in 'authorized' status
 */
export async function capturePayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
  const headers = getMoyasarHeaders();
  const captureData: { amount?: number } = {};

  if (amount) {
    if (!validatePaymentAmount(amount)) {
      throw new Error(`Invalid capture amount: ${amount}. Amount must be between 1 SAR and 100,000 SAR`);
    }
    captureData.amount = Math.round(amount * 100); // Convert to smallest currency unit
  }

  try {
    console.log(`Attempting to connect to Moyasar API at: ${MOYASAR_CONFIG.apiUrl}payments/${paymentId}/capture`);
    console.log(`Using credentials starting with: ${MOYASAR_CONFIG.secretKey?.substring(0, 10) || 'NOT_SET'}...`);
    console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${MOYASAR_CONFIG.apiUrl}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOYASAR_CONFIG.timeouts.connection); // Timeout from config

    const response = await fetch(`${MOYASAR_CONFIG.apiUrl}payments/${paymentId}/capture`, {
      method: 'POST',
      headers,
      body: JSON.stringify(captureData),
      signal: controller.signal // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes

    console.log(`Moyasar API response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Moyasar API error response: ${errorData}`);
      console.error(`Moyasar API status: ${response.status}`);

      let errorMessage = `Moyasar payment capture failed: ${errorData}`;

      try {
        // Try to parse JSON error response for better error messages
        const errorJson = JSON.parse(errorData);

        // Check for common authentication or configuration issues
        if (errorJson.type === 'authentication_error') {
          errorMessage = `Authentication failed: ${errorJson.message}. Please check your API keys.`;
        } else if (errorJson.type === 'validation_error') {
          errorMessage = `Validation error: ${errorJson.message}. Please check your capture parameters.`;
        } else if (errorJson.message) {
          errorMessage = `Moyasar payment capture failed: ${errorJson.message}`;
        }
      } catch (parseError) {
        // If not JSON, use the raw error data
        console.error('Could not parse error response as JSON:', parseError);
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (fetchError: any) {
    console.error('Moyasar payment capture fetch error:', fetchError);
    console.error('Detailed error info:', {
      message: fetchError.message,
      name: fetchError.name,
      code: fetchError.code,
      stack: fetchError.stack,
    });

    // Provide more meaningful error message with network diagnostics
    if (fetchError.name === 'AbortError') {
      console.error('Request timeout - Moyasar API did not respond within the allowed time');
      throw new Error('Payment capture request timed out. Please try again later.');
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
      throw new Error(`Moyasar payment capture fetch failed: ${fetchError.message}`);
    }
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentId: string, amount?: number, reason?: string): Promise<PaymentResponse> {
  const headers = getMoyasarHeaders();
  const refundData: { amount?: number; reason?: string } = {};

  if (amount) {
    if (!validatePaymentAmount(amount)) {
      throw new Error(`Invalid refund amount: ${amount}. Amount must be between 1 SAR and 100,000 SAR`);
    }
    refundData.amount = Math.round(amount * 100); // Convert to smallest currency unit
  }

  if (reason) {
    refundData.reason = reason;
  }

  try {
    console.log(`Attempting to connect to Moyasar API at: ${MOYASAR_CONFIG.apiUrl}payments/${paymentId}/refund`);
    console.log(`Using credentials starting with: ${MOYASAR_CONFIG.secretKey?.substring(0, 10) || 'NOT_SET'}...`);
    console.log(`Environment: ${process.env.NODE_ENV}, Using API: ${MOYASAR_CONFIG.apiUrl}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MOYASAR_CONFIG.timeouts.connection); // Timeout from config

    const response = await fetch(`${MOYASAR_CONFIG.apiUrl}payments/${paymentId}/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify(refundData),
      signal: controller.signal // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout if request completes

    console.log(`Moyasar API response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Moyasar API error response: ${errorData}`);
      console.error(`Moyasar API status: ${response.status}`);

      let errorMessage = `Moyasar payment refund failed: ${errorData}`;

      try {
        // Try to parse JSON error response for better error messages
        const errorJson = JSON.parse(errorData);

        // Check for common authentication or configuration issues
        if (errorJson.type === 'authentication_error') {
          errorMessage = `Authentication failed: ${errorJson.message}. Please check your API keys.`;
        } else if (errorJson.type === 'validation_error') {
          errorMessage = `Validation error: ${errorJson.message}. Please check your refund parameters.`;
        } else if (errorJson.message) {
          errorMessage = `Moyasar payment refund failed: ${errorJson.message}`;
        }
      } catch (parseError) {
        // If not JSON, use the raw error data
        console.error('Could not parse error response as JSON:', parseError);
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (fetchError: any) {
    console.error('Moyasar payment refund fetch error:', fetchError);
    console.error('Detailed error info:', {
      message: fetchError.message,
      name: fetchError.name,
      code: fetchError.code,
      stack: fetchError.stack,
    });

    // Provide more meaningful error message with network diagnostics
    if (fetchError.name === 'AbortError') {
      console.error('Request timeout - Moyasar API did not respond within the allowed time');
      throw new Error('Payment refund request timed out. Please try again later.');
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
      throw new Error(`Moyasar payment refund fetch failed: ${fetchError.message}`);
    }
  }
}

/**
 * Process Moyasar webhook
 */
export async function processWebhook(payload: string, signature: string, timestamp: string) {
  // Verify webhook signature using HMAC
  if (!MOYASAR_CONFIG.webhookSecret) {
    console.error('MOYASAR_WEBHOOK_SECRET is not configured');
    throw new Error('Webhook secret is not configured');
  }

  const crypto = await import('crypto');

  // Create the expected signature using HMAC
  const expectedSignature = crypto
    .createHmac('sha256', MOYASAR_CONFIG.webhookSecret)
    .update(payload + timestamp)  // Include timestamp in signature calculation
    .digest('hex');

  // Compare signatures (Moyasar may send the signature in different formats)
  if (signature !== expectedSignature && signature !== `sha256=${expectedSignature}`) {
    console.error('Invalid webhook signature');
    console.error('Expected signature:', expectedSignature);
    console.error('Received signature:', signature);
    throw new Error('Invalid webhook signature');
  }

  console.log("Processing Moyasar webhook:", payload);

  // Parse the webhook payload
  const data = JSON.parse(payload);

  // Handle the payment event based on its type
  switch (data.event) {
    case 'payment.succeeded':
      // Payment succeeded - update your database
      console.log("Payment succeeded:", data.payment.id);

      // Extract metadata from payment
      const { user_id, plan_id, booking_id } = data.payment.metadata || {};

      if (booking_id) {
        // This is a booking payment - handle accordingly
        const supabase = await import("@/lib/supabase/server").then(mod => mod.createClient());

        // Check if payment already exists to avoid duplicates
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('moyasar_payment_id', data.payment.id)
          .single();

        if (existingPayment) {
          console.log("Payment already recorded:", data.payment.id);
          break;
        }

        // Record the booking payment
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            booking_id,
            amount: data.payment.amount / 100, // Convert from halalas to SAR
            method: 'moyasar',
            status: 'completed',
            moyasar_payment_id: data.payment.id,
            reference: data.payment.id,
            notes: `Payment via Moyasar for booking ${booking_id}`,
            created_at: data.payment.created_at,
          });

        if (paymentError) {
          console.error("Failed to record booking payment:", paymentError);
          throw new Error(`Failed to record booking payment: ${paymentError.message}`);
        }

        // Update booking paid amount
        const { error: bookingError } = await supabase.rpc('update_booking_paid_amount', {
          p_booking_id: booking_id
        });

        if (bookingError) {
          console.error("Failed to update booking paid amount:", bookingError);
          throw new Error(`Failed to update booking paid amount: ${bookingError.message}`);
        }

        console.log(`Booking payment recorded successfully for booking ${booking_id}`);
      } else if (user_id && plan_id) {
        // This is a subscription payment - handle accordingly
        const supabase = await import("@/lib/supabase/server").then(mod => mod.createClient());

        const now = new Date();
        const expiresAt = new Date(now);

        // Calculate premium expiration date based on plan
        if (plan_id === "monthly") {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (plan_id === "yearly") {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          throw new Error(`Invalid plan_id: ${plan_id}`);
        }

        // Update user profile to premium
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            is_premium: true,
            premium_expires_at: expiresAt.toISOString(),
          })
          .eq("id", user_id);

        if (profileUpdateError) {
          console.error("Failed to update premium status:", profileUpdateError);
          throw new Error(`Failed to update premium status: ${profileUpdateError.message}`);
        }

        // Record or update the subscription
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id,
            plan: plan_id,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: expiresAt.toISOString(),
            moyasar_payment_id: data.payment.id,
          }, { onConflict: ['user_id'] });

        if (subscriptionError) {
          console.error("Failed to record subscription:", subscriptionError);
          throw new Error(`Failed to record subscription: ${subscriptionError.message}`);
        }

        // Record the payment
        const { error: paymentError } = await supabase
          .from("payments")
          .upsert({
            user_id,
            amount: data.payment.amount / 100, // Convert from halalas to SAR
            currency: data.payment.currency,
            status: "completed",
            payment_method: "moyasar",
            moyasar_payment_id: data.payment.id,
          }, { onConflict: ['moyasar_payment_id'] });

        if (paymentError) {
          console.error("Failed to record payment:", paymentError);
          throw new Error(`Failed to record payment: ${paymentError.message}`);
        }

        console.log(`Premium status updated successfully for user ${user_id}`);
      } else {
        console.log("Payment succeeded but no booking_id, user_id, or plan_id in metadata");
      }
      break;
    case 'payment.failed':
      // Payment failed - update payment status
      console.log("Payment failed:", data.payment.id);

      const { booking_id: failed_booking_id } = data.payment.metadata || {};
      if (failed_booking_id) {
        const supabase = await import("@/lib/supabase/server").then(mod => mod.createClient());

        // Record the failed payment
        const { error } = await supabase
          .from('payments')
          .upsert({
            booking_id: failed_booking_id,
            amount: data.payment.amount / 100,
            method: 'moyasar',
            status: 'failed',
            moyasar_payment_id: data.payment.id,
            reference: data.payment.id,
            notes: `Payment failed: ${data.payment.failure_reason || 'Unknown reason'}`,
            created_at: data.payment.created_at,
          }, { onConflict: ['moyasar_payment_id'] });

        if (error) {
          console.error("Failed to record failed booking payment:", error);
        }

        // Update booking paid amount
        const { error: bookingError } = await supabase.rpc('update_booking_paid_amount', {
          p_booking_id: failed_booking_id
        });

        if (bookingError) {
          console.error("Failed to update booking paid amount for failed payment:", bookingError);
        }
      }
      break;
    case 'payment.processing':
      // Payment is being processed
      console.log("Payment processing:", data.payment.id);
      break;
    case 'payment.captured':
      // Payment captured successfully
      console.log("Payment captured:", data.payment.id);

      const { booking_id: captured_booking_id } = data.payment.metadata || {};
      if (captured_booking_id) {
        const supabase = await import("@/lib/supabase/server").then(mod => mod.createClient());

        // Update payment status to completed if it was previously in a different state
        const { error } = await supabase
          .from('payments')
          .upsert({
            booking_id: captured_booking_id,
            amount: data.payment.amount / 100,
            method: 'moyasar',
            status: 'completed',
            moyasar_payment_id: data.payment.id,
            reference: data.payment.id,
            notes: `Payment captured via Moyasar for booking ${captured_booking_id}`,
            created_at: data.payment.created_at,
          }, { onConflict: ['moyasar_payment_id'] });

        if (error) {
          console.error("Failed to update captured booking payment:", error);
        }

        // Update booking paid amount
        const { error: bookingError } = await supabase.rpc('update_booking_paid_amount', {
          p_booking_id: captured_booking_id
        });

        if (bookingError) {
          console.error("Failed to update booking paid amount after capture:", bookingError);
        }
      }
      break;
    case 'payment.refunded':
      // Payment was refunded
      console.log("Payment refunded:", data.payment.id);

      const { booking_id: refunded_booking_id, user_id: refunded_user_id } = data.payment.metadata || {};

      if (refunded_booking_id) {
        // Handle booking payment refund
        const supabase = await import("@/lib/supabase/server").then(mod => mod.createClient());

        // Update payment status to refunded
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('moyasar_payment_id', data.payment.id);

        if (paymentError) {
          console.error("Failed to update refunded payment status:", paymentError);
        }

        // Update booking paid amount
        const { error: bookingError } = await supabase.rpc('update_booking_paid_amount', {
          p_booking_id: refunded_booking_id
        });

        if (bookingError) {
          console.error("Failed to update booking paid amount after refund:", bookingError);
        }
      } else if (refunded_user_id) {
        // Handle subscription payment refund
        const supabase = await import("@/lib/supabase/server").then(mod => mod.createClient());

        // Update user profile to non-premium
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            is_premium: false,
            premium_expires_at: null,
          })
          .eq("id", refunded_user_id);

        if (profileUpdateError) {
          console.error("Failed to update premium status after refund:", profileUpdateError);
        }

        // Update subscription status
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .update({
            status: "refunded",
          })
          .eq("moyasar_payment_id", data.payment.id);

        if (subscriptionError) {
          console.error("Failed to update subscription status after refund:", subscriptionError);
        }

        console.log(`Premium status removed after refund for user ${refunded_user_id}`);
      }
      break;
    case 'payment.partially_refunded':
      // Payment was partially refunded
      console.log("Payment partially refunded:", data.payment.id);
      break;
    default:
      console.log("Unknown event type:", data.event);
  }

  return { processed: true };
}