import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  MessageSquare,
  Clock,
  BedDouble,
  Phone,
  Mail,
  FileText,
  Receipt,
} from "lucide-react"
import { BookingActions } from "@/components/dashboard/booking-actions"
import { AccessCodePanel } from "@/components/dashboard/access-code-panel"
import { RecordPaymentButton } from "@/components/dashboard/record-payment-button"
import { CheckoutBillDetails } from "@/components/dashboard/checkout-bill-details"

const statusColors = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  checked_in: "bg-success/10 text-success border-success/20",
  checked_out: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      *,
      unit:units(id, name, floor, smart_lock_id, room_type:room_types(name, base_price)),
      guest:guests(*),
      hotel:hotels!inner(id, name, owner_id, currency, check_in_time, check_out_time)
    `)
    .eq("id", id)
    .single()

  if (error || !booking || booking.hotel?.owner_id !== user.id) {
    notFound()
  }

  // Get access codes for this booking
  const { data: accessCodes } = await supabase
    .from("access_codes")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })

  // Get payments for this booking
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })

  // Get tasks for this booking
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24),
  )

  const totalPaid = payments?.reduce((sum, p) => (p.status === "completed" ? sum + p.amount : sum), 0) || 0

  const balance = (booking.total_amount || 0) - totalPaid

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/bookings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {booking.guest?.first_name} {booking.guest?.last_name}
              </h1>
              <Badge variant="outline" className={statusColors[booking.status as keyof typeof statusColors]}>
                {booking.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Booking #{id.slice(0, 8)} · {booking.source.replace("_", ".")}
            </p>
          </div>
        </div>

        <BookingActions bookingId={id} status={booking.status} hasSmartLock={!!booking.unit?.smart_lock_id} />
      </div>

      {booking.status === 'checked_out' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <CardTitle>Checkout Details</CardTitle>
            </div>
            <Badge variant="outline">Completed</Badge>
          </CardHeader>
          <CardContent>
            <CheckoutBillDetails booking={booking} payments={payments || []} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stay Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Stay Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-medium">{formatDate(booking.check_in)}</p>
                    <p className="text-sm text-muted-foreground">After {booking.hotel?.check_in_time || "15:00"}</p>
                  </div>
                  {booking.checked_in_at && (
                    <div className="rounded-lg bg-success/10 p-3">
                      <p className="text-sm font-medium text-success">Checked In</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.checked_in_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-medium">{formatDate(booking.check_out)}</p>
                    <p className="text-sm text-muted-foreground">Before {booking.hotel?.check_out_time || "11:00"}</p>
                  </div>
                  {booking.checked_out_at && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm font-medium">Checked Out</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.checked_out_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-6 border-t pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {nights} night{nights !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.adults} adult{booking.adults !== 1 ? "s" : ""}
                  </span>
                  {booking.children > 0 && (
                    <span>
                      , {booking.children} child{booking.children !== 1 ? "ren" : ""}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                Room Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.unit ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{booking.unit.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.unit.room_type?.name} · Floor {booking.unit.floor || "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {booking.unit.room_type?.base_price} {booking.hotel?.currency}/night
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-muted-foreground">No room assigned</p>
                  <Button variant="outline" className="mt-2 bg-transparent">
                    Assign Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Codes */}
          {booking.unit?.smart_lock_id && (
            <AccessCodePanel
              bookingId={id}
              accessCodes={accessCodes || []}
              checkIn={booking.check_in}
              checkOut={booking.check_out}
            />
          )}

          {/* Notes & Special Requests */}
          {(booking.notes || booking.special_requests) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes & Special Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {booking.special_requests && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Special Requests</p>
                    <p>{booking.special_requests}</p>
                  </div>
                )}
                {booking.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Internal Notes</p>
                    <p>{booking.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          {tasks && tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                        </p>
                      </div>
                      <Badge variant={task.status === "completed" ? "secondary" : "default"}>{task.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Guest Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-lg font-semibold">
                  {booking.guest?.first_name} {booking.guest?.last_name}
                </p>
              </div>
              {booking.guest?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${booking.guest.email}`} className="hover:underline">
                    {booking.guest.email}
                  </a>
                </div>
              )}
              {booking.guest?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${booking.guest.phone}`} className="hover:underline">
                    {booking.guest.phone}
                  </a>
                </div>
              )}
              {booking.guest?.nationality && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Nationality:</span> {booking.guest.nationality}
                </div>
              )}
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href={`/dashboard/bookings/${id}/messages`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room ({nights} nights)</span>
                  <span>
                    {booking.total_amount || 0} {booking.hotel?.currency}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-medium">
                    {booking.total_amount || 0} {booking.hotel?.currency}
                  </span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Paid</span>
                  <span>
                    {totalPaid} {booking.hotel?.currency}
                  </span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Balance Due</span>
                    <span>
                      {balance} {booking.hotel?.currency}
                    </span>
                  </div>
                )}
              </div>

              {payments && payments.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-2 text-sm font-medium">Payment History</p>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {payment.method} - {new Date(payment.created_at).toLocaleDateString()}
                        </span>
                        <span className={payment.status === "completed" ? "text-success" : ""}>
                          {payment.amount} {booking.hotel?.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <RecordPaymentButton
                bookingId={id}
                bookingAmount={booking.total_amount || 0}
                currency={booking.hotel?.currency || 'SAR'}
                guestName={`${booking.guest?.first_name || ''} ${booking.guest?.last_name || ''}`.trim()}
                checkIn={booking.check_in}
                checkOut={booking.check_out}
              />
            </CardContent>
          </Card>

          {/* Source Info */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="font-medium">{booking.source.replace("_", ".")}</span>
                </div>
                {booking.external_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">External ID</span>
                    <span className="font-mono text-xs">{booking.external_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
