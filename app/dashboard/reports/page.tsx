import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, BedDouble, CalendarDays, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: hotel } = await supabase.from("hotels").select("id, currency").eq("owner_id", user.id).single()

  if (!hotel) redirect("/dashboard")

  // Fetch data for reports
  const [bookingsResult, unitsResult, guestsResult, invoicesResult] = await Promise.all([
    supabase.from("bookings").select("*").eq("hotel_id", hotel.id),
    supabase.from("units").select("*").eq("hotel_id", hotel.id),
    supabase.from("guests").select("*").eq("hotel_id", hotel.id),
    supabase.from("invoices").select("*").eq("hotel_id", hotel.id).eq("status", "paid"),
  ])

  const bookings = bookingsResult.data || []
  const units = unitsResult.data || []
  const guests = guestsResult.data || []
  const paidInvoices = invoicesResult.data || []

  // Calculate statistics
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
  const totalBookings = bookings.length
  const occupiedUnits = units.filter((u) => u.status === "occupied").length
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0
  const totalGuests = guests.length

  // Calculate average booking value
  const completedBookings = bookings.filter((b) => b.status !== "cancelled" && b.total_amount)
  const avgBookingValue =
    completedBookings.length > 0
      ? Math.round(completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / completedBookings.length)
      : 0

  // Booking sources breakdown
  const sourceBreakdown = bookings.reduce(
    (acc, b) => {
      acc[b.source] = (acc[b.source] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const reports = [
    {
      title: "Total Revenue",
      value: `${totalRevenue.toLocaleString()} ${hotel.currency}`,
      description: "From paid invoices",
      icon: DollarSign,
      color: "bg-success/10 text-success",
    },
    {
      title: "Total Bookings",
      value: totalBookings.toString(),
      description: "All time reservations",
      icon: CalendarDays,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      description: `${occupiedUnits} of ${units.length} units occupied`,
      icon: BedDouble,
      color: "bg-warning/10 text-warning",
    },
    {
      title: "Total Guests",
      value: totalGuests.toString(),
      description: "Registered guests",
      icon: Users,
      color: "bg-accent/10 text-accent-foreground",
    },
    {
      title: "Avg Booking Value",
      value: `${avgBookingValue.toLocaleString()} ${hotel.currency}`,
      description: "Per completed booking",
      icon: TrendingUp,
      color: "bg-chart-1/10 text-chart-1",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analytics and performance metrics for your hotel</p>
      </div>

      {/* Billing Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing Reports
            </div>
            <Button asChild>
              <Link href="/dashboard/reports/billing">View All Billing Reports</Link>
            </Button>
          </CardTitle>
          <CardDescription>Comprehensive details of all billing transactions, payments, and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-bold">{paidInvoices.length}</p>
              <p className="text-sm text-muted-foreground">Total Paid Invoices</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} {hotel.currency}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-bold">{paidInvoices.filter(inv => inv.status === 'paid').length}</p>
              <p className="text-sm text-muted-foreground">Paid Invoices</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-2xl font-bold">{paidInvoices.filter(inv => inv.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending Invoices</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{report.title}</CardTitle>
              <div className={`rounded-full p-2 ${report.color}`}>
                <report.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.value}</div>
              <p className="text-xs text-muted-foreground">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Sources</CardTitle>
          <CardDescription>Distribution of bookings by channel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(sourceBreakdown).length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No booking data available</p>
            ) : (
              Object.entries(sourceBreakdown).map(([source, count]) => {
                const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0
                return (
                  <div key={source} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{source.replace("_", ".")}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Status */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Overview</CardTitle>
          <CardDescription>Current status of all bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {["pending", "confirmed", "checked_in", "checked_out", "cancelled"].map((status) => {
              const count = bookings.filter((b) => b.status === status).length
              return (
                <div key={status} className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm capitalize text-muted-foreground">{status.replace("_", " ")}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
