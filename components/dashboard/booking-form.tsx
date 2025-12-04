"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Loader2, UserPlus } from "lucide-react"
import type { Unit, Guest, Booking } from "@/lib/types"
import { isUnitAvailable } from "@/lib/utils/unit-availability"

interface BookingFormProps {
  hotelId: string
  currency: string
  units: (Unit & { room_type?: { name: string; base_price: number } | null })[]
  guests: Guest[]
  booking?: Booking
}

export function BookingForm({ hotelId, currency, units, guests, booking }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNewGuest, setShowNewGuest] = useState(false)
  const [formData, setFormData] = useState({
    unit_id: booking?.unit_id || "",
    guest_id: booking?.guest_id || "",
    check_in: booking?.check_in || "",
    check_out: booking?.check_out || "",
    adults: booking?.adults?.toString() || "1",
    children: booking?.children?.toString() || "0",
    source: booking?.source || "direct",
    status: booking?.status || "pending",
    total_amount: booking?.total_amount?.toString() || "",
    notes: booking?.notes || "",
    special_requests: booking?.special_requests || "",
  })

  const [newGuest, setNewGuest] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    nationality: "USA",
    id_number: "",
  })

  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unitAvailable, setUnitAvailable] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>(units);

  const selectedUnit = units.find((u) => u.id === formData.unit_id)

  // Check unit availability when unit_id, check_in or check_out changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.unit_id && formData.check_in && formData.check_out) {
        setIsCheckingAvailability(true);
        try {
          const available = await isUnitAvailable(
            formData.unit_id,
            formData.check_in,
            formData.check_out
          );

          setUnitAvailable(available);
          if (!available) {
            setAvailabilityError('The selected unit is not available for the selected dates.');
          } else {
            setAvailabilityError(null);
          }
        } catch (error) {
          console.error('Error checking availability:', error);
          setAvailabilityError('Error checking availability. Please try again.');
          setUnitAvailable(false);
        } finally {
          setIsCheckingAvailability(false);
        }
      } else {
        setUnitAvailable(true);
        setAvailabilityError(null);
      }
    };

    if (formData.unit_id && formData.check_in && formData.check_out) {
      checkAvailability();
    } else {
      setUnitAvailable(true);
      setAvailabilityError(null);
    }
  }, [formData.unit_id, formData.check_in, formData.check_out]);

  // Update available units when check_in/check_out changes
  useEffect(() => {
    const updateAvailableUnits = async () => {
      if (formData.check_in && formData.check_out) {
        try {
          const availableUnitsList = [];
          for (const unit of units) {
            const isAvail = await isUnitAvailable(unit.id, formData.check_in, formData.check_out);
            // Include unit if it's available OR if it's the currently selected unit for editing
            if (isAvail || unit.id === formData.unit_id) {
              availableUnitsList.push(unit);
            }
          }
          setAvailableUnits(availableUnitsList);
        } catch (error) {
          console.error('Error updating available units:', error);
          // Fall back to all units if there's an error
          setAvailableUnits(units);
        }
      } else {
        // If no dates selected, show all units
        setAvailableUnits(units);
      }
    };

    updateAvailableUnits();
  }, [formData.check_in, formData.check_out, formData.unit_id, units]);

  const calculateTotal = () => {
    if (!formData.check_in || !formData.check_out || !selectedUnit?.room_type?.base_price) return
    const checkIn = new Date(formData.check_in)
    const checkOut = new Date(formData.check_out)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    if (nights > 0) {
      const total = nights * selectedUnit.room_type.base_price
      setFormData((prev) => ({ ...prev, total_amount: total.toString() }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if unit is available before submitting
    if (formData.unit_id && formData.check_in && formData.check_out) {
      const available = await isUnitAvailable(
        formData.unit_id,
        formData.check_in,
        formData.check_out
      );

      if (!available) {
        alert('The selected unit is not available for the selected dates. Please select another unit or adjust your dates.');
        return;
      }
    }

    setLoading(true)

    const supabase = createClient()
    let guestId = formData.guest_id

    // Create new guest if needed
    if (showNewGuest && newGuest.first_name && newGuest.last_name) {
      const { data: newGuestData } = await supabase
        .from("guests")
        .insert({
          hotel_id: hotelId,
          ...newGuest,
        })
        .select()
        .single()

      if (newGuestData) {
        guestId = newGuestData.id
      }
    }

    // Prepare booking data, excluding hotel_id for updates to prevent unauthorized changes
    const baseBookingData = {
      unit_id: formData.unit_id || null,
      guest_id: guestId || null,
      check_in: formData.check_in,
      check_out: formData.check_out,
      adults: Number.parseInt(formData.adults),
      children: Number.parseInt(formData.children),
      source: formData.source,
      status: formData.status,
      total_amount: formData.total_amount ? Number.parseFloat(formData.total_amount) : null,
      notes: formData.notes || null,
      special_requests: formData.special_requests || null,
    }

    try {
      if (booking) {
        // Update booking via API route - add hotel_id for validation but this will be ignored by the API
        const bookingUpdateData = {
          ...baseBookingData,
          hotel_id: hotelId, // Include for form consistency but the API will validate based on existing booking
        }

        const response = await fetch(`/api/v1/bookings/${booking.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingUpdateData),
        })

        if (!response.ok) {
          // Check if the response is JSON or HTML
          const contentType = response.headers.get('content-type')
          let errorMessage = 'Failed to update booking'

          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // If not JSON, try to get text, or use a default error
            const errorText = await response.text()
            errorMessage = errorText || `HTTP Error: ${response.status}`
          }

          throw new Error(errorMessage)
        }
      } else {
        // Create new booking via API route
        const bookingCreateData = {
          ...baseBookingData,
          hotel_id: hotelId,
        }

        const response = await fetch('/api/v1/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingCreateData),
        })

        if (!response.ok) {
          // Check if the response is JSON or HTML
          const contentType = response.headers.get('content-type')
          let errorMessage = 'Failed to create booking'

          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            // If not JSON, try to get text, or use a default error
            const errorText = await response.text()
            errorMessage = errorText || `HTTP Error: ${response.status}`
          }

          throw new Error(errorMessage)
        }
      }

      router.push("/dashboard/bookings")
      router.refresh()
    } catch (error) {
      console.error("Booking operation error:", error)
      alert(error instanceof Error ? error.message : "An error occurred while saving the booking")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Unit Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Room Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Select Unit *</Label>
            <Select
              value={formData.unit_id}
              onValueChange={(value) => {
                setFormData({ ...formData, unit_id: value })
                setTimeout(calculateTotal, 100)
              }}
            >
              <SelectTrigger className="border-white">
                <SelectValue placeholder="Choose a room" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map((unit) => (
                  <SelectItem
                    key={unit.id}
                    value={unit.id}
                  >
                    {unit.name}{" "}
                    {unit.room_type && `- ${unit.room_type.name} (${unit.room_type.base_price} ${currency}/night)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availabilityError && (
              <p className="text-sm text-red-500">{availabilityError}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="check_in">Check In *</Label>
              <Input
                id="check_in"
                type="date"
                value={formData.check_in}
                onChange={(e) => {
                  setFormData({ ...formData, check_in: e.target.value })
                  setTimeout(calculateTotal, 100)
                }}
                required
                className="border-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check_out">Check Out *</Label>
              <Input
                id="check_out"
                type="date"
                value={formData.check_out}
                onChange={(e) => {
                  setFormData({ ...formData, check_out: e.target.value })
                  setTimeout(calculateTotal, 100)
                }}
                required
                className="border-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adults">Adults</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                className="border-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                value={formData.children}
                onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                className="border-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showNewGuest ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="guest">Select Guest</Label>
                <Select
                  value={formData.guest_id}
                  onValueChange={(value) => setFormData({ ...formData, guest_id: value })}
                >
                  <SelectTrigger className="border-white">
                    <SelectValue placeholder="Choose existing guest" />
                  </SelectTrigger>
                  <SelectContent>
                    {guests.map((guest) => (
                      <SelectItem key={guest.id} value={guest.id}>
                        {guest.first_name} {guest.last_name} {guest.email && `(${guest.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowNewGuest(true)} className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Guest
              </Button>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newGuest.first_name}
                    onChange={(e) => setNewGuest({ ...newGuest, first_name: e.target.value })}
                    required={showNewGuest}
                    className="border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={newGuest.last_name}
                    onChange={(e) => setNewGuest({ ...newGuest, last_name: e.target.value })}
                    required={showNewGuest}
                    className="border-white"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="border-white"
                  />
                </div>
              </div>

              {/* Additional Guest Information */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Country</Label>
                  <Select
                    value={newGuest.nationality}
                    onValueChange={(value) => setNewGuest({ ...newGuest, nationality: value })}
                  >
                    <SelectTrigger className="border-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="GBR">United Kingdom</SelectItem>
                      <SelectItem value="CAN">Canada</SelectItem>
                      <SelectItem value="AUS">Australia</SelectItem>
                      <SelectItem value="DEU">Germany</SelectItem>
                      <SelectItem value="FRA">France</SelectItem>
                      <SelectItem value="JPN">Japan</SelectItem>
                      <SelectItem value="CHN">China</SelectItem>
                      <SelectItem value="IND">India</SelectItem>
                      <SelectItem value="BRA">Brazil</SelectItem>
                      <SelectItem value="MEX">Mexico</SelectItem>
                      <SelectItem value="RUS">Russia</SelectItem>
                      <SelectItem value="KOR">South Korea</SelectItem>
                      <SelectItem value="SAU">Saudi Arabia</SelectItem>
                      <SelectItem value="SGP">Singapore</SelectItem>
                      <SelectItem value="ZAF">South Africa</SelectItem>
                      <SelectItem value="NGA">Nigeria</SelectItem>
                      <SelectItem value="EGY">Egypt</SelectItem>
                      <SelectItem value="TUR">Turkey</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">National ID Card</Label>
                  <Input
                    id="id_number"
                    value={newGuest.id_number}
                    onChange={(e) => setNewGuest({ ...newGuest, id_number: e.target.value })}
                    placeholder="National ID/Passport number"
                    className="border-white"
                  />
                </div>
              </div>
              <Button type="button" variant="ghost" onClick={() => setShowNewGuest(false)}>
                Select Existing Guest Instead
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                <SelectTrigger className="border-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="booking_com">Booking.com</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="expedia">Expedia</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="border-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">Total Amount ({currency})</Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              placeholder="0.00"
              className="border-white"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="special_requests">Special Requests</Label>
            <Textarea
              id="special_requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="Any special requests from the guest..."
              rows={2}
              className="border-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes visible only to staff..."
              rows={2}
              className="border-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : booking ? (
            "Update Booking"
          ) : (
            "Create Booking"
          )}
        </Button>
      </div>
    </form>
  )
}
