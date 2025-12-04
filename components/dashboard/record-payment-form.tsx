'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
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
  Mail,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
      <div className="space-y-4 max-w-2xl mx-auto w-full">
        <div className={`p-4 rounded-lg ${
          paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
          paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {paymentStatus === 'completed' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : paymentStatus === 'pending' ? (
                <Clock className="h-6 w-6 text-amber-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {paymentStatus === 'completed' ? 'Payment Recorded Successfully!' :
                 paymentStatus === 'pending' ? 'Payment Pending' :
                 'Payment Failed'}
              </h3>
              <div className="mt-1">
                {paymentStatus === 'completed' && (
                  <p>Payment ID: {paymentId.substring(0, 8)}...</p>
                )}
                {paymentStatus === 'pending' && (
                  <p>
                    {paymentMethod === 'bank' ? 'Bank transfer pending confirmation' : 'Payment link sent to customer'}
                  </p>
                )}
                {paymentStatus !== 'completed' && paymentStatus !== 'pending' && (
                  <p>Please try again or contact support</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Payment Receipt</CardTitle>
            <CardDescription>Transaction details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

            <div className="border rounded-lg p-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-2xl font-bold">{currency} {amount}</p>
                </div>
                <Badge>
                  {paymentMethod === 'card' ? 'Card Transaction' :
                   paymentMethod === 'bank' ? 'Bank Transfer' :
                   'Payment Link'}
                </Badge>
              </div>

              <div className="space-y-2">
                {reference && (
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="text-sm">{reference}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={paymentStatus === 'completed' ? 'default' :
                                paymentStatus === 'pending' ? 'secondary' : 'destructive'}>
                    {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2">
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
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold">Process Payment</h2>
        <p className="text-muted-foreground text-sm">Booking {bookingId.substring(0, 8)}...</p>
      </div>

      <div className="text-center mb-4">
        <div className="inline-flex items-center bg-primary/10 px-3 py-1 rounded-full border">
          <span className="text-sm text-primary font-medium">Total Amount:</span>
          <span className="ml-2 text-lg font-bold text-primary">{currency} {bookingAmount.toFixed(2)}</span>
        </div>
      </div>

      <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="bank">
            <Banknote className="h-4 w-4 mr-2" />
            Bank
          </TabsTrigger>
          <TabsTrigger value="card">
            <CreditCard className="h-4 w-4 mr-2" />
            Card
          </TabsTrigger>
          <TabsTrigger value="link">
            <LinkIcon className="h-4 w-4 mr-2" />
            Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bank Transfer</CardTitle>
              <CardDescription>Record a bank transfer payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="bank-amount">Amount ({currency})</Label>
                <Input
                  id="bank-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="bank-reference">Reference/Transaction ID</Label>
                <Input
                  id="bank-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Bank transaction reference, etc."
                />
              </div>

              <div>
                <Label htmlFor="bank-notes">Notes</Label>
                <Input
                  id="bank-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                />
              </div>

              <Button type="button" onClick={handleSubmit} className="w-full" disabled={loading}>
                {loading ? 'Recording Payment...' : 'Record Bank Transfer'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="card" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Transaction</CardTitle>
              <CardDescription>Record a card transaction payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="card-amount">Amount ({currency})</Label>
                <Input
                  id="card-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="card-reference">Reference</Label>
                <Input
                  id="card-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Card transaction ID, etc."
                />
              </div>

              <div>
                <Label htmlFor="card-notes">Notes</Label>
                <Input
                  id="card-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                />
              </div>

              <Button type="button" onClick={handleSubmit} className="w-full" disabled={loading}>
                {loading ? 'Recording Payment...' : 'Record Card Payment'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Link</CardTitle>
              <CardDescription>
                Create a payment link using Moyasar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DirectMoyasarCheckout
                bookingId={bookingId}
                amount={bookingAmount}
                currency={currency}
                guestName={guestName}
                description={`Payment for booking #${bookingId.substring(0, 8)}`}
                onComplete={(paymentId) => {
                  setPaymentId(paymentId);
                  setPaymentStatus('pending'); // Payment will be pending until webhook confirms
                }}
                onError={(error) => {
                  console.error('Moyasar checkout error:', error);
                  alert(`Payment checkout failed: ${error}`);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}