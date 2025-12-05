'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Network,
  Users,
  FileText,
  Receipt,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  CalendarRange,
  MessageSquare,
  Lock,
  ClipboardList,
  BarChart3,
  Wallet,
} from "lucide-react"
import { useState } from "react"
import { UserProfileSection } from "@/components/user-profile-section"

interface User {
  id: string;
  email: string | null;
  user_metadata?: {
    full_name?: string;
    role?: string;
  };
}

interface SidebarProps {
  user?: User | null;
}

const navigation = [
  { name: "لوحة المعلومات", href: "/dashboard", icon: LayoutDashboard },
  { name: "العقارات", href: "/dashboard/properties", icon: Home },
  { name: "الوحدات", href: "/dashboard/units", icon: Building2 },
  { name: "التقويم", href: "/dashboard/occupancy", icon: CalendarRange },
  { name: "الحجوزات", href: "/dashboard/reservations", icon: CalendarDays },
  { name: "صندوق الرسائل", href: "/dashboard/inbox", icon: MessageSquare },
  { name: "القنوات", href: "/dashboard/channels", icon: Network },
  { name: "الضيوف", href: "/dashboard/guests", icon: Users },
  { name: "الأقفال الذكية", href: "/dashboard/smart-locks", icon: Lock },
  { name: "المهام", href: "/dashboard/tasks", icon: ClipboardList },
  { name: "الفواتير", href: "/dashboard/invoices", icon: FileText },
  { name: "السندات", href: "/dashboard/receipts", icon: Receipt },
  { name: "كشوفات الملاك", href: "/dashboard/owner-statements", icon: Wallet },
  { name: "روابط الدفع", href: "/dashboard/payment-links", icon: Link2 },
  { name: "التقارير", href: "/dashboard/reports", icon: BarChart3 },
  { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 h-screen bg-sidebar border-l border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">Alula Sky</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-sidebar-foreground" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn(collapsed && "justify-center")}>
            {!collapsed && <UserProfileSection initialUser={user} />}
            {collapsed && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mx-auto">
                <span className="text-sm font-bold text-primary">U</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
