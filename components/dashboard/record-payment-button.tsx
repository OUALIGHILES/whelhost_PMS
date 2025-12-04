'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { CreditCard, Banknote, Link as LinkIcon, Calendar, User, Mail } from 'lucide-react'
import { RecordPaymentForm } from './record-payment-form'

interface RecordPaymentButtonProps {
  bookingId: string
  bookingAmount: number
  currency: string
  guestName: string
  checkIn: string
  checkOut: string
}

export function RecordPaymentButton({
  bookingId,
  bookingAmount,
  currency,
  guestName,
  checkIn,
  checkOut
}: RecordPaymentButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment for Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{guestName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}
            </span>
          </div>

          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm">Total Amount: <span className="font-medium">{currency} {bookingAmount.toFixed(2)}</span></p>
          </div>
        </div>

        <RecordPaymentForm
          bookingId={bookingId}
          bookingAmount={bookingAmount}
          currency={currency}
          guestName={guestName}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      </DialogContent>
    </Dialog>
  )
}