'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface Receipt {
  id: string;
  hotel_id: string;
  billing_id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  remarks: string;
  created_at: string;
  updated_at: string;
}

interface Billing {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  date: string;
}

interface ReceiptItemsClientProps {
  receipts: Receipt[];
  currency: string;
  hotelName: string;
}

export default function ReceiptItemsClient({
  receipts,
  currency,
  hotelName
}: ReceiptItemsClientProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate statistics
  const totalReceipts = receipts?.length || 0;
  const totalReceiptRevenue = receipts?.reduce((sum, receipt) => sum + receipt.amount, 0) || 0;

  // Group by payment method
  const paymentMethods = receipts?.reduce(
    (acc, receipt) => {
      acc[receipt.payment_method] = (acc[receipt.payment_method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
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
            <title>Receipts Report</title>
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
              <h1>Receipts Report</h1>
              <p>Hotel: ${hotelName}</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>Total Receipts</h3>
                <p>${totalReceipts}</p>
              </div>
              <div class="stat-card">
                <h3>Total Revenue</h3>
                <p>${formatCurrency(totalReceiptRevenue, currency)}</p>
              </div>
              ${Object.entries(paymentMethods).map(([method, count]) => `
                <div class="stat-card">
                  <h3>${method}</h3>
                  <p>${count}</p>
                </div>
              `).join('')}
            </div>
            <h2>All Receipts</h2>
            <table>
              <thead>
                <tr>
                  <th>Receipt ID</th>
                  <th>Date</th>
                  <th>Billing Category</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${receipts.map(receipt => `
                  <tr>
                    <td>${receipt.id.substring(0, 8)}</td>
                    <td>${formatDate(receipt.created_at)}</td>
                    <td>${'N/A'}</td>
                    <td>${formatCurrency(receipt.amount, currency)}</td>
                    <td>${receipt.payment_method}</td>
                    <td>${receipt.remarks || '-'}</td>
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
          <h1 className="text-3xl font-bold">Receipts</h1>
          <p className="text-muted-foreground">Manage and view all receipts</p>
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
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts}</div>
            <p className="text-xs text-muted-foreground">Total receipts created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceiptRevenue, currency)}</div>
            <p className="text-xs text-muted-foreground">From all receipts</p>
          </CardContent>
        </Card>

        {Object.entries(paymentMethods).map(([method, count]) => (
          <Card key={method}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium capitalize">{method}</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">{method} receipts</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receipts Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Receipts
            </CardTitle>
            <p className="text-sm text-muted-foreground">All receipts for the selected period</p>
          </div>
        </CardHeader>
        <CardContent>
          {receipts && receipts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No receipts found</h3>
              <p className="text-muted-foreground">No receipts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Billing Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts?.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {receipt.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{formatDate(receipt.created_at)}</TableCell>
                      <TableCell>N/A</TableCell>
                      <TableCell>{formatCurrency(receipt.amount, currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {receipt.payment_method.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{receipt.remarks || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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