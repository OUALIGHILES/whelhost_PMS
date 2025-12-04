import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Plus, 
  FileText, 
  MoreVertical, 
  Eye, 
  Download, 
  DollarSign,
  Search,
  Filter,
  User,
  Calendar,
  CreditCard,
  Hash,
  MessageSquare,
  FileInput
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary border-primary/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground",
};

// Adding translation function
const t = (key: string) => {
  const translations: Record<string, string> = {
    'search': 'بحث...',
    'filter': 'تصفية',
    'user': 'المستخدم',
    'voucherNo': 'رقم السند',
    'voucherDate': 'تاريخ السند',
    'paymentType': 'نوع الدفع',
    'type': 'النوع',
    'currency': 'العملة',
    'value': 'القيمة',
    'customerInput': 'مدخلات العميل',
    'for': 'من أجل',
    'invoiceNo': 'رقم الفاتورة',
    'entryNo': 'رقم القيد',
    'more': 'المزيد +',
    'totalVouchers': 'إجمالي الإيصالات',
    'allReceipts': 'جميع الإيصالات',
  };
  
  return translations[key] || key;
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: hotel } = await supabase.from("hotels").select("id, currency").eq("owner_id", user.id).single();

  if (!hotel) redirect("/dashboard");

  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      guest:guests(first_name, last_name, email),
      booking:bookings(check_in, check_out)
    `)
    .eq("hotel_id", hotel.id)
    .order("created_at", { ascending: false });

  const totalRevenue = invoices?.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0) || 0;
  const pendingAmount = invoices?.filter((i) => i.status === "sent").reduce((sum, i) => sum + i.total_amount, 0) || 0;
  const overdueAmount = invoices?.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.total_amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header/Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('allReceipts')}</h1>
          <p className="text-muted-foreground">Manage billing and track payments</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/invoices/new/receipt">
              <Plus className="mr-2 h-4 w-4" />
              Create Receipt
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Total Vouchers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t('totalVouchers')}</CardTitle>
            <p className="text-sm text-muted-foreground">{invoices?.length || 0} total invoices</p>
          </div>
          <Badge variant="outline">{invoices?.length || 0}</Badge>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-success/10 p-2">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {totalRevenue.toLocaleString()} {hotel.currency}
              </p>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {pendingAmount.toLocaleString()} {hotel.currency}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-destructive/10 p-2">
              <DollarSign className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {overdueAmount.toLocaleString()} {hotel.currency}
              </p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search/Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('search')}
                className="pl-10 rounded-lg"
              />
            </div>
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('user')}
                className="pl-10 rounded-lg"
              />
            </div>
            
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('voucherNo')}
                className="pl-10 rounded-lg"
              />
            </div>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('filter')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('allReceipts')}</CardTitle>
          <p className="text-sm text-muted-foreground">Detailed summary of all vouchers</p>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No invoices yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">Create your first invoice to start tracking payments</p>
              <Button asChild>
                <Link href="/dashboard/invoices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><FileText className="h-4 w-4 inline mr-1" /> {t('voucherNo')}</TableHead>
                  <TableHead><FileText className="h-4 w-4 inline mr-1" /> {t('type')}</TableHead>
                  <TableHead><Calendar className="h-4 w-4 inline mr-1" /> {t('voucherDate')}</TableHead>
                  <TableHead><CreditCard className="h-4 w-4 inline mr-1" /> {t('paymentType')}</TableHead>
                  <TableHead><DollarSign className="h-4 w-4 inline mr-1" /> {t('value')}</TableHead>
                  <TableHead><User className="h-4 w-4 inline mr-1" /> {t('customerInput')}</TableHead>
                  <TableHead><MessageSquare className="h-4 w-4 inline mr-1" /> {t('for')}</TableHead>
                  <TableHead>{t('more')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[invoice.status as keyof typeof statusColors]}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell className="font-medium">
                      {invoice.total_amount.toLocaleString()} {hotel.currency}
                    </TableCell>
                    <TableCell>
                      {invoice.guest ? (
                        <div>
                          <p>
                            {invoice.guest.first_name} {invoice.guest.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{invoice.guest.email}</p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{invoice.notes || "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/invoices/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}