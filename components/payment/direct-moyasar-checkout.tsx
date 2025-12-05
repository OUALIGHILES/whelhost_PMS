'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

interface DirectMoyasarCheckoutProps {
  bookingId: string;
  amount: number;
  currency: string;
  guestName: string;
  description?: string;
  onComplete?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function DirectMoyasarCheckout({
  bookingId,
  amount,
  currency,
  guestName,
  description = 'Payment for booking #' + bookingId.substring(0, 8),
  onComplete,
  onError
}: DirectMoyasarCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/moyasar/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          source: {
            type: "url"  // Use 'url' type for redirect-based checkout without card details
          },
          metadata: {
            booking_id: bookingId,
            guest_name: guestName,
            user_id: '',
          },
          callback_url: `${window.location.origin}/api/moyasar/webhook`,
          cancel_url: `${window.location.origin}/dashboard/bookings/${bookingId}`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error && data.error.includes('network restrictions') || data.error.includes('outbound connections')) {
          setError('Payment processing is temporarily unavailable due to network restrictions. Please contact support to complete your payment.');
          onError?.('Network restrictions are preventing direct payment processing.');
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      } else {
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          throw new Error('No checkout URL received from Moyasar');
        }
      }
    } catch (err: any) {
      console.error('Error creating Moyasar checkout:', err);

      if (err.message.includes('network restrictions') || err.message.includes('outbound connections')) {
        setError('Payment processing is temporarily unavailable due to network restrictions. Please contact support to complete your payment.');
        onError?.('Network restrictions are preventing direct payment processing.');
      } else {
        setError(err.message);
        onError?.(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-3">
      <Card className="border bg-card text-card-foreground shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="pb-3 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Payment Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Secure payment for your customer</p>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              <Shield className="w-3 h-3 mr-1" />
              Secure
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Customer</span>
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{guestName}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Booking ID</span>
            <span className="text-sm font-mono font-medium text-foreground">{bookingId.substring(0, 8).toUpperCase()}</span>
          </div>

          <div className="pt-3 pb-2">
            <div className="text-3xl font-bold text-center text-primary">{amount.toFixed(2)}</div>
            <div className="text-center text-lg font-semibold text-foreground">{currency}</div>
            <p className="text-center text-xs text-muted-foreground mt-1">{description}</p>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-xs text-destructive text-center">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-4 pt-2">
          <Button
            className="w-full h-11 text-base font-medium"
            onClick={createCheckoutSession}
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay with Moyasar
              </div>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by Moyasar
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}