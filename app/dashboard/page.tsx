import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  BedDouble,
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { HotelSetupForm } from "@/components/dashboard/hotel-setup-form"
import DashboardCharts from "@/components/dashboard/dashboard-charts"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: hotel } = await supabase.from("hotels").select("*").eq("owner_id", user.id).single()

  // If no hotel, show setup form
  if (!hotel) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to WhelHost</h1>
          <p className="mt-2 text-muted-foreground">Let's set up your hotel to get started</p>
        </div>
        <HotelSetupForm userId={user.id} />
      </div>
    )
  }

  // Fetch dashboard statistics
  const [unitsResult, bookingsResult, tasksResult] = await Promise.all([
    supabase.from("units").select("id, status").eq("hotel_id", hotel.id),
    supabase.from("bookings").select("id, status, total_amount, check_in, check_out").eq("hotel_id", hotel.id),
    supabase.from("tasks").select("id, status, priority").eq("hotel_id", hotel.id).eq("status", "pending"),
  ])

  const units = unitsResult.data || []
  const bookings = bookingsResult.data || []
  const pendingTasks = tasksResult.data || []

  const totalUnits = units.length
  const occupiedUnits = units.filter((u) => u.status === "occupied").length
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const today = new Date().toISOString().split("T")[0]
  const todayArrivals = bookings.filter((b) => b.check_in === today && b.status === "confirmed").length
  const todayDepartures = bookings.filter((b) => b.check_out === today && b.status === "checked_in").length

  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.total_amount || 0), 0)

  const stats = [
    {
      title: "Total Units",
      value: totalUnits,
      description: `${occupiedUnits} occupied`,
      icon: BedDouble,
      trend: null,
      href: "/dashboard/units",
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      description: "Current occupancy",
      icon: TrendingUp,
      trend: occupancyRate >= 70 ? "up" : "down",
      href: "/dashboard/reports",
    },
    {
      title: "Total Bookings",
      value: bookings.length,
      description: `${todayArrivals} arrivals today`,
      icon: CalendarDays,
      trend: null,
      href: "/dashboard/bookings",
    },
    {
      title: "Revenue",
      value: `${totalRevenue.toLocaleString()} ${hotel.currency}`,
      description: "Total revenue",
      icon: DollarSign,
      trend: "up",
      href: "/dashboard/reports",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{hotel.name}</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-success" />}
                {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-destructive" />}
                <span>{stat.description}</span>
              </div>
            </CardContent>
            <Link href={stat.href} className="absolute inset-0" aria-label={`View ${stat.title}`} />
          </Card>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Activity
            </CardTitle>
            <CardDescription>Arrivals and departures for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="font-medium">Arrivals</p>
                  <p className="text-sm text-muted-foreground">Expected check-ins</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{todayArrivals}</p>
                  <Badge variant="secondary">Today</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="font-medium">Departures</p>
                  <p className="text-sm text-muted-foreground">Expected check-outs</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{todayDepartures}</p>
                  <Badge variant="secondary">Today</Badge>
                </div>
              </div>
            </div>
            <Button variant="link" className="mt-4 p-0" asChild>
              <Link href="/dashboard/bookings">
                View all bookings
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Tasks
            </CardTitle>
            <CardDescription>Tasks requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-success/10 p-3">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending tasks at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm">Task #{task.id.slice(0, 8)}</span>
                    <Badge
                      variant={
                        task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Button variant="link" className="mt-4 p-0" asChild>
              <Link href="/dashboard/tasks">
                View all tasks
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Performance Analytics</CardTitle>
            <CardDescription>Visual insights into your hotel's performance and billing trends</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCharts hotelId={hotel.id} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/dashboard/bookings/new">
                <CalendarDays className="h-6 w-6" />
                <span>New Booking</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/dashboard/units/new">
                <BedDouble className="h-6 w-6" />
                <span>Add Unit</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/dashboard/invoices/new">
                <DollarSign className="h-6 w-6" />
                <span>Create Invoice</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/dashboard/tasks/new">
                <Users className="h-6 w-6" />
                <span>Assign Task</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
