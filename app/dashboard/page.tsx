'use client';

import { MainLayout } from "@/components/main-layout";
import { KPICard } from "@/components/kpi-card"
import { ProgressBar } from "@/components/progress-bar"
import { ActivityTimeline } from "@/components/activity-timeline"
import { OccupancyChartServer } from "@/components/charts/occupancy-chart-server"
import { UnitStatusChartServer } from "@/components/charts/unit-status-chart-server"
import { ReservationSourcesChart } from "@/components/charts/reservation-sources-chart-server"
import { UnitStatusList } from "@/components/unit-status-list"
import { Building2, CalendarPlus, CalendarCheck, Users, Banknote } from "lucide-react";
import { useUser } from "@/lib/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Activity {
  id: string;
  type: 'payment' | 'check-in' | 'booking' | 'check-out';
  title: string;
  description: string;
  time: string;
}

interface Unit {
  id: string;
  number: string;
  status: 'occupied' | 'vacant' | 'reserved' | 'maintenance';
  guest?: string;
}

interface KPIData {
  totalUnits: number;
  newBookings: number;
  activeBookings: number;
  currentGuests: number;
  todayRevenue: number;
}

interface DashboardData {
  kpiData: KPIData;
  activities: Activity[];
  units: Unit[];
  checkoutReady: {
    count: number;
    max: number;
  };
  checkinReady: {
    count: number;
    max: number;
  };
}

export default function DashboardPage() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Mock data for dashboard
  const mockData: DashboardData = {
    kpiData: {
      totalUnits: 12,
      newBookings: 4,
      activeBookings: 8,
      currentGuests: 6,
      todayRevenue: 2400
    },
    activities: [
      {
        id: '1',
        type: 'payment',
        title: 'تم استلام دفعة',
        description: 'دفعة من حجز الغرفة رقم 201',
        time: 'منذ ساعة'
      },
      {
        id: '2',
        type: 'check-in',
        title: 'تسجيل دخول',
        description: 'ضيف جديد في الغرفة 105',
        time: 'منذ ساعتين'
      },
      {
        id: '3',
        type: 'booking',
        title: 'حجز جديد',
        description: 'حجز جديد من الموقع',
        time: 'منذ 3 ساعات'
      }
    ],
    units: [
      { id: '1', number: '101', status: 'occupied', guest: 'أحمد محمد' },
      { id: '2', number: '102', status: 'vacant' },
      { id: '3', number: '103', status: 'reserved' },
      { id: '4', number: '104', status: 'occupied', guest: 'فاطمة علي' }
    ],
    checkoutReady: { count: 2, max: 12 },
    checkinReady: { count: 3, max: 12 }
  };

  const isPremium = profile?.is_premium ?? false;

  useEffect(() => {
    // Check authentication and premium status
    if (!loading) {
      if (!user) {
        router.push('/');
        return;
      }

      if (!profile?.is_premium) {
        router.push('/packages');
        return;
      }

      // User is authenticated and premium - show dashboard
      setIsChecking(false);
    }
  }, [user, profile, loading, router]);

  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-[#1E2228] flex items-center justify-center">
        <div className="text-[#EBEAE6]">جاري تحميل لوحة التحكم...</div>
      </div>
    );
  }

  const { kpiData, activities, units, checkoutReady, checkinReady } = mockData;
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (hotelError || !userHotel) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">خطأ! </strong>
            <span className="block sm:inline">لا توجد فنادق مرتبطة بحسابك أو حدث خطأ أثناء تحميل البيانات</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Check if user has premium access for premium features
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_premium, premium_expires_at")
    .eq("id", user.id)
    .single();

  let isPremium = false;
  if (!profileError && profile) {
    const isPremiumExpired = profile.premium_expires_at ? new Date(profile.premium_expires_at) < new Date() : true;
    isPremium = profile.is_premium && !isPremiumExpired;
  }

  let dashboardData: DashboardData | null = null;
  let error = null;

  try {
    dashboardData = await getDashboardData(userHotel.id);
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error || !dashboardData) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">خطأ! </strong>
            <span className="block sm:inline">حدث خطأ أثناء تحميل بيانات لوحة التحكم: {error}</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { kpiData, activities, units, checkoutReady, checkinReady } = dashboardData;

  return (
    <MainLayout>
      {/* KPI Cards - These are basic features available to all users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard
            title="إجمالي الوحدات"
            value={kpiData.totalUnits}
            icon={Building2}
            variant="primary"
          />
          <KPICard
            title="حجوزات جديدة"
            value={kpiData.newBookings}
            subtitle="هذا الأسبوع"
            icon={CalendarPlus}
            trend={{ value: 0, isPositive: true }} // Placeholder trend - would require more complex logic
            variant="success"
          />
          <KPICard
            title="حجوزات نشطة"
            value={kpiData.activeBookings}
            icon={CalendarCheck}
            variant="default"
          />
          <KPICard
            title="الضيوف الحاليين"
            value={kpiData.currentGuests}
            icon={Users}
            variant="default"
          />
          <KPICard
            title="إيرادات اليوم"
            value={kpiData.todayRevenue.toLocaleString('ar-SA')}
            subtitle="ر.س"
            icon={Banknote}
            trend={{ value: 0, isPositive: true }} // Placeholder trend
            variant="success"
          />
        </div>

        {/* Progress Bars - These are basic features available to all users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">جاهز للمغادرة</h3>
            <ProgressBar
              label="الوحدات الجاهزة للمغادرة اليوم"
              value={checkoutReady.count}
              max={checkoutReady.max}
              variant="warning"
            />
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">جاهز للوصول</h3>
            <ProgressBar
              label="الوحدات الجاهزة للوصول اليوم"
              value={checkinReady.count}
              max={checkinReady.max}
              variant="success"
            />
          </div>
        </div>

        {/* Charts Grid - Show premium charts only to premium users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Occupancy - Available to all users */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">نسبة الإشغال الأسبوعية</h3>
            <OccupancyChartServer hotelId={userHotel.id} />
          </div>

          {/* Activity Timeline - Available to all users */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">آخر النشاطات</h3>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Second Row Charts - These could be premium features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Unit Status Pie Chart - Available to all users */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">توزيع حالة الوحدات</h3>
            {isPremium ? (
              <UnitStatusChartServer hotelId={userHotel.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>الرسم البياني متاح فقط للأعضاء المميزين</p>
                <p className="text-sm mt-2">الرجاء ترقية الحساب للوصول إلى تقارير متقدمة</p>
              </div>
            )}
          </div>

          {/* Reservation Sources - Available to all users */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">مصادر الحجوزات</h3>
            {isPremium ? (
              <ReservationSourcesChart hotelId={userHotel.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>الرسم البياني متاح فقط للأعضاء المميزين</p>
                <p className="text-sm mt-2">الرجاء ترقية الحساب للوصول إلى تقارير متقدمة</p>
              </div>
            )}
          </div>
        </div>

        {/* Unit Status Grid - Available to all users */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">حالة الوحدات</h3>
          <UnitStatusList units={units} />
        </div>

        {/* Premium Upgrade Banner for non-premium users */}
        {!isPremium && (
          <div className="mt-8 p-4 bg-gradient-to-r from-primary to-primary/80 rounded-2xl text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold">الحصول على الإصدار المميز</h3>
                <p className="text-sm opacity-90">الوصول إلى تقارير متقدمة وأدوات تحليل مفصلة</p>
              </div>
              <a
                href="/dashboard/upgrade"
                className="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                ترقية الحساب الآن
              </a>
            </div>
          </div>
        )}
      </MainLayout>
  )
}
