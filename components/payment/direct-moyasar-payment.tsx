'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  CreditCard,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface DirectMoyasarPaymentProps {
  bookingId: string;
  amount: number;
  currency: string;
  guestName: string;
  description?: string;
  onComplete?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function DirectMoyasarPayment({
  bookingId,
  amount,
  currency,
  guestName,
  description = 'Payment for booking #' + bookingId.substring(0, 8),
  onComplete,
  onError
}: DirectMoyasarPaymentProps) {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (field: 'month' | 'year', value: string) => {
    const digitsOnly = value.replace(/\D/g, '');

    if (field === 'month') {
      const month = digitsOnly.substring(0, 2);
      setExpiryMonth(month);
    } else {
      const year = digitsOnly.substring(0, 2);
      setExpiryYear(year);
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError(null);

    // Validate inputs
    if (!cardName || !cardNumber || !expiryMonth || !expiryYear || !cvc) {
      setError('Please fill in all card details');
      setLoading(false);
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16 || !/^\d{16}$/.test(cleanCardNumber)) {
      setError('Please enter a valid 16-digit card number');
      setLoading(false);
      return;
    }

    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (isNaN(month) || isNaN(year) ||
        month < 1 || month > 12 ||
        year < currentYear ||
        (year === currentYear && month < currentMonth)) {
      setError('Please enter a valid expiry date');
      setLoading(false);
      return;
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      setError('Please enter a valid CVC (3-4 digits)');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/moyasar/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          callback_url: `${window.location.origin}/api/moyasar/webhook`,
          source: {
            name: cardName,
            number: cleanCardNumber,
            month: parseInt(expiryMonth),
            year: parseInt(expiryYear),
            cvc
          },
          metadata: {
            booking_id: bookingId,
            guest_name: guestName,
            user_id: '',
          }
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || data.error || 'Payment failed');
        onError?.(data.error?.message || data.error || 'Payment failed');
      } else {
        onComplete?.(data.payment.id);
        // Reset form after successful payment
        setCardName('');
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setCvc('');
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Payment failed');
      onError?.(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-3">
      <Card className="border bg-card text-card-foreground shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="pb-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Secure Payment</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Enter your card details</p>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Secure
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="pt-3 pb-2">
            <div className="text-3xl font-bold text-center text-primary">{amount.toFixed(2)}</div>
            <div className="text-center text-lg font-semibold text-foreground">{currency}</div>
            <p className="text-center text-xs text-muted-foreground mt-1">{description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-name">Cardholder Name</Label>
            <Input
              id="card-name"
              type="text"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-number">Card Number</Label>
            <Input
              id="card-number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expiry-month">Expiry Month</Label>
              <Input
                id="expiry-month"
                type="text"
                placeholder="MM"
                value={expiryMonth}
                onChange={(e) => handleExpiryChange('month', e.target.value)}
                maxLength={2}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-year">Expiry Year</Label>
                <Input
                  id="expiry-year"
                  type="text"
                  placeholder="YY"
                  value={expiryYear}
                  onChange={(e) => handleExpiryChange('year', e.target.value)}
                  maxLength={2}
                  disabled={loading}
                />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              type="text"
              placeholder="123"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-destructive">{error}</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-4 pt-2">
          <Button
            className="w-full h-11 text-base font-medium"
            onClick={processPayment}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay {currency} {amount.toFixed(2)}
              </div>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Your payment details are securely processed
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}