"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { KPICard } from "@/components/kpi-card"
import { UnitCard } from "@/components/unit-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Grid3X3, List, Plus, AlertCircle, CalendarCheck, UserX, LogIn, LogOut } from "lucide-react"
import { usePMSStore } from "@/lib/store"
import { AddUnitModal } from "@/components/modals/add-unit-modal"
import { Toaster } from "sonner"

export default function UnitsPage() {
  const units = usePMSStore((state) => state.units)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        unit.number.includes(searchQuery) ||
        unit.name.includes(searchQuery) ||
        (unit.guest?.includes(searchQuery) ?? false)
      const matchesStatus = statusFilter === "all" || unit.status === statusFilter
      const matchesType = typeFilter === "all" || unit.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [units, searchQuery, statusFilter, typeFilter])

  const outOfService = units.filter((u) => u.status === "out-of-service").length
  const available = units.filter((u) => u.status === "vacant").length
  const arrivalToday = units.filter((u) => u.status === "arrival-today").length
  const departureToday = units.filter((u) => u.status === "departure-today").length

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Toaster position="top-center" richColors />

      <main className="mr-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الوحدات</h1>
            <p className="text-muted-foreground mt-1">إدارة وحدات الإقامة</p>
          </div>
          <Button className="rounded-xl gap-2" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة وحدة
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard title="خارج الخدمة" value={outOfService} icon={AlertCircle} variant="destructive" />
          <KPICard title="متاحة اليوم" value={available} icon={CalendarCheck} variant="success" />
          <KPICard title="عدم حضور" value={2} icon={UserX} variant="warning" />
          <KPICard title="الوصول اليوم" value={arrivalToday} icon={LogIn} variant="primary" />
          <KPICard title="المغادرة اليوم" value={departureToday} icon={LogOut} variant="warning" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث عن وحدة..."
              className="pr-10 rounded-xl bg-card border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl bg-card border-border">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="occupied">مشغول</SelectItem>
              <SelectItem value="vacant">شاغر</SelectItem>
              <SelectItem value="out-of-service">خارج الخدمة</SelectItem>
              <SelectItem value="departure-today">مغادرة اليوم</SelectItem>
              <SelectItem value="arrival-today">وصول اليوم</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] rounded-xl bg-card border-border">
              <SelectValue placeholder="تصفية حسب النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="suite">جناح</SelectItem>
              <SelectItem value="room">غرفة</SelectItem>
              <SelectItem value="studio">استوديو</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg ${viewMode === "list" ? "bg-primary text-primary-foreground" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUnits.map((unit) => (
            <UnitCard key={unit.id} unit={unit} />
          ))}
        </div>

        {filteredUnits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">لا توجد وحدات مطابقة للبحث</div>
        )}
      </main>

      <AddUnitModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </div>
  )
}
