'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const getPageTitle = (pathname: string): string => {
  const pageTitles: Record<string, string> = {
    '/': 'لوحة المعلومات',
    '/properties': 'العقارات',
    '/units': 'الوحدات',
    '/occupancy': 'التقويم',
    '/reservations': 'الحجوزات',
    '/inbox': 'صندوق الرسائل',
    '/channels': 'القنوات',
    '/guests': 'الضيوف',
    '/smart-locks': 'الأقفال الذكية',
    '/tasks': 'المهام',
    '/invoices': 'الفواتير',
    '/receipts': 'السندات',
    '/owner-statements': 'كشوفات الملاك',
    '/payment-links': 'روابط الدفع',
    '/reports': 'التقارير',
    '/settings': 'الإعدادات',
  }

  // Check exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }

  // For dynamic routes or sub-paths, extract the main route
  const mainPath = pathname.split('/')[1]
  if (mainPath) {
    const fullPath = `/${mainPath}`
    if (pageTitles[fullPath]) {
      return pageTitles[fullPath]
    }
  }

  return 'نظام إدارة العقارات'
}

export function PageTitle() {
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState('')

  useEffect(() => {
    setPageTitle(getPageTitle(pathname))
  }, [pathname])

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
      <p className="text-muted-foreground mt-1">نظام إدارة العقارات</p>
    </div>
  )
}