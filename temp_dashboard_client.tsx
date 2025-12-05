"use client"

import { MainLayout } from "@/components/main-layout"
import { KPICard } from "@/components/kpi-card"
import { ProgressBar } from "@/components/progress-bar"
import { ActivityTimeline } from "@/components/activity-timeline"
import { OccupancyChart } from "@/components/charts/occupancy-chart"
import { UnitStatusChart } from "@/components/charts/unit-status-chart"
import { ReservationSourcesChart } from "@/components/charts/reservation-sources-chart"
import { UnitStatusList } from "@/components/unit-status-list"
import { Building2, CalendarPlus, CalendarCheck, Users, Banknote } from "lucide-react"
import { useEffect, useState } from "react"
import { usePMSStore } from "@/lib/store"
import { pmsApi } from "@/lib/pms-api"

export default function DashboardPageClient() {
  const { loadData } = usePMSStore()
  const [units, setUnits] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const data = await pmsApi.initializeData()
      loadData(data); // Load data into the store
      setUnits(data.units); // Also set the units locally for this component
    }

    fetchData()
  }, [loadData])

  // Mock activities for now
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

  // Calculate KPI values from the units
  const totalUnits = units.length
  const occupiedUnits = units.filter(unit => unit.status === 'occupied').length
  const vacantUnits = units.filter(unit => unit.status === 'vacant').length
  const departureTodayUnits = units.filter(unit => unit.status === 'departure-today').length
  const arrivalTodayUnits = units.filter(unit => unit.status === 'arrival-today').length

  return (
    <MainLayout>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard title="إجمالي الوحدات" value={totalUnits} icon={Building2} variant="primary" />
          <KPICard
            title="الوحدات المشغولة"
            value={occupiedUnits}
            subtitle="حاليًا"
            icon={CalendarCheck}
            variant="default"
          />
          <KPICard title="الوحدات الشاغرة" value={vacantUnits} icon={CalendarCheck} variant="success" />
          <KPICard title="الضيوف الحاليين" value={occupiedUnits} icon={Users} variant="default" />
          <KPICard
            title="الوصول اليوم"
            value={arrivalTodayUnits}
            subtitle="جديد"
            icon={Banknote}
            variant="success"
          />
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">جاهز للمغادرة</h3>
            <ProgressBar label="الوحدات الجاهزة للمغادرة اليوم" value={departureTodayUnits} max={totalUnits} variant="warning" />
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-medium text-foreground mb-4">جاهز للوصول</h3>
            <ProgressBar label="الوحدات الجاهزة للوصول اليوم" value={arrivalTodayUnits} max={totalUnits} variant="success" />
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
          <UnitStatusList units={units.slice(0, 12)} /> {/* Show only first 12 units for demo */}
        </div>
      </MainLayout>
  )
}