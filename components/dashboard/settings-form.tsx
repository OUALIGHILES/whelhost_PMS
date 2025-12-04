"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { Profile, Hotel } from "@/lib/types"
import { BookingRulesForm } from "@/components/dashboard/booking-rules-form"

interface SettingsFormProps {
  user: User
  profile: Profile | null
  hotel: Hotel | null
}

const currencies = [
  { value: "SAR", label: "Saudi Riyal (SAR)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
]

export function SettingsForm({ user, profile, hotel }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  })

  const [hotelData, setHotelData] = useState({
    name: hotel?.name || "",
    description: hotel?.description || "",
    address: hotel?.address || "",
    city: hotel?.city || "",
    country: hotel?.country || "",
    phone: hotel?.phone || "",
    email: hotel?.email || "",
    currency: hotel?.currency || "SAR",
  })

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    await supabase.from("profiles").update(profileData).eq("id", user.id)

    setLoading(false)
    router.refresh()
  }

  const handleHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    if (hotel) {
      await supabase.from("hotels").update(hotelData).eq("id", hotel.id)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="hotel">Hotel</TabsTrigger>
        {hotel && <TabsTrigger value="booking_rules">Booking Rules</TabsTrigger>}
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="border-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="border-white"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hotel">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Settings</CardTitle>
            <CardDescription>Update your hotel information</CardDescription>
          </CardHeader>
          <CardContent>
            {!hotel ? (
              <p className="py-8 text-center text-muted-foreground">
                No hotel configured. Please set up your hotel first.
              </p>
            ) : (
              <form onSubmit={handleHotelSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel_name">Hotel Name</Label>
                  <Input
                    id="hotel_name"
                    value={hotelData.name}
                    onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                    className="border-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={hotelData.description}
                    onChange={(e) => setHotelData({ ...hotelData, description: e.target.value })}
                    rows={3}
                    className="border-white"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={hotelData.city}
                      onChange={(e) => setHotelData({ ...hotelData, city: e.target.value })}
                      className="border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={hotelData.country}
                      onChange={(e) => setHotelData({ ...hotelData, country: e.target.value })}
                      className="border-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={hotelData.address}
                    onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
                    className="border-white"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hotel_phone">Phone</Label>
                    <Input
                      id="hotel_phone"
                      type="tel"
                      value={hotelData.phone}
                      onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
                      className="border-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hotel_email">Email</Label>
                    <Input
                      id="hotel_email"
                      type="email"
                      value={hotelData.email}
                      onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
                      className="border-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={hotelData.currency}
                    onValueChange={(value) => setHotelData({ ...hotelData, currency: value })}
                  >
                    <SelectTrigger className="border-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {hotel && (
        <TabsContent value="booking_rules">
          <BookingRulesForm hotel={hotel} />
        </TabsContent>
      )}
    </Tabs>
  )
}
