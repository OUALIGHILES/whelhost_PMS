'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Banknote,
  Link as LinkIcon,
  Download,
  Printer,
  Share2,
  Calendar,
  User,
  Mail
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MoyasarPayment } from '@/components/payment/moyasar-payment'
import { DirectMoyasarCheckout } from '@/components/payment/direct-moyasar-checkout'

interface RecordPaymentFormProps {
  bookingId: string
  bookingAmount: number
  currency: string
  guestName: string
  checkIn: string
  checkOut: string
}

export function RecordPaymentForm({
  bookingId,
  bookingAmount,
  currency,
  guestName,
  checkIn,
  checkOut
}: RecordPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'link'>('card')
  const [amount, setAmount] = useState(bookingAmount.toString())
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending' | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Determine the payment method based on selected tab
      let method: 'cash' | 'card' | 'bank_transfer' | 'moyasar' | 'other' = 'other'
      let status: 'completed' | 'pending' | 'failed' = 'completed'

      // For this basic implementation, we'll handle the recording based on the payment method
      // If it's a Moyasar payment, we'll use the proper Moyasar flow
      if (paymentMethod === 'card') {
        method = 'card'
      } else if (paymentMethod === 'bank') {
        method = 'bank_transfer'
        status = 'pending' // Bank transfers are typically pending until confirmed
      } else if (paymentMethod === 'link') {
        method = 'moyasar' // Payment link would be a Moyasar payment
        status = 'pending' // Payment link would be pending until customer pays
      }

      const { data, error } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          amount: parseFloat(amount),
          method,
          status,
          reference,
          notes,
        })
        .select(`
          id,
          booking_id,
          amount,
          method,
          status,
          reference,
          notes,
          created_at
        `)
        .single()

      if (error) throw error

      // Update booking paid amount
      const { error: bookingError } = await supabase.rpc('update_booking_paid_amount', {
        p_booking_id: bookingId
      })

      if (bookingError) throw bookingError

      setPaymentId(data.id)
      setPaymentStatus(status)
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMoyasarSuccess = async (payment: any) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          amount: bookingAmount,
          method: 'moyasar',
          status: 'completed',
          moyasar_payment_id: payment.id,
          reference: payment.id,
          notes: 'Payment via Moyasar link',
        })
        .select(`
          id,
          booking_id,
          amount,
          method,
          status,
          moyasar_payment_id,
          reference,
          notes,
          created_at
        `)
        .single()

      if (error) throw error

      // Update booking paid amount
      const { error: bookingError } = await supabase.rpc('update_booking_paid_amount', {
        p_booking_id: bookingId
      })

      if (bookingError) throw bookingError

      setPaymentId(data.id)
      setPaymentStatus('completed')
    } catch (error) {
      console.error('Error recording Moyasar payment:', error)
      alert('Failed to record payment. Please try again.')
    }
  }

  const handleMoyasarError = (error: string) => {
    console.error('Moyasar payment error:', error)
    alert(`Moyasar payment failed: ${error}`)
  }

  const handleDownloadReceipt = () => {
    // Create a simple text receipt
    const receiptContent = `
RECEIPT
=======
Payment ID: ${paymentId?.substring(0, 8) || 'N/A'}
Guest: ${guestName}
Booking ID: ${bookingId.substring(0, 8)}...
Check-in: ${new Date(checkIn).toLocaleDateString()}
Check-out: ${new Date(checkOut).toLocaleDateString()}
Amount Paid: ${currency} ${amount}
Payment Method: ${paymentMethod === 'card' ? 'Card' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Payment Link'}
Status: ${paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}
Reference: ${reference || 'N/A'}
Date: ${new Date().toLocaleString()}

Thank you for your payment.
    `;

    // Create and download the file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${bookingId.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handlePrintReceipt = () => {
    // Create a print-friendly version
    const printContent = `
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .receipt-details { border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Receipt</h1>
          </div>
          <div class="receipt-details">
            <div class="detail-row">
              <span>Payment ID:</span>
              <span>${paymentId?.substring(0, 8) || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span>Guest:</span>
              <span>${guestName}</span>
            </div>
            <div class="detail-row">
              <span>Booking ID:</span>
              <span>${bookingId.substring(0, 8)}...</span>
            </div>
            <div class="detail-row">
              <span>Check-in:</span>
              <span>${new Date(checkIn).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span>Check-out:</span>
              <span>${new Date(checkOut).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span>Amount Paid:</span>
              <span>${currency} ${amount}</span>
            </div>
            <div class="detail-row">
              <span>Payment Method:</span>
              <span>${paymentMethod === 'card' ? 'Card' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Payment Link'}</span>
            </div>
            <div class="detail-row">
              <span>Status:</span>
              <span>${paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span>Reference:</span>
              <span>${reference || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span>Date:</span>
              <span>${new Date().toLocaleString()}</span>
            </div>
            <div class="total-row detail-row">
              <span>Thank you for your payment.</span>
            </div>
          </div>
          <div class="footer">
            <p>This is a computer-generated receipt and is valid without signature.</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  const handleShareReceipt = () => {
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'Payment Receipt',
        text: `Payment receipt for ${guestName}'s booking`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      const receiptText = `Payment receipt for ${guestName}'s booking. Booking ID: ${bookingId.substring(0, 8)}... Amount: ${currency} ${amount}`;
      navigator.clipboard.writeText(receiptText);
      alert('Receipt details copied to clipboard');
    }
  }

  // If payment is recorded, show receipt
  if (paymentId && paymentStatus) {
    return (
      <div className="space-y-4">
        <div className={`border rounded-lg p-4 ${
          paymentStatus === 'completed' ? 'bg-green-50 border-green-200' :
          paymentStatus === 'pending' ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                paymentStatus === 'completed' ? 'bg-green-100' :
                paymentStatus === 'pending' ? 'bg-amber-100' :
                'bg-red-100'
              }`}>
                <span className={
                  paymentStatus === 'completed' ? 'text-green-600' :
                  paymentStatus === 'pending' ? 'text-amber-600' :
                  'text-red-600'
                }>
                  {paymentStatus === 'completed' ? '✓' : paymentStatus === 'pending' ? '⏳' : '❌'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                paymentStatus === 'completed' ? 'text-green-800' :
                paymentStatus === 'pending' ? 'text-amber-800' :
                'text-red-800'
              }`}>
                {paymentStatus === 'completed' ? 'Payment Recorded Successfully!' :
                 paymentStatus === 'pending' ? 'Payment Pending' :
                 'Payment Failed'}
              </h3>
              <div className="mt-2 text-sm">
                {paymentStatus === 'completed' && (
                  <p className="text-green-700">Payment ID: {paymentId.substring(0, 8)}...</p>
                )}
                {paymentStatus === 'pending' && (
                  <p className="text-amber-700">
                    {paymentMethod === 'bank' ? 'Bank transfer pending confirmation' : 'Payment link sent to customer'}
                  </p>
                )}
                {paymentStatus !== 'completed' && paymentStatus !== 'pending' && (
                  <p className="text-red-700">Please try again or contact support</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Payment Receipt</CardTitle>
            <CardDescription>Transaction details and receipt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Guest</p>
                <p className="font-medium">{guestName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-medium">{bookingId.substring(0, 8)}...</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">{new Date(checkIn).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">{new Date(checkOut).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-xl font-bold">{currency} {amount}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <Badge variant="secondary">
                  {paymentMethod === 'card' ? 'Card' :
                   paymentMethod === 'bank' ? 'Bank Transfer' :
                   'Payment Link'}
                </Badge>
              </div>
              {reference && (
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-muted-foreground">Reference</p>
                  <p className="text-sm">{reference}</p>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={paymentStatus === 'completed' ? 'default' :
                              paymentStatus === 'pending' ? 'secondary' : 'destructive'}>
                  {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareReceipt}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bank">
            <Banknote className="h-4 w-4 mr-2" />
            Bank Transfer
          </TabsTrigger>
          <TabsTrigger value="card">
            <CreditCard className="h-4 w-4 mr-2" />
            Card Transaction
          </TabsTrigger>
          <TabsTrigger value="link">
            <LinkIcon className="h-4 w-4 mr-2" />
            Payment Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference/Transaction ID</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Bank transaction reference, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about the bank transfer..."
            />
          </div>

          <Button type="button" onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? 'Recording Payment...' : 'Record Bank Transfer'}
          </Button>
        </TabsContent>

        <TabsContent value="card" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Card transaction ID, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about the card transaction..."
            />
          </div>

          <Button type="button" onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? 'Recording Payment...' : 'Record Card Payment'}
          </Button>
        </TabsContent>

        <TabsContent value="link" className="space-y-4 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Payment Link Details</h4>
            <p className="text-sm text-blue-700">
              Create a payment link using Moyasar. The customer will be redirected to complete the payment securely.
            </p>
          </div>

          <div className="pt-4">
            <DirectMoyasarCheckout
              bookingId={bookingId}
              amount={bookingAmount}
              currency={currency}
              guestName={guestName}
              description={`Payment for booking #${bookingId.substring(0, 8)}`}
              onComplete={(paymentId) => {
                // This will be handled by the webhook, but we can provide feedback to the user
                setPaymentId(paymentId);
                setPaymentStatus('pending'); // Payment will be pending until webhook confirms
              }}
              onError={(error) => {
                console.error('Moyasar checkout error:', error);
                alert(`Payment checkout failed: ${error}`);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}