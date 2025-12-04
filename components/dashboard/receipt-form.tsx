'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Billing {
  id: string;
  description: string;
  total_amount: number;
  category: string;
  date: string;
}

interface ReceiptFormProps {
  hotelId: string;
  currency: string;
  billings: Billing[];
}

export function ReceiptForm({ hotelId, currency, billings }: ReceiptFormProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<'cash' | 'bank_transfer' | 'card'>('cash');
  const [notes, setNotes] = useState<string>('');
  const [selectedBilling, setSelectedBilling] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate a unique invoice number for this receipt
      const invoiceNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Insert the receipt as an invoice record in the database
      // This creates an invoice representing the payment/receipt
      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          hotel_id: hotelId,
          invoice_number: invoiceNumber,
          status: 'paid',
          subtotal: amount,
          tax_amount: 0,
          total_amount: amount,
          notes: `Receipt: ${notes}`,
        }])
        .select()
        .single();

      if (error) throw error;

      // Also create the receipt record for tracking
      if (selectedBilling) {
        const { error: receiptError } = await supabase
          .from('receipts')
          .insert([{
            hotel_id: hotelId,
            billing_id: selectedBilling,
            amount: amount,
            payment_method: method,
            remarks: notes,
          }]);

        if (receiptError) {
          console.error('Error creating receipt record:', receiptError);
          // We'll still continue as the invoice was created successfully
        }
      } else {
        // If no billing was selected, just create the receipt record with amount
        const { error: receiptError } = await supabase
          .from('receipts')
          .insert([{
            hotel_id: hotelId,
            amount: amount,
            payment_method: method,
            remarks: notes,
          }]);

        if (receiptError) {
          console.error('Error creating receipt record:', receiptError);
        }
      }

      // Redirect to the invoices page
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Failed to create receipt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/invoices');
  };

  // Get the selected billing details
  const selectedBillingDetails = billings.find(b => b.id === selectedBilling);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Receipt</CardTitle>
        <CardDescription>
          Fill in the details for the new receipt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="billing">Select Billing (Optional)</Label>
              <Select value={selectedBilling} onValueChange={setSelectedBilling}>
                <SelectTrigger id="billing">
                  <SelectValue placeholder="Select a billing entry to create receipt for (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {billings.map(billing => (
                    <SelectItem key={billing.id} value={billing.id}>
                      {billing.description} - {billing.total_amount} {currency} ({billing.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBillingDetails && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium mb-2">Selected Billing Details</h4>
                <p><span className="text-muted-foreground">Description:</span> {selectedBillingDetails.description}</p>
                <p><span className="text-muted-foreground">Category:</span> {selectedBillingDetails.category}</p>
                <p><span className="text-muted-foreground">Amount:</span> {selectedBillingDetails.total_amount} {currency}</p>
                <p className="mt-2 text-sm text-blue-700">A receipt will be created for this billing</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={method} onValueChange={(value: 'cash' | 'bank_transfer' | 'card') => setMethod(value)}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Transaction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}