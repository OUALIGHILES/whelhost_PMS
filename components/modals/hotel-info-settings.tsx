"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface HotelInfoSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelData: any;
  onUpdateHotel: (data: any) => void;
}

export function HotelInfoSettings({ open, onOpenChange, hotelData, onUpdateHotel }: HotelInfoSettingsProps) {
  const [formData, setFormData] = useState({
    name: hotelData?.name || "",
    address: hotelData?.address || "",
    phone: hotelData?.phone || "",
    email: hotelData?.email || "",
    checkInTime: hotelData?.checkInTime || "15:00",
    checkOutTime: hotelData?.checkOutTime || "12:00",
    cancellationPolicy: hotelData?.cancellationPolicy || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Call the update function with the form data
      await onUpdateHotel(formData);
      toast.success("تم تحديث معلومات المنشأة بنجاح");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating hotel info:", error);
      toast.error("حدث خطأ أثناء تحديث معلومات المنشأة");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-foreground">تحديث معلومات المنشأة</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المنشأة</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="rounded-xl bg-background border-border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="rounded-xl bg-background border-border"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>وقت الدخول</Label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>وقت المغادرة</Label>
              <Input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>سياسة الإلغاء</Label>
            <Textarea
              value={formData.cancellationPolicy}
              onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
              className="rounded-xl bg-background border-border resize-none"
              rows={3}
            />
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              إلغاء
            </Button>
            <Button type="submit" className="rounded-xl">
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}