"use client";

import { useState } from "react";
import { MainLayout } from "@/components/main-layout";
import { SettingsSection } from "@/components/settings-section";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Mail,
  CreditCard,
  DollarSign,
  ShoppingCart,
  CalendarCheck,
  Network,
  ListChecks,
  ClipboardList,
  Star,
  Building,
  Home,
  Tag,
  Clock,
  Zap,
  Briefcase,
  Users,
  Shield,
  ChevronRight,
} from "lucide-react";
import { HotelSettings, PricingRule, UserPermission, updateHotelSettings } from "@/lib/settings-server-actions";
import { HotelInfoSettings } from "@/components/modals/hotel-info-settings";
import { PricingRulesSettings } from "@/components/modals/pricing-rules-settings";
import { UserPermissionsSettings } from "@/components/modals/user-permissions-settings";

interface SettingsClientProps {
  hotelSettings: HotelSettings;
  pricingRules: PricingRule[];
  userPermissions: UserPermission[];
}

export default function SettingsClient({
  hotelSettings,
  pricingRules,
  userPermissions
}: SettingsClientProps) {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [isHotelInfoOpen, setIsHotelInfoOpen] = useState(false);
  const [isPricingRulesOpen, setIsPricingRulesOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  const [localHotelSettings, setLocalHotelSettings] = useState(hotelSettings);
  const [localPricingRules, setLocalPricingRules] = useState(pricingRules);
  const [localUserPermissions, setLocalUserPermissions] = useState(userPermissions);

  const handleUpdateHotel = async (data: any) => {
    try {
      const updatedSettings = await updateHotelSettings(data);
      setLocalHotelSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating hotel settings:", error);
      throw error;
    }
  };

  const handleAddPricingRule = async (ruleData: Omit<PricingRule, 'id'>) => {
    // For now, we'll just update the local state.
    // In a real implementation, we'd call the server action
    const newRule = {
      ...ruleData,
      id: `rule_${Date.now()}`, // Generate a temporary ID
    };
    setLocalPricingRules([...localPricingRules, newRule]);
  };

  const handleUpdatePricingRule = async (id: string, ruleData: Partial<PricingRule>) => {
    setLocalPricingRules(localPricingRules.map(rule =>
      rule.id === id ? { ...rule, ...ruleData } : rule
    ));
  };

  const handleDeletePricingRule = async (id: string) => {
    setLocalPricingRules(localPricingRules.filter(rule => rule.id !== id));
  };

  const handleAddRole = async (roleData: Omit<UserPermission, 'id'>) => {
    const newRole = {
      ...roleData,
      id: `role_${Date.now()}`, // Generate a temporary ID
    };
    setLocalUserPermissions([...localUserPermissions, newRole]);
  };

  const handleUpdateRole = async (id: string, roleData: Partial<UserPermission>) => {
    setLocalUserPermissions(localUserPermissions.map(role =>
      role.id === id ? { ...role, ...roleData } : role
    ));
  };

  const handleDeleteRole = async (id: string) => {
    setLocalUserPermissions(localUserPermissions.filter(role => role.id !== id));
  };

  return (
    <MainLayout>
      {/* Finance Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          المالية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SettingsSection icon={Mail} title="إدارة البريد" description="تكوين إعدادات البريد الإلكتروني">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("email")}
            >
              تكوين
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={CreditCard} title="طرق الدفع" description="إدارة بوابات وطرق الدفع">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("payment")}
            >
              إدارة
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={DollarSign} title="الرسوم والضرائب" description="تكوين الرسوم والضرائب الإضافية">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("taxes")}
            >
              تعديل
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={ShoppingCart} title="المشتريات" description="إدارة المشتريات والموردين">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("purchases")}
            >
              فتح
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>
        </div>
      </div>

      {/* Reservations Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-primary" />
          الحجوزات
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SettingsSection icon={ListChecks} title="شروط الحجز" description="تعديل سياسات وشروط الحجز">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("booking-policies")}
            >
              تحرير
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Network} title="إدارة المصادر" description="تكوين قنوات الحجز">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("channels")}
            >
              إدارة
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Tag} title="أنواع الحجوزات" description="تصنيف أنواع الحجوزات المختلفة">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("booking-types")}
            >
              عرض
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={ClipboardList} title="مهام الخدمة" description="إدارة مهام خدمة الغرف">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("service-tasks")}
            >
              إدارة
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Star} title="تقييمات الضيوف" description="إعدادات التقييمات والمراجعات">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("reviews")}
            >
              تكوين
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>
        </div>
      </div>

      {/* Facility Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-primary" />
          إدارة المنشأة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SettingsSection icon={Home} title="بيانات الحساب" description="معلومات المنشأة والحساب">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setIsHotelInfoOpen(true)}
            >
              تعديل
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Tag} title="أنواع الوحدات" description="تصنيف أنواع الوحدات">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("unit-types")}
            >
              إدارة
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Building} title="قائمة الوحدات" description="إدارة جميع الوحدات">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("units")}
            >
              عرض
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={DollarSign} title="قواعد التسعير" description="استراتيجيات التسعير الديناميكي">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setIsPricingRulesOpen(true)}
            >
              تكوين ( {localPricingRules.length} )
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Clock} title="ساعات العمل" description="تحديد أوقات العمل والتشغيل">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("business-hours")}
            >
              تعديل
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Zap} title="المرافق والاستهلاك" description="إدارة الكهرباء والماء وغيرها">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("utilities")}
            >
              إدارة
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Briefcase} title="الشركات والموردين" description="إدارة الشركات والموردين">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("suppliers")}
            >
              عرض
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Mail} title="إدارة البريد الإلكتروني" description="قوالب البريد الإلكتروني">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("email-templates")}
            >
              تحرير
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>
        </div>
      </div>

      {/* User Management Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          إدارة المستخدمين
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsSection icon={Users} title="المستخدمين" description="إدارة حسابات المستخدمين">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setActiveSetting("users")}
            >
              إدارة ({localUserPermissions.length})
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>

          <SettingsSection icon={Shield} title="الأدوار والصلاحيات" description="تكوين صلاحيات الوصول">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 bg-transparent"
              onClick={() => setIsPermissionsOpen(true)}
            >
              تكوين
              <ChevronRight className="w-4 h-4" />
            </Button>
          </SettingsSection>
        </div>
      </div>

      {/* Modals */}
      <HotelInfoSettings
        open={isHotelInfoOpen}
        onOpenChange={setIsHotelInfoOpen}
        hotelData={localHotelSettings}
        onUpdateHotel={handleUpdateHotel}
      />

      <PricingRulesSettings
        open={isPricingRulesOpen}
        onOpenChange={setIsPricingRulesOpen}
        pricingRules={localPricingRules}
        onAddPricingRule={handleAddPricingRule}
        onUpdatePricingRule={handleUpdatePricingRule}
        onDeletePricingRule={handleDeletePricingRule}
      />

      <UserPermissionsSettings
        open={isPermissionsOpen}
        onOpenChange={setIsPermissionsOpen}
        userPermissions={localUserPermissions}
        onAddRole={handleAddRole}
        onUpdateRole={handleUpdateRole}
        onDeleteRole={handleDeleteRole}
      />
    </MainLayout>
  );
}