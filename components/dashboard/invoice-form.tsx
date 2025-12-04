"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { Guest, Booking } from "@/lib/types"

interface InvoiceFormProps {
  hotelId: string
  currency: string
  guests: Guest[]
  bookings: (Booking & { guest?: Guest | null })[]
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

export function InvoiceForm({ hotelId, currency, guests, bookings }: InvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    guest_id: "",
    booking_id: "",
    status: "draft",
    due_date: "",
    notes: "",
    tax_rate: "15",
  })
  const [items, setItems] = useState<InvoiceItem[]>([{ id: "1", description: "", quantity: 1, unit_price: 0 }])

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = subtotal * (Number.parseFloat(formData.tax_rate) / 100)
  const total = subtotal + taxAmount

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: "", quantity: 1, unit_price: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleBookingSelect = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId)
    if (booking) {
      setFormData({ ...formData, booking_id: bookingId, guest_id: booking.guest_id || "" })

      if (booking.total_amount) {
        const checkIn = new Date(booking.check_in)
        const checkOut = new Date(booking.check_out)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        const nightlyRate = booking.total_amount / nights

        setItems([
          {
            id: "1",
            description: `Room accommodation (${nights} nights)`,
            quantity: nights,
            unit_price: nightlyRate,
          },
        ])
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number", { hotel_uuid: hotelId })

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        hotel_id: hotelId,
        guest_id: formData.guest_id || null,
        booking_id: formData.booking_id || null,
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        status: formData.status,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
      })
      .select()
      .single()

    if (invoice && !error) {
      // Insert invoice items
      await supabase.from("invoice_items").insert(
        items
          .filter((item) => item.description && item.unit_price > 0)
          .map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
          })),
      )

      // Create a notification for the new invoice
      const supabaseClient = createClient();
      await supabaseClient
        .from('notifications')
        .insert([{
          hotel_id: hotelId,
          subject: `New Invoice Created: ${invoice?.invoice_number || 'INV-' + Date.now()}`,
          content: `Invoice #${invoice?.invoice_number || 'unknown'} has been created with total amount of ${total} ${currency}`,
          message: `Invoice #${invoice?.invoice_number || 'unknown'} has been created with total amount of ${total} ${currency}`,
          notification_type: 'invoice'
        }]);
    }

    router.push("/dashboard/invoices")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest/Booking Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Link to Booking (Optional)</Label>
              <Select value={formData.booking_id} onValueChange={handleBookingSelect}>
                <SelectTrigger className="border-white">
                  <SelectValue placeholder="Select a booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.guest?.first_name} {booking.guest?.last_name} -{" "}
                      {new Date(booking.check_in).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Guest</Label>
              <Select
                value={formData.guest_id}
                onValueChange={(value) => setFormData({ ...formData, guest_id: value })}
              >
                <SelectTrigger className="border-white">
                  <SelectValue placeholder="Select a guest" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.first_name} {guest.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="border-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Room accommodation, services, etc."
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  className="border-white"
                />
              </div>
              <div className="w-24 space-y-2">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                  className="border-white"
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Price ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateItem(item.id, "unit_price", Number.parseFloat(e.target.value) || 0)}
                  className="border-white"
                />
              </div>
              <div className="w-32 text-right space-y-2">
                <Label>Total</Label>
                <p className="h-10 flex items-center justify-end font-medium">
                  {(item.quantity * item.unit_price).toLocaleString()} {currency}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addItem} className="w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>
                {subtotal.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Tax</span>
                <Input
                  type="number"
                  className="w-16 h-8 border-white"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                />
                <span>%</span>
              </div>
              <span>
                {taxAmount.toLocaleString()} {currency}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>
                {total.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes or payment instructions..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="border-white"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Invoice"
          )}
        </Button>
      </div>
    </form>
  )
}
