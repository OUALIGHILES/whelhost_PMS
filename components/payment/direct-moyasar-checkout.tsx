'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  Download,
  Printer,
  Share2,
  Calendar,
  User,
  CreditCard,
  Banknote,
  ExternalLink
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
  description = 'Hotel Booking Payment',
  onComplete,
  onError
}: DirectMoyasarCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
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
          metadata: {
            booking_id: bookingId,
            guest_name: guestName,
            user_id: '', // This would be the actual user ID in a real implementation
          },
          callback_url: `${window.location.origin}/api/moyasar/webhook`,
          cancel_url: `${window.location.origin}/dashboard/bookings/${bookingId}`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      setCheckoutUrl(data.checkout_url);
      
      // Redirect to Moyasar checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received from Moyasar');
      }
    } catch (err: any) {
      console.error('Error creating Moyasar checkout:', err);
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5" />
            Moyasar Payment
          </CardTitle>
          <CardDescription>
            Secure payment processing via Moyasar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Guest</p>
              <p className="font-medium">{guestName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono text-sm">{bookingId.substring(0, 8)}...</p>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">{currency} {amount.toFixed(2)}</p>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={createCheckoutSession} 
            disabled={loading}
          >
            {loading ? (
              <>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Pay with Moyasar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}