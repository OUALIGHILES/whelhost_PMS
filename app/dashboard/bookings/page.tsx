import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, CalendarDays, MoreVertical, Eye, Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const statusColors = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  checked_in: "bg-success/10 text-success border-success/20",
  checked_out: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
}

const sourceColors = {
  direct: "bg-primary/10 text-primary",
  booking_com: "bg-blue-500/10 text-blue-500",
  airbnb: "bg-rose-500/10 text-rose-500",
  expedia: "bg-yellow-500/10 text-yellow-500",
  other: "bg-muted text-muted-foreground",
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: hotel } = await supabase.from("hotels").select("id, currency").eq("owner_id", user.id).single()

  if (!hotel) redirect("/dashboard")

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      unit:units(name),
      guest:guests(first_name, last_name, email)
    `)
    .eq("hotel_id", hotel.id)
    .order("check_in", { ascending: false })

  const today = new Date().toISOString().split("T")[0]
  const upcomingBookings = bookings?.filter((b) => b.check_in >= today && b.status !== "cancelled") || []
  const activeBookings = bookings?.filter((b) => b.status === "checked_in") || []
  const pastBookings = bookings?.filter((b) => b.check_out < today || b.status === "checked_out") || []

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const BookingTable = ({ data }: { data: typeof bookings }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Check In</TableHead>
          <TableHead>Check Out</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>
              <div>
                <p className="font-medium">
                  {booking.guest?.first_name} {booking.guest?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{booking.guest?.email}</p>
              </div>
            </TableCell>
            <TableCell>{booking.unit?.name || "-"}</TableCell>
            <TableCell>{formatDate(booking.check_in)}</TableCell>
            <TableCell>{formatDate(booking.check_out)}</TableCell>
            <TableCell>
              <Badge variant="secondary" className={sourceColors[booking.source as keyof typeof sourceColors]}>
                {booking.source.replace("_", ".")}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={statusColors[booking.status as keyof typeof statusColors]}>
                {booking.status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>{booking.total_amount ? `${booking.total_amount} ${hotel.currency}` : "-"}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/bookings/${booking.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/bookings/${booking.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) || (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              No bookings found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage reservations and guest bookings</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-success/10 p-2">
              <CalendarDays className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeBookings.length}</p>
              <p className="text-sm text-muted-foreground">Active (Checked In)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-muted p-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pastBookings.length}</p>
              <p className="text-sm text-muted-foreground">Past</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>{bookings?.length || 0} total bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeBookings.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
              <TabsTrigger value="all">All ({bookings?.length || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              <BookingTable data={upcomingBookings} />
            </TabsContent>
            <TabsContent value="active" className="mt-4">
              <BookingTable data={activeBookings} />
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              <BookingTable data={pastBookings} />
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <BookingTable data={bookings} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
