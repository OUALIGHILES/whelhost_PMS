'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  source: string;
  status: string;
  created_at: string;
  unit?: {
    name: string;
  };
  guest?: {
    first_name: string;
    last_name: string;
  };
  hotel?: {
    currency: string;
  };
}

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  reference?: string;
  notes?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  notes?: string;
}

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface Billing {
  id: string;
  hotel_id: string;
  booking_id: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  date: string;
  created_at: string;
}

interface Receipt {
  id: string;
  hotel_id: string;
  billing_id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  remarks: string;
  created_at: string;
}

interface BillingReportsClientProps {
  hotelId: string;
  currency: string;
  startDate: string;
  endDate: string;
  bookings: Booking[];
  payments: Payment[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  billings: Billing[];
  receipts: Receipt[];
  billingCategories: Record<string, number>;
}

export default function BillingReportsClient({
  hotelId,
  currency,
  startDate,
  endDate,
  bookings,
  payments,
  invoices,
  invoiceItems,
  billings,
  receipts,
  billingCategories
}: BillingReportsClientProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate statistics
  const totalRevenue = payments
    .filter(p => p.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid').length || 0;
  const totalInvoiceRevenue = invoices
    ?.filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

  const totalPayments = payments.length;
  const successfulPayments = payments.filter(p => p.status === "completed").length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const failedPayments = payments.filter(p => p.status === "failed").length;

  // Calculate billing statistics
  const totalBillings = billings?.length || 0;
  const totalBillingRevenue = billings?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
  
  const totalReceipts = receipts?.length || 0;
  const totalReceiptRevenue = receipts?.reduce((sum, receipt) => sum + receipt.amount, 0) || 0;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF download using browser print functionality
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Billing Reports</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
              .stat-card { border: 1px solid #ddd; padding: 10px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Billing Reports</h1>
              <p>Period: ${format(new Date(startDate), "MMM dd, yyyy")} to ${format(new Date(endDate), "MMM dd, yyyy")}</p>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>Total Revenue</h3>
                <p>${formatCurrency(totalInvoiceRevenue + totalBillingRevenue, currency)}</p>
                <small>Total from invoices & billings</small>
              </div>
              <div class="stat-card">
                <h3>Total Billings</h3>
                <p>${totalBillings}</p>
                <small>Billings created</small>
              </div>
              <div class="stat-card">
                <h3>Billing Revenue</h3>
                <p>${formatCurrency(totalBillingRevenue, currency)}</p>
                <small>Revenue from billings</small>
              </div>
              <div class="stat-card">
                <h3>Receipts</h3>
                <p>${totalReceipts}</p>
                <small>Receipts created</small>
              </div>
            </div>
            <h2>Billings</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${billings.map(billing => `
                  <tr>
                    <td>${format(new Date(billing.date), "MMM dd, yyyy")}</td>
                    <td>${billing.category}</td>
                    <td>${billing.description}</td>
                    <td>${billing.quantity}</td>
                    <td>${formatCurrency(billing.unit_price, currency)}</td>
                    <td>${formatCurrency(billing.total_amount, currency)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <h2>Receipts</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Remarks</th>
                  <th>Billing ID</th>
                </tr>
              </thead>
              <tbody>
                ${receipts.map(receipt => `
                  <tr>
                    <td>${format(new Date(receipt.created_at), "MMM dd, yyyy")}</td>
                    <td>${formatCurrency(receipt.amount, currency)}</td>
                    <td>${receipt.payment_method}</td>
                    <td>${receipt.remarks}</td>
                    <td>${receipt.billing_id?.substring(0, 8)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Billing Reports</h1>
          <p className="text-muted-foreground">Detailed view of all billing transactions</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvoiceRevenue + totalBillingRevenue, currency)}</div>
            <p className="text-xs text-muted-foreground">Total from invoices & billings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Billings</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBillings}</div>
            <p className="text-xs text-muted-foreground">Billings created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Billing Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBillingRevenue, currency)}</div>
            <p className="text-xs text-muted-foreground">Revenue from billings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receipts</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts}</div>
            <p className="text-xs text-muted-foreground">Receipts created</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Entries Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing Entries
            </CardTitle>
            <p className="text-sm text-muted-foreground">All billing entries for the selected period</p>
          </div>
        </CardHeader>
        <CardContent>
          {billings.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No billing entries</h3>
              <p className="text-muted-foreground">No billing entries found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billings.map((billing) => (
                    <TableRow key={billing.id}>
                      <TableCell>{format(new Date(billing.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="capitalize">{billing.category}</TableCell>
                      <TableCell>{billing.description}</TableCell>
                      <TableCell>{billing.quantity}</TableCell>
                      <TableCell>{formatCurrency(billing.unit_price, currency)}</TableCell>
                      <TableCell>{formatCurrency(billing.total_amount, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Receipts
            </CardTitle>
            <p className="text-sm text-muted-foreground">All receipts for the selected period</p>
          </div>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No receipts</h3>
              <p className="text-muted-foreground">No receipts found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Billing ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>{format(new Date(receipt.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{formatCurrency(receipt.amount, currency)}</TableCell>
                      <TableCell className="capitalize">{receipt.payment_method}</TableCell>
                      <TableCell>{receipt.remarks}</TableCell>
                      <TableCell>{receipt.billing_id?.substring(0, 8)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}