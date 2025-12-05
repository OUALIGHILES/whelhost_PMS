"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PricingRule } from "@/lib/settings-server-actions";

interface PricingRulesSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricingRules: PricingRule[];
  onAddPricingRule: (rule: Omit<PricingRule, 'id'>) => void;
  onUpdatePricingRule: (id: string, rule: Partial<PricingRule>) => void;
  onDeletePricingRule: (id: string) => void;
}

export function PricingRulesSettings({ 
  open, 
  onOpenChange, 
  pricingRules,
  onAddPricingRule,
  onUpdatePricingRule,
  onDeletePricingRule
}: PricingRulesSettingsProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ruleType: "base",
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRule) {
        await onUpdatePricingRule(editingRule.id, formData);
        toast.success("تم تحديث قاعدة التسعير بنجاح");
      } else {
        await onAddPricingRule(formData);
        toast.success("تم إضافة قاعدة التسعير بنجاح");
      }
      
      setFormData({
        name: "",
        description: "",
        ruleType: "base",
        value: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });
      setEditingRule(null);
      setActiveTab("list");
    } catch (error) {
      console.error("Error saving pricing rule:", error);
      toast.error("حدث خطأ أثناء حفظ قاعدة التسعير");
    }
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      value: rule.value,
      startDate: rule.startDate,
      endDate: rule.endDate,
      isActive: rule.isActive,
    });
    setActiveTab("add");
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeletePricingRule(id);
      toast.success("تم حذف قاعدة التسعير بنجاح");
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      toast.error("حدث خطأ أثناء حذف قاعدة التسعير");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-foreground">إدارة قواعد التسعير</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "list" ? "default" : "outline"}
            onClick={() => setActiveTab("list")}
            className="rounded-xl"
          >
            القائمة
          </Button>
          <Button
            variant={activeTab === "add" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("add");
              setEditingRule(null);
              setFormData({
                name: "",
                description: "",
                ruleType: "base",
                value: 0,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                isActive: true,
              });
            }}
            className="rounded-xl"
          >
            {editingRule ? "تعديل" : "إضافة"} قاعدة
          </Button>
        </div>
        
        {activeTab === "list" ? (
          <div className="max-h-80 overflow-y-auto">
            {pricingRules.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد قواعد تسعير</p>
            ) : (
              <div className="space-y-2">
                {pricingRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {rule.ruleType} | {rule.value}% | {rule.startDate} إلى {rule.endDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleEdit(rule)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleDelete(rule.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم القاعدة</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl bg-background border-border"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl bg-background border-border"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع القاعدة</Label>
                <Select value={formData.ruleType} onValueChange={(v) => setFormData({ ...formData, ruleType: v })}>
                  <SelectTrigger className="rounded-xl bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">أساسية</SelectItem>
                    <SelectItem value="seasonal">موسمية</SelectItem>
                    <SelectItem value="weekend">نهاية الأسبوع</SelectItem>
                    <SelectItem value="holiday">أعياد</SelectItem>
                    <SelectItem value="advance">حجز مبكر</SelectItem>
                    <SelectItem value="last_minute">حجز لحظة أخيرة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>القيمة (%)</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="rounded-xl bg-background border-border"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البدء</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="rounded-xl bg-background border-border"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="rounded-xl bg-background border-border"
                  required
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isActive">مفعلة</Label>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setActiveTab("list")} className="rounded-xl">
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl">
                {editingRule ? "تحديث" : "إضافة"} القاعدة
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}