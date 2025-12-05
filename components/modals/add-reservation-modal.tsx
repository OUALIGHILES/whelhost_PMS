"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Unit {
  id: string;
  number: string;
  name: string;
  status: "occupied" | "vacant" | "out-of-service" | "departure-today" | "arrival-today";
  pricePerNight?: number;
  type?: string;
  floor?: string;
  guest?: string;
  checkIn?: string;
  checkOut?: string;
  balance?: number;
  propertyId?: string;
}

interface Guest {
  id: string;
  name: string;
  nationality: string;
  idType: string;
  idNumber: string;
  phone: string;
  email: string;
  reservations: number;
}

interface Reservation {
  date: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  unit: string;
  guest: string;
  pricePerNight: number;
  total: number;
  paid: number;
  balance: number;
  status: "active" | "paid" | "upcoming" | "completed" | "cancelled";
  channel?: string;
  externalId?: string;
}

interface AddReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddReservation?: (reservationData: Omit<Reservation, 'id' | 'date'>) => Promise<void>
  units?: Unit[];
  guests?: Guest[];
}

export function AddReservationModal({
  open,
  onOpenChange,
  onAddReservation,
  units = [],
  guests = []
}: AddReservationModalProps) {
  const [formData, setFormData] = useState({
    guest: "",
    unit: "",
    checkIn: "",
    checkOut: "",
    pricePerNight: "",
    paid: "0",
  })

  const availableUnits = units?.filter((u) => u.status === "vacant" || u.status === "arrival-today") || []

  const nights = useMemo(() => {
    if (formData.checkIn && formData.checkOut) {
      const start = new Date(formData.checkIn)
      const end = new Date(formData.checkOut)
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : 0
    }
    return 0
  }, [formData.checkIn, formData.checkOut])

  const total = nights * Number(formData.pricePerNight || 0)
  const balance = total - Number(formData.paid || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.guest || !formData.unit || !formData.checkIn || !formData.checkOut) {
      toast.error("الرجاء تعبئة جميع الحقول المطلوبة")
      return
    }

    try {
      if (onAddReservation) {
        // Find the guest name based on the ID
        const selectedGuest = guests.find((g) => g.id === formData.guest);

        // Find the unit name based on the ID
        const selectedUnit = units.find((u) => u.id === formData.unit);

        await onAddReservation({
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          nights,
          unit: selectedUnit?.name || selectedUnit?.number || formData.unit,
          guest: selectedGuest?.name || formData.guest,
          pricePerNight: Number(formData.pricePerNight),
          total,
          paid: Number(formData.paid),
          balance,
          status: balance === 0 ? "paid" : "upcoming",
        });
      }

      toast.success("تم إنشاء الحجز بنجاح")
      onOpenChange(false)
      setFormData({ guest: "", unit: "", checkIn: "", checkOut: "", pricePerNight: "", paid: "0" })
    } catch (error) {
      console.error("Error adding reservation:", error);
      toast.error("حدث خطأ أثناء إنشاء الحجز");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-foreground">حجز جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الضيف</Label>
              <Select value={formData.guest} onValueChange={(v) => setFormData({ ...formData, guest: v })}>
                <SelectTrigger className="rounded-xl bg-background border-border">
                  <SelectValue placeholder="اختر الضيف" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوحدة</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => {
                  const unit = units.find((u) => u.id === v)
                  setFormData({ ...formData, unit: v, pricePerNight: String(unit?.pricePerNight || "") })
                }}
              >
                <SelectTrigger className="rounded-xl bg-background border-border">
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.length > 0 ? (
                    availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.number} - {unit.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      لا توجد وحدات متاحة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ الوصول</Label>
              <Input
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ المغادرة</Label>
              <Input
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>السعر / ليلة</Label>
              <Input
                type="number"
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                placeholder="500"
                className="rounded-xl bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>المبلغ المدفوع</Label>
              <Input
                type="number"
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
                placeholder="0"
                className="rounded-xl bg-background border-border"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">عدد الليالي</span>
              <span className="font-medium">{nights}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="font-medium">{total.toLocaleString()} ر.س</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المتبقي</span>
              <span className={balance > 0 ? "text-destructive font-medium" : "text-success font-medium"}>
                {balance.toLocaleString()} ر.س
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl">
              إنشاء الحجز
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
