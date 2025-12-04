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
  Filter,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import BillingReportsClient from "@/components/dashboard/billing-reports-client";

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

  // Fetch all invoices for this hotel
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("hotel_id", hotel.id)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  // Fetch invoice items for the invoices
  const invoiceIds = invoices?.map(inv => inv.id) || [];
  let invoiceItems: InvoiceItem[] = [];

  if (invoiceIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", invoiceIds)
      .order("created_at", { ascending: false });

    invoiceItems = itemsData || [];
  }

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  // Fetch all billings for this hotel (the new table)
  const { data: billings } = await supabase
    .from("billings")
    .select("*")
    .eq("hotel_id", hotel.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  // Fetch receipts for billings
  const billingIds = billings?.map(b => b.id) || [];
  let receipts: Receipt[] = [];

  if (billingIds.length > 0) {
    const { data: receiptData } = await supabase
      .from("receipts")
      .select("*")
      .in("billing_id", billingIds)
      .order("created_at", { ascending: false });

    receipts = receiptData || [];
  }

  // Calculate statistics for billings and receipts
  const totalBillings = billings?.length || 0;
  const totalBillingRevenue = billings?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;

  const totalReceipts = receipts?.length || 0;
  const totalReceiptRevenue = receipts?.reduce((sum, receipt) => sum + receipt.amount, 0) || 0;

  // Group payments by method
  const paymentMethods = payments.reduce(
    (acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Group billings by category
  const billingCategories = billings?.reduce(
    (acc, billing) => {
      acc[billing.category] = (acc[billing.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <BillingReportsClient
      hotelId={hotel.id}
      currency={hotel.currency}
      startDate={startDate}
      endDate={endDate}
      bookings={bookings || []}
      payments={payments}
      invoices={invoices || []}
      invoiceItems={invoiceItems}
      billings={billings || []}
      receipts={receipts || []}
      billingCategories={billingCategories}
    />
  );
}