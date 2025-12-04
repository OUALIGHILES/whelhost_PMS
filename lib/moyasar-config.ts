// lib/moyasar-config.ts

export const MOYASAR_CONFIG = {
  // API Configuration
  publishableKey: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY,
  secretKey: process.env.MOYASAR_SECRET_KEY,
  
  // API endpoints
  apiUrl: process.env.MOYASAR_API_URL || (process.env.NODE_ENV === 'development' 
    ? 'https://api.sandbox.moyasar.com/v1/' 
    : 'https://api.moyasar.com/v1/'),
  
  // Currency settings
  currency: process.env.MOYASAR_CURRENCY || 'SAR',
  
  // Supported payment methods
  supportedNetworks: process.env.MOYASAR_SUPPORTED_NETWORKS?.split(',') || ['mada', 'visa', 'mastercard'],
  
  // Webhook settings
  webhookSecret: process.env.MOYASAR_WEBHOOK_SECRET,
  
  // Payment form settings
  form: {
    enableSaveCard: false,
    showMadaLogo: true,
    enableInstallments: true,
    defaultInstallmentPlan: 1,
    supportedInstallmentPlans: [1, 3, 6, 12],
  },
  
  // Validation settings
  validation: {
    cvcRequired: true,
    autoDetectCardType: true,
  },
  
  // Sandbox mode (auto-detected from key)
  isSandboxMode: process.env.MOYASAR_SECRET_KEY?.startsWith('sk_test_') || 
                 process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY?.startsWith('pk_test_') ||
                 process.env.NODE_ENV === 'development',
  
  // Moyasar supported currencies
  supportedCurrencies: ['SAR', 'USD', 'AED', 'EGP', 'QAR', 'KWD', 'BHD', 'OMR'],
  
  // Payment methods configuration
  paymentMethods: {
    creditcard: {
      enabled: true,
      supportedNetworks: ['visa', 'mastercard', 'mada'],
    },
    samsungpay: {
      enabled: false, // Currently disabled, can be enabled if needed
    },
    applepay: {
      enabled: false, // Currently disabled, can be enabled if needed
    },
    stcpay: {
      enabled: true, // Saudi Arabia specific payment method
    },
    url: {
      enabled: true, // For redirect-based payments
    },
  },
  
  // API timeout settings
  timeouts: {
    connection: 15000, // 15 seconds
    read: 30000,       // 30 seconds
    write: 30000,      // 30 seconds
  },
};

// Helper functions to validate configuration
export const validateMoyasarConfig = () => {
  if (!MOYASAR_CONFIG.secretKey) {
    throw new Error('MOYASAR_SECRET_KEY environment variable is required');
  }
  
  if (!MOYASAR_CONFIG.publishableKey) {
    throw new Error('NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY environment variable is required');
  }
  
  if (!MOYASAR_CONFIG.apiUrl) {
    throw new Error('MOYASAR_API_URL environment variable is required');
  }
  
  if (!MOYASAR_CONFIG.currency || !MOYASAR_CONFIG.supportedCurrencies.includes(MOYASAR_CONFIG.currency)) {
    console.warn(`Currency ${MOYASAR_CONFIG.currency} is not officially supported by Moyasar. Using ${MOYASAR_CONFIG.currency} anyway.`);
  }
};

export const getMoyasarHeaders = (includeContentType = true) => {
  const credentials = `${MOYASAR_CONFIG.secretKey}:`;
  const encodedCredentials = typeof window !== 'undefined'
    ? btoa(credentials)
    : Buffer.from(credentials).toString('base64');
  
  const headers: Record<string, string> = {
    'Authorization': `Basic ${encodedCredentials}`,
    'User-Agent': 'WhelHost-Hotel-Reservation-App/1.0',
  };
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Validation helpers
export const validatePaymentAmount = (amount: number): boolean => {
  // Minimum amount in SAR is 1 SAR (100 halalas)
  return amount >= 1 && amount <= 100000; // Max 100,000 SAR per transaction
};

export const validateCardNumber = (cardNumber: string): boolean => {
  // Remove spaces and check if it's a valid card number
  const cleanCardNumber = cardNumber.replace(/\s/g, '');
  return /^\d{16}$/.test(cleanCardNumber);
};

export const validateExpiryDate = (month: string, year: string): boolean => {
  const expMonth = parseInt(month);
  const expYear = parseInt(year);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;

  return !(
    isNaN(expMonth) || 
    isNaN(expYear) ||
    expMonth < 1 || 
    expMonth > 12 ||
    expYear < currentYear ||
    (expYear === currentYear && expMonth < currentMonth)
  );
};

export const validateCVC = (cvc: string): boolean => {
  return /^\d{3,4}$/.test(cvc);
};