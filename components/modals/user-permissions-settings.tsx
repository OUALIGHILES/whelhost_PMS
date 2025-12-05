"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPermission } from "@/lib/settings-server-actions";

interface UserPermissionsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPermissions: UserPermission[];
  onAddRole: (role: Omit<UserPermission, 'id'>) => void;
  onUpdateRole: (id: string, role: Partial<UserPermission>) => void;
  onDeleteRole: (id: string) => void;
}

// Define available permissions
const ALL_PERMISSIONS = [
  { id: "view_dashboard", label: "عرض لوحة التحكم" },
  { id: "manage_reservations", label: "إدارة الحجوزات" },
  { id: "manage_invoices", label: "إدارة الفواتير" },
  { id: "manage_receipts", label: "إدارة السندات" },
  { id: "manage_units", label: "إدارة الوحدات" },
  { id: "manage_guests", label: "إدارة الضيوف" },
  { id: "manage_tasks", label: "إدارة المهام" },
  { id: "manage_channels", label: "إدارة القنوات" },
  { id: "manage_users", label: "إدارة المستخدمين" },
  { id: "manage_settings", label: "إدارة الإعدادات" },
  { id: "view_reports", label: "عرض التقارير" },
  { id: "manage_finances", label: "إدارة المالية" },
];

export function UserPermissionsSettings({ 
  open, 
  onOpenChange, 
  userPermissions,
  onAddRole,
  onUpdateRole,
  onDeleteRole
}: UserPermissionsSettingsProps) {
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [editingRole, setEditingRole] = useState<UserPermission | null>(null);
  
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    selectedPermissions: [] as string[],
  });

  const handlePermissionChange = (permissionId: string) => {
    setFormData(prev => {
      if (prev.selectedPermissions.includes(permissionId)) {
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          selectedPermissions: [...prev.selectedPermissions, permissionId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRole) {
        await onUpdateRole(editingRole.id, {
          roleName: formData.roleName,
          description: formData.description,
          permissions: formData.selectedPermissions,
        });
        toast.success("تم تحديث الصلاحية بنجاح");
      } else {
        await onAddRole({
          roleName: formData.roleName,
          description: formData.description,
          permissions: formData.selectedPermissions,
        });
        toast.success("تم إضافة الصلاحية بنجاح");
      }
      
      setFormData({
        roleName: "",
        description: "",
        selectedPermissions: [],
      });
      setEditingRole(null);
      setActiveTab("list");
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("حدث خطأ أثناء حفظ الصلاحية");
    }
  };

  const handleEdit = (role: UserPermission) => {
    setEditingRole(role);
    setFormData({
      roleName: role.roleName,
      description: role.description,
      selectedPermissions: role.permissions || [],
    });
    setActiveTab("add");
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteRole(id);
      toast.success("تم حذف الصلاحية بنجاح");
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("حدث خطأ أثناء حذف الصلاحية");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-foreground">إدارة الأدوار والصلاحيات</DialogTitle>
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
              setEditingRole(null);
              setFormData({
                roleName: "",
                description: "",
                selectedPermissions: [],
              });
            }}
            className="rounded-xl"
          >
            {editingRole ? "تعديل" : "إضافة"} صلاحية
          </Button>
        </div>
        
        {activeTab === "list" ? (
          <div className="max-h-80 overflow-y-auto">
            {userPermissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">لا توجد صلاحيات</p>
            ) : (
              <div className="space-y-2">
                {userPermissions.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                    <div>
                      <h4 className="font-medium">{role.roleName}</h4>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.permissions.slice(0, 3).map(perm => (
                          <span key={perm} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {ALL_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="text-xs text-muted-foreground">+ {role.permissions.length - 3} أخرى</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleEdit(role)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleDelete(role.id)}
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
              <Label>اسم الصلاحية</Label>
              <Input
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                className="rounded-xl bg-background border-border"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl bg-background border-border resize-none"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>الصلاحيات</Label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border border-border rounded-xl">
                {ALL_PERMISSIONS.map(permission => (
                  <div key={permission.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-muted rounded-lg">
                    <Checkbox
                      id={permission.id}
                      checked={formData.selectedPermissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionChange(permission.id)}
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setActiveTab("list")} className="rounded-xl">
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl">
                {editingRole ? "تحديث" : "إضافة"} الصلاحية
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}