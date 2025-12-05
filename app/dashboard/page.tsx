import { requireAuth } from "@/lib/auth";
import { MainLayout } from "@/components/main-layout";
import { KPICard } from "@/components/kpi-card"
import { ProgressBar } from "@/components/progress-bar"
import { ActivityTimeline } from "@/components/activity-timeline"
import { OccupancyChart } from "@/components/charts/occupancy-chart"
import { UnitStatusChart } from "@/components/charts/unit-status-chart"
import { ReservationSourcesChart } from "@/components/charts/reservation-sources-chart"
import { UnitStatusList } from "@/components/unit-status-list"
import { Building2, CalendarPlus, CalendarCheck, Users, Banknote } from "lucide-react"

const activities = [
  {
    id: "1",
    type: "payment" as const,
    title: "دفعة جديدة",
    description: "استلام 2,500 ر.س من محمد أحمد - الوحدة 101",
    time: "منذ 5 دقائق",
  },
  {
    id: "2",
    type: "check-in" as const,
    title: "تسجيل دخول",
    description: "سارة علي - الوحدة 205",
    time: "منذ 15 دقيقة",
  },
  {
    id: "3",
    type: "booking" as const,
    title: "حجز جديد",
    description: "حجز من Booking.com - الوحدة 302",
    time: "منذ 30 دقيقة",
  },
  {
    id: "4",
    type: "check-out" as const,
    title: "تسجيل خروج",
    description: "خالد محمود - الوحدة 108",
    time: "منذ ساعة",
  },
]

const units = [
  { id: "1", number: "101", status: "occupied" as const, guest: "محمد أحمد" },
  { id: "2", number: "102", status: "vacant" as const },
  { id: "3", number: "103", status: "reserved" as const },
  { id: "4", number: "104", status: "occupied" as const, guest: "علي حسن" },
  { id: "5", number: "105", status: "maintenance" as const },
  { id: "6", number: "106", status: "vacant" as const },
  { id: "7", number: "201", status: "occupied" as const, guest: "سارة علي" },
  { id: "8", number: "202", status: "vacant" as const },
  { id: "9", number: "203", status: "reserved" as const },
  { id: "10", number: "204", status: "occupied" as const, guest: "فاطمة محمد" },
  { id: "11", number: "205", status: "occupied" as const, guest: "أحمد خالد" },
  { id: "12", number: "206", status: "vacant" as const },
]

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <MainLayout>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard title="إجمالي الوحدات" value={120} icon={Building2} variant="primary" />
          <KPICard
            title="حجوزات جديدة"
            value={24}
            subtitle="هذا الأسبوع"
            icon={CalendarPlus}
            trend={{ value: 12, isPositive: true }}
            variant="success"
          />
          <KPICard title="حجوزات نشطة" value={85} icon={CalendarCheck} variant="default" />
          <KPICard title="الضيوف الحاليين" value={156} icon={Users} variant="default" />
          <KPICard
            title="إيرادات اليوم"
            value="15,420"
            subtitle="ر.س"
            icon={Banknote}
            trend={{ value: 8, isPositive: true }}
            variant="success"
          />
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">جاهز للمغادرة</h3>
            <ProgressBar label="الوحدات الجاهزة للمغادرة اليوم" value={8} max={12} variant="warning" />
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">جاهز للوصول</h3>
            <ProgressBar label="الوحدات الجاهزة للوصول اليوم" value={15} max={18} variant="success" />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Occupancy */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">نسبة الإشغال الأسبوعية</h3>
            <OccupancyChart />
          </div>

          {/* Activity Timeline */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">آخر النشاطات</h3>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Unit Status Pie Chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">توزيع حالة الوحدات</h3>
            <UnitStatusChart />
          </div>

          {/* Reservation Sources */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">مصادر الحجوزات</h3>
            <ReservationSourcesChart />
          </div>
        </div>

        {/* Unit Status Grid */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">حالة الوحدات</h3>
          <UnitStatusList units={units} />
        </div>
      </MainLayout>
  )
}
