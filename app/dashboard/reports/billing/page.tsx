import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
  CreditCard, 
  Download, 
  Printer, 
  Share2, 
  TrendingDown, 
  TrendingUp,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";

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

interface BillingReportProps {
  searchParams: {
    from?: string;
    to?: string;
    status?: string;
    method?: string;
  };
}

export default async function BillingReportsPage({ searchParams }: BillingReportProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: hotel } = await supabase.from("hotels").select("id, currency").eq("owner_id", user.id).single();

  if (!hotel) redirect("/dashboard");

  // Calculate date range for filtering
  const startDate = searchParams.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to last 30 days
  const endDate = searchParams.to || new Date().toISOString().split('T')[0]; // Default to today

  // Fetch bookings with payments
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      unit:units(name),
      guest:guests(first_name, last_name)
    `)
    .eq("hotel_id", hotel.id)
    .gte("check_in", startDate)
    .lte("check_out", endDate)
    .order("created_at", { ascending: false });

  // Fetch payments associated with bookings
  const bookingIds = bookings?.map(b => b.id) || [];
  let payments: Payment[] = [];

  if (bookingIds.length > 0) {
    const { data: paymentData } = await supabase
      .from("payments")
      .select("*")
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    payments = paymentData || [];
  }

  // Calculate statistics
  const totalRevenue = payments
    .filter(p => p.status === "completed")
    .reduce((sum, payment) => sum + payment.amount, 0);
  
  const totalPayments = payments.length;
  const successfulPayments = payments.filter(p => p.status === "completed").length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const failedPayments = payments.filter(p => p.status === "failed").length;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  // Group payments by method
  const paymentMethods = payments.reduce(
    (acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  // Handle download as PDF functionality
  const handleDownloadPDF = () => {
    window.print();
  };

  // Handle download as CSV functionality
  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = ['Booking ID', 'Guest Name', 'Room', 'Amount', 'Method', 'Date', 'Status'];
    const rows = payments.map(payment => {
      const booking = bookings?.find(b => b.id === payment.booking_id);
      return [
        booking?.id.substring(0, 8) || '',
        `${booking?.guest?.first_name || ''} ${booking?.guest?.last_name || ''}`.trim(),
        booking?.unit?.name || '',
        payment.amount,
        payment.method,
        formatDate(payment.created_at),
        payment.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `billing-reports-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Billing Reports',
        text: `Billing reports for ${hotel.name} from ${startDate} to ${endDate}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Report URL copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Billing Reports</h1>
          <p className="text-muted-foreground">Detailed view of all billing transactions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share
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
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} {hotel.currency}</div>
            <p className="text-xs text-muted-foreground">From completed payments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">All payment transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulPayments}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments + failedPayments}</div>
            <p className="text-xs text-muted-foreground">Pending/Failed payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(paymentMethods).length === 0 ? (
              <p className="py-8 text-center text-muted-foreground col-span-full">No payment data available</p>
            ) : (
              Object.entries(paymentMethods).map(([method, count]) => (
                <div key={method} className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm capitalize text-muted-foreground">{method.replace("_", " ")}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Transactions
            </CardTitle>
            <p className="text-sm text-muted-foreground">All payment transactions for the selected period</p>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No payment transactions</h3>
              <p className="text-muted-foreground">No billing data found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const booking = bookings?.find(b => b.id === payment.booking_id);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {booking?.id ? booking.id.substring(0, 8) : '-'}
                        </TableCell>
                        <TableCell>
                          {booking?.guest?.first_name && booking?.guest?.last_name
                            ? `${booking.guest.first_name} ${booking.guest.last_name}`
                            : '-'}
                        </TableCell>
                        <TableCell>{booking?.unit?.name || '-'}</TableCell>
                        <TableCell>{payment.amount} {hotel.currency}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {payment.method.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(payment.created_at)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === 'completed' ? 'default' : 
                                   payment.status === 'pending' ? 'secondary' : 'destructive'}
                          >
                            {payment.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.notes || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Billing Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">Billing information for all bookings</p>
          </div>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">No bookings found</h3>
              <p className="text-muted-foreground">No booking data found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {booking.guest?.first_name && booking.guest?.last_name
                          ? `${booking.guest.first_name} ${booking.guest.last_name}`
                          : '-'}
                      </TableCell>
                      <TableCell>{booking.unit?.name || '-'}</TableCell>
                      <TableCell>{booking.total_amount || 0} {hotel.currency}</TableCell>
                      <TableCell>{formatDate(booking.check_in)}</TableCell>
                      <TableCell>{formatDate(booking.check_out)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {booking.source.replace("_", ".")}
                        </Badge>
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