'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Eye,
  Plus,
  Download,
  X,
  CalendarIcon,
  Printer,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Bill {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  date: string;
  created_at: string;
  booking?: {
    guest?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface BillsPageProps {
  search?: string;
  invoiceNumber?: string;
  contractNumber?: string;
  bookingNumber?: string;
}

interface BillsClientProps {
  bills: Bill[];
  currency: string;
  hotelId: string;
  onBillCreated?: () => void;
  searchParams?: BillsPageProps;
}

interface InvoiceItem {
  id: string;
  service: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
}

export default function BillsClient({ bills, currency, hotelId, onBillCreated, searchParams }: BillsClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { id: '1', service: '', category: '', quantity: 1, price: 0, total: 0 }
  ]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState(searchParams?.search || '');
  const [filters, setFilters] = useState({
    invoiceNumber: searchParams?.invoiceNumber || '',
    contractNumber: searchParams?.contractNumber || '',
    bookingNumber: searchParams?.bookingNumber || ''
  });

  // Receipt form state
  const [receiptAmount, setReceiptAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRemark, setPaymentRemark] = useState('');

  // Function to update URL with search params
  const updateSearchParams = (newFilters: {
    search?: string;
    invoiceNumber?: string;
    contractNumber?: string;
    bookingNumber?: string;
  }) => {
    const url = new URL(window.location.href);

    // Clear existing params
    url.searchParams.delete('search');
    url.searchParams.delete('invoiceNumber');
    url.searchParams.delete('contractNumber');
    url.searchParams.delete('bookingNumber');

    // Add new params if they exist
    if (newFilters.search) url.searchParams.set('search', newFilters.search);
    if (newFilters.invoiceNumber) url.searchParams.set('invoiceNumber', newFilters.invoiceNumber);
    if (newFilters.contractNumber) url.searchParams.set('contractNumber', newFilters.contractNumber);
    if (newFilters.bookingNumber) url.searchParams.set('bookingNumber', newFilters.bookingNumber);

    window.history.pushState({}, '', url);
  };

  // Filter bills based on search term and filters
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      // Search term filter (searches description and category)
      const matchesSearch = !searchTerm ||
        bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.category?.toLowerCase().includes(searchTerm.toLowerCase());

      // Invoice number filter (using description for now since we don't have invoice number in billings)
      const matchesInvoiceNumber = !filters.invoiceNumber ||
        bill.description?.toLowerCase().includes(filters.invoiceNumber.toLowerCase()) ||
        bill.category?.toLowerCase().includes(filters.invoiceNumber.toLowerCase());

      // Contract number filter
      const matchesContractNumber = !filters.contractNumber ||
        bill.description?.toLowerCase().includes(filters.contractNumber.toLowerCase()) ||
        bill.category?.toLowerCase().includes(filters.contractNumber.toLowerCase());

      // Booking number filter
      const matchesBookingNumber = !filters.bookingNumber ||
        bill.description?.toLowerCase().includes(filters.bookingNumber.toLowerCase()) ||
        bill.category?.toLowerCase().includes(filters.bookingNumber.toLowerCase());

      return matchesSearch && matchesInvoiceNumber && matchesContractNumber && matchesBookingNumber;
    });
  }, [bills, searchTerm, filters]);

  const services = [
    'Room Service',
    'Laundry',
    'Coffe Shop',
    'Restaurant',
    'Spa',
    'Gym',
    'Parking',
    'WiFi',
    'Airport Transfer',
    'Tour',
    'Other'
  ];

  const categories = [
    'Food & Beverage',
    'Housekeeping',
    'Amenities',
    'Transportation',
    'Entertainment',
    'Other'
  ];

  const handleAddItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        id: Date.now().toString(),
        service: '',
        category: '',
        quantity: 1,
        price: 0,
        total: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceItems(
      invoiceItems.map(item =>
        item.id === id ? {
          ...item,
          [field]: value,
          ...(field === 'quantity' || field === 'price' ? { total: (item.quantity * item.price) } : {})
        } : item
      )
    );
  };

  const handleCreateInvoice = async () => {
    try {
      // Validate inputs
      console.log('Hotel ID from props:', hotelId);
      if (!hotelId) {
        alert('Hotel ID is missing. Please refresh the page and try again.');
        return;
      }

      // Calculate totals
      const newInvoiceNumber = `INV-${Date.now()}`;
      setInvoiceNumber(newInvoiceNumber);

      const supabase = createClient();

      // Verify the user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        alert('User not authenticated. Please log in again.');
        return;
      }

      console.log('Current user:', user.id);

      // Verify the hotel exists and belongs to the user
      const { data: hotelData, error: hotelCheckError } = await supabase
        .from('hotels')
        .select('id')
        .eq('id', hotelId)
        .single();

      if (hotelCheckError || !hotelData) {
        console.error('Hotel verification error:', hotelCheckError);
        alert('Invalid hotel. Please refresh the page and try again.');
        return;
      }

      // Create the invoice in the database
      const results = [];
      let overallTotal = 0; // Calculate total for the invoice
      const invoiceItemsToSave = [];

      for (const item of invoiceItems) {
        if (item.service && item.price > 0) { // Only save items with a service and price
          console.log('Saving billing item:', {
            hotel_id: hotelId,
            category: item.category || 'General',
            description: item.service,
            quantity: item.quantity,
            unit_price: item.price,
            total_amount: item.total,
            date: invoiceDate.toISOString(),
          });

          const { data: billingData, error: billingError } = await supabase
            .from('billings')
            .insert([{
              hotel_id: hotelId,
              category: item.category || 'General',
              description: item.service,
              quantity: item.quantity,
              unit_price: item.price,
              total_amount: item.total,
              date: invoiceDate.toISOString(),
            }]);

          console.log('Billing insert result:', { data: billingData, error: billingError });

          if (billingError) {
            console.error('Error inserting billing item:', billingError);
            throw billingError;
          }

          // Add to invoice items to save later
          invoiceItemsToSave.push({
            description: item.service,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.total,
            billing_id: billingData?.[0]?.id
          });

          overallTotal += item.total;
          results.push(billingData);
        }
      }

      // Also create an invoice record so it appears on the Invoices page
      if (invoiceItemsToSave.length > 0) {
        const invoiceNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .insert([{
            hotel_id: hotelId,
            invoice_number: invoiceNumber,
            status: 'draft', // Default to draft, can be updated later
            subtotal: overallTotal,
            tax_amount: overallTotal * 0.15, // Assuming 15% tax
            total_amount: overallTotal * 1.15,
            created_at: invoiceDate.toISOString(),
            notes: `Invoice created from billings on ${new Date(invoiceDate).toDateString()}`
          }])
          .select()
          .single();

        if (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
          // We'll still show success since billings were created, but log the error
        } else {
          console.log('Invoice created:', invoiceData);

          // Create invoice items
          if (invoiceData) {
            const invoiceItemData = invoiceItemsToSave.map(item => ({
              invoice_id: invoiceData.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price
            }));

            const { error: itemError } = await supabase
              .from('invoice_items')
              .insert(invoiceItemData);

            if (itemError) {
              console.error('Error creating invoice items:', itemError);
            } else {
              console.log(`Created ${invoiceItemData.length} invoice items`);
            }
          }
        }
      }

      console.log(`Successfully saved ${results.length} billing items`);

      // Reset form
      setInvoiceItems([
        { id: '1', service: '', category: '', quantity: 1, price: 0, total: 0 }
      ]);

      setIsCreateModalOpen(false);
      setIsConfirmationModalOpen(true);

      // Trigger refresh if callback provided
      if (onBillCreated) {
        onBillCreated();
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      alert(`Failed to create invoice: ${error.message || 'Please try again.'}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePreview = () => {
    // For now, just print as preview
    window.print();
  };

  const handleCreateReceipt = () => {
    // Close modals and navigate to receipt creation
    setIsConfirmationModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  // Handle receipt form submission
  const handleCreateReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate inputs
      if (!receiptAmount || parseFloat(receiptAmount) <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }

      // Save receipt to the database
      const supabase = createClient();

      // Verify the user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        alert('User not authenticated. Please log in again.');
        return;
      }

      console.log('Current user:', user.id);

      // Verify the hotel exists and belongs to the user
      const { data: hotelData, error: hotelCheckError } = await supabase
        .from('hotels')
        .select('id')
        .eq('id', hotelId)
        .single();

      if (hotelCheckError || !hotelData) {
        console.error('Hotel verification error:', hotelCheckError);
        alert('Invalid hotel. Please refresh the page and try again.');
        return;
      }

      // Insert the receipt into the database
      const { data, error: insertError } = await supabase
        .from('receipts')
        .insert([{
          hotel_id: hotelId,
          amount: parseFloat(receiptAmount),
          payment_method: paymentMethod,
          remark: paymentRemark || null,
        }]);

      if (insertError) {
        console.error('Error inserting receipt:', insertError);
        throw insertError;
      }

      // Show success message
      alert(`Receipt created successfully!\nAmount: ${receiptAmount}\nMethod: ${paymentMethod}\nRemark: ${paymentRemark}`);

      // Reset receipt form
      setReceiptAmount('');
      setPaymentMethod('');
      setPaymentRemark('');

      // Close modal
      setIsReceiptModalOpen(false);
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      alert(`Failed to create receipt: ${error.message || 'Please try again.'}`);
    }
  };

  const handleRefresh = () => {
    // Refresh the page to show new data
    window.location.reload();
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * 0.15; // Assuming 15% VAT
    const totalWithVat = subtotal + vatAmount;

    return {
      subtotal,
      vatAmount,
      totalWithVat
    };
  };

  const { subtotal, vatAmount, totalWithVat } = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold">Bills</h1>

            <div className="flex flex-wrap gap-3">
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateSearchParams({
                    ...filters,
                    search: e.target.value
                  });
                }}
                className="pl-10 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Invoice number"
                value={filters.invoiceNumber}
                onChange={(e) => {
                  const newFilters = {...filters, invoiceNumber: e.target.value};
                  setFilters(newFilters);
                  updateSearchParams({
                    search: searchTerm,
                    ...newFilters
                  });
                }}
                className="rounded-lg"
              />
              <Input
                placeholder="Contract number"
                value={filters.contractNumber}
                onChange={(e) => {
                  const newFilters = {...filters, contractNumber: e.target.value};
                  setFilters(newFilters);
                  updateSearchParams({
                    search: searchTerm,
                    ...newFilters
                  });
                }}
                className="rounded-lg"
              />
              <Input
                placeholder="Booking number"
                value={filters.bookingNumber}
                onChange={(e) => {
                  const newFilters = {...filters, bookingNumber: e.target.value};
                  setFilters(newFilters);
                  updateSearchParams({
                    search: searchTerm,
                    ...newFilters
                  });
                }}
                className="rounded-lg"
              />
            </div>
          </div>
        </header>

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>View</TableHead>
                  <TableHead>Tax Amount</TableHead>
                  <TableHead>VAT Included Amount</TableHead>
                  <TableHead>Total (excluding VAT)</TableHead>
                  <TableHead>Total (including VAT)</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contract Number</TableHead>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Invoice Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow
                      key={bill.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bill.total_amount * 0.15, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bill.total_amount * 0.15, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bill.total_amount, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(bill.total_amount * 1.15, currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Invoice</Badge>
                      </TableCell>
                      <TableCell>CON-{bill.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        {bill.booking?.guest ?
                          `${bill.booking.guest.first_name} ${bill.booking.guest.last_name}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(bill.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">INV-{bill.id.substring(0, 8)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-background overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Invoice</DialogTitle>
          </DialogHeader>

          <form className="space-y-6">
            {/* Invoice Details Section */}
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-medium text-lg mb-4">Invoice Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Invoice Date Section */}
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !invoiceDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={invoiceDate}
                        onSelect={setInvoiceDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">Invoice Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-8 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {invoiceItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 p-4 bg-muted/10 rounded-lg border"
                  >
                    {/* Service Selection */}
                    <div className="col-span-5">
                      <Label htmlFor={`service-${item.id}`}>Service</Label>
                      <Select value={item.service} onValueChange={(value) => updateItem(item.id, 'service', value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service, index) => (
                            <SelectItem key={`${service}-${index}`} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                          <SelectItem value="Laundry">Laundry</SelectItem>
                          <SelectItem value="Coffe Shop">Coffe Shop</SelectItem>
                          <SelectItem value="Restaurant">Restaurant</SelectItem>
                          <SelectItem value="Parking">Parking</SelectItem>
                          <SelectItem value="Gym">Gym</SelectItem>
                          <SelectItem value="WiFi">WiFi</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category Selection */}
                    <div className="col-span-4">
                      <Label htmlFor={`category-${item.id}`}>Category</Label>
                      <Select value={item.category} onValueChange={(value) => updateItem(item.id, 'category', value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category, index) => (
                            <SelectItem key={`${category}-${index}`} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                          <SelectItem value="Amenities">Amenities</SelectItem>
                          <SelectItem value="Transportation">Transportation</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-3">
                      <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                      <Input
                        type="number"
                        id={`quantity-${item.id}`}
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          updateItem(item.id, 'quantity', isNaN(value) || value < 1 ? 1 : value);
                        }}
                        className="h-10"
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-3">
                      <Label htmlFor={`price-${item.id}`}>Price</Label>
                      <Input
                        type="number"
                        id={`price-${item.id}`}
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          updateItem(item.id, 'price', isNaN(value) || value < 0 ? 0 : value);
                        }}
                        className="h-10"
                      />
                    </div>

                    {/* Total Calculation */}
                    <div className="col-span-3">
                      <Label htmlFor={`total-${item.id}`}>Total</Label>
                      <Input
                        id={`total-${item.id}`}
                        value={(item.quantity * item.price).toFixed(2)}
                        readOnly
                        className="h-10 bg-background font-medium"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-6 flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t pt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateInvoice}
                className="h-10 px-4 bg-primary hover:bg-primary/90"
              >
                Create Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Confirmation Modal */}
      <Dialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
        <DialogContent className="max-w-lg bg-background">
          <DialogHeader>
            <div className="flex flex-col items-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-xl">New Invoice Created</DialogTitle>
            </div>
          </DialogHeader>

          <section className="confirmation-content space-y-4">
            <div className="invoice-summary bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{format(new Date(), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Number</span>
                <span>{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Total</span>
                <span>{formatCurrency(totalWithVat, currency)}</span>
              </div>
            </div>

            <div className="button-actions grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 py-3"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                <span className="text-xs">Print</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 py-3"
                onClick={handleRefresh}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-xs">Refresh</span>
              </Button>
              <Button
                className="flex flex-col items-center gap-1 py-3"
                onClick={handleCreateReceipt}
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs">Create Receipt</span>
              </Button>
            </div>
          </section>
        </DialogContent>
      </Dialog>

      {/* Receipt Creation Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create Receipt</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateReceiptSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div>
              <Label htmlFor="payment-amount">Payment of Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                placeholder="Enter payment amount"
                className="h-10"
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="payment-method">Method of Payment</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Remark */}
            <div>
              <Label htmlFor="payment-remark">Remark</Label>
              <Input
                id="payment-remark"
                type="text"
                value={paymentRemark}
                onChange={(e) => setPaymentRemark(e.target.value)}
                placeholder="Enter any remarks"
                className="h-10"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 px-4 bg-primary hover:bg-primary/90"
              >
                Create Receipt
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}