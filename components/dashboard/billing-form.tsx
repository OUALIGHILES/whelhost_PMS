'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface BillingFormProps {
  bookingId: string;
  onClose: () => void;
}

export function BillingForm({ bookingId, onClose }: BillingFormProps) {
  const supabase = createClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [billingDetails, setBillingDetails] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card'>('cash');
  const [remarks, setRemarks] = useState('');

  const predefinedCategories = [
    'Laundry',
    'Coffee Shop',
    'Restaurant',
    'Parking',
    'Gym',
    'WiFi'
  ];

  const totalAmount = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedCategory = category === 'custom' ? customCategory : category;

      const { data, error } = await supabase
        .from('billings')
        .insert([{
          booking_id: bookingId,
          category: selectedCategory,
          description: description || selectedCategory,
          quantity: quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
          date: date?.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setBillingDetails({
        id: data.id,
        date: data.date,
        category: selectedCategory,
        quantity: quantity,
        unitPrice: unitPrice,
        totalAmount: totalAmount
      });

      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error('Error creating billing:', error);
      alert('Failed to create billing. Please try again.');
    }
  };

  const handleCreateReceipt = async () => {
    try {
      if (!billingDetails) return;

      const { error } = await supabase
        .from('receipts')
        .insert([{
          billing_id: billingDetails.id,
          amount: paymentAmount || totalAmount,
          payment_method: paymentMethod,
          remarks
        }]);

      if (error) throw error;

      alert('Receipt created successfully!');
      setIsReceiptDialogOpen(false);
      onClose();
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Failed to create receipt. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Category</Label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setQuantity(isNaN(value) || value < 1 ? 1 : value);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Price ({'SAR'})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setUnitPrice(isNaN(value) || value < 0 ? 0 : value);
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl font-bold">{totalAmount.toFixed(2)} SAR</div>
            </div>

            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Billing
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">Billing Created Successfully</DialogTitle>
          </DialogHeader>
          {billingDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Date</div>
                <div>{format(new Date(billingDetails.date), 'PPP')}</div>

                <div className="text-muted-foreground">Billing ID</div>
                <div>{billingDetails.id.substring(0, 8)}</div>

                <div className="text-muted-foreground">Category</div>
                <div>{billingDetails.category}</div>

                <div className="text-muted-foreground">Total</div>
                <div className="font-semibold">{billingDetails.totalAmount.toFixed(2)} SAR</div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  onClick={() => setIsReceiptDialogOpen(true)}
                >
                  Create Receipt
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsSuccessDialogOpen(false);
                    onClose();
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Receipt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Amount ({'SAR'})</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setPaymentAmount(isNaN(value) || value < 0 ? 0 : value);
                }}
                defaultValue={totalAmount}
              />
            </div>

            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreateReceipt}
                className="w-full"
              >
                Create Receipt
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsReceiptDialogOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}