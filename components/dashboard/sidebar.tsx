"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import type { Profile, Hotel } from "@/lib/types"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Building2,
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  MessageSquare,
  Globe,
  FileText,
  Key,
  BarChart3,
  Settings,
  User,
  ListTodo,
  Crown,
  LogOut,
  Bell,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/dashboard/notification-bell"

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/units", label: "Units", icon: BedDouble },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
]

const managementNavItems = [
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/channels", label: "Channels", icon: Globe },
  { href: "/dashboard/invoices", label: "Invoices", icon: FileText },
  { href: "/dashboard/bills", label: "Bills", icon: FileText },
  { href: "/dashboard/smart-locks", label: "Smart Locks", icon: Key },
]

const analyticsNavItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListTodo },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

interface DashboardSidebarProps {
  user: User
  profile: Profile | null
  hotel: Hotel | null
}

export function DashboardSidebar({ user, profile, hotel }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">WhelHost</span>
              <span className="text-xs text-sidebar-foreground/60">{hotel?.name || "Setup your hotel"}</span>
            </div>
          </Link>
          {hotel && (
            <NotificationBell hotelId={hotel.id} userId={user.id} />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Premium Upgrade Banner */}
        {!profile?.is_premium && (
          <div className="mx-3 mt-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Crown className="h-4 w-4 text-warning" />
              <span>Upgrade to Premium</span>
            </div>
            <p className="mt-1 text-xs text-sidebar-foreground/70">Unlock all features</p>
            <Button size="sm" className="mt-2 w-full" asChild>
              <Link href="/dashboard/upgrade">Upgrade Now</Link>
            </Button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics & Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{profile?.full_name || "User"}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
