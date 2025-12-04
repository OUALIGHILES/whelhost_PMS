"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, FileText, Mail, MessageSquare, Phone, Printer, Download, Share2, User } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  source: string;
  status: string;
  external_id?: string;
  created_at: string;
  adults: number;
  children: number;
  notes?: string;
  special_requests?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  unit?: {
    name: string;
    floor?: number;
    room_type?: {
      name: string;
      base_price: number;
    };
  };
  guest?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    nationality?: string;
  };
  hotel?: {
    name: string;
    currency: string;
    check_in_time?: string;
    check_out_time?: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  reference?: string;
}

interface CheckoutBillDetailsProps {
  booking: Booking;
  payments: Payment[];
}

export function CheckoutBillDetails({ booking, payments }: CheckoutBillDetailsProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalPaid = payments?.reduce((sum, p) => (p.status === "completed" ? sum + p.amount : sum), 0) || 0;
  const balance = (booking.total_amount || 0) - totalPaid;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // For the download, we'll use the print functionality which allows saving as PDF
    // Since we can't install jspdf due to dependency issues, we'll instruct the user
    // to use browser's print functionality to save as PDF
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Booking Receipt - ${booking.id.slice(0, 8)}`,
          text: `Booking details for ${booking.guest?.first_name} ${booking.guest?.last_name}`,
          url: window.location.href,
        })
        .catch((error) => console.error("Sharing failed:", error));
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Booking URL copied to clipboard!");
    }
  };

  // Calculate individual charges
  const roomRate = booking.unit?.room_type?.base_price || 0;
  const roomSubtotal = roomRate * nights;
  const taxAmount = roomSubtotal * 0.15; // Assuming 15% tax
  const totalWithTax = roomSubtotal + taxAmount;

  return (
    <div className="print:w-full print:max-w-none">
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100%;
            margin: 0;
            padding: 10px;
          }
        }
      `}</style>

      {/* Action buttons (hidden during print) */}
      <div className="no-print mb-6 flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Save as PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      <div className="print-container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{booking.hotel?.name || "Hotel Reservation"}</h1>
              <p className="text-muted-foreground">Booking Receipt</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <Badge variant="outline" className="capitalize">
                {booking.status.replace("_", " ")}
              </Badge>
              <p className="mt-1 text-sm text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-lg font-semibold">
                      {booking.guest?.first_name} {booking.guest?.last_name}
                    </p>
                    {booking.guest?.nationality && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Nationality: {booking.guest.nationality}
                      </p>
                    )}
                  </div>
                  <div>
                    {booking.guest?.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guest.email}</span>
                      </div>
                    )}
                    {booking.guest?.phone && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guest.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-sm text-muted-foreground">
                        After {booking.hotel?.check_in_time || "15:00"}
                      </p>
                      {booking.checked_in_at && (
                        <div className="mt-1 rounded-lg bg-success/10 p-2">
                          <p className="text-xs text-success">Actually checked in: {formatTime(booking.checked_in_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-medium">{formatDate(booking.check_out)}</p>
                      <p className="text-sm text-muted-foreground">
                        Before {booking.hotel?.check_out_time || "11:00"}
                      </p>
                      {booking.checked_out_at && (
                        <div className="mt-1 rounded-lg bg-muted p-2">
                          <p className="text-xs">Actually checked out: {formatTime(booking.checked_out_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-6 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {nights} night{nights !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.adults} adult{booking.adults !== 1 ? "s" : ""}
                      {booking.children > 0 && (
                        <span>
                          , {booking.children} child{booking.children !== 1 ? "ren" : ""}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Requests */}
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
          </div>

          {/* Billing Summary */}
          <div className="space-y-6">
            {/* Billing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Room charges breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span>Room Rate ({nights} nights × {roomRate} {booking.hotel?.currency})</span>
                      <span>{roomSubtotal} {booking.hotel?.currency}</span>
                    </div>

                    <div className="flex justify-between py-2">
                      <span>Tax (15%)</span>
                      <span>+{taxAmount} {booking.hotel?.currency}</span>
                    </div>

                    <div className="flex justify-between border-t pt-2 font-bold text-lg">
                      <span>Total Amount</span>
                      <span>{totalWithTax} {booking.hotel?.currency}</span>
                    </div>
                  </div>

                  {/* Payment History */}
                  {payments && payments.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="mb-2 text-sm font-medium">Payment History</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {payments.map((payment) => (
                          <div key={payment.id} className="flex justify-between text-sm py-1">
                            <div>
                              <span className="block">
                                {payment.method.replace("_", " ")}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={payment.status === "completed" ? "text-success" : ""}>
                              {payment.amount} {booking.hotel?.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Amount</span>
                      <span>{booking.total_amount || 0} {booking.hotel?.currency}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Paid</span>
                      <span>{totalPaid} {booking.hotel?.currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Balance</span>
                      <span className={balance > 0 ? "text-destructive" : "text-success"}>
                        {balance} {booking.hotel?.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Source */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span>{booking.source.replace("_", ".")}</span>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking ID</span>
                    <span className="font-mono text-xs">{booking.id.slice(0, 8)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.hotel?.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For any inquiries regarding this booking, please contact our front desk.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}