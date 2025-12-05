import { create } from "zustand"

// Types
export interface Unit {
  id: string
  number: string
  name: string
  status: "occupied" | "vacant" | "out-of-service" | "departure-today" | "arrival-today"
  guest?: string
  checkIn?: string
  checkOut?: string
  balance?: number
  type?: string
  floor?: string
  pricePerNight?: number
  propertyId?: string
}

export interface Guest {
  id: string
  name: string
  nationality: string
  idType: string
  idNumber: string
  phone: string
  email: string
  reservations: number
}

export interface Reservation {
  id: string
  date: string
  checkIn: string
  checkOut: string
  nights: number
  unit: string
  guest: string
  pricePerNight: number
  total: number
  paid: number
  balance: number
  status: "active" | "paid" | "upcoming" | "completed" | "cancelled"
  channel?: string
  externalId?: string
}

export interface Invoice {
  id: string
  date: string
  guest: string
  contractNumber: string
  subtotal: number
  vat: number
  total: number
  status: "paid" | "pending" | "overdue"
}

export interface Receipt {
  id: string
  date: string
  type: "income" | "expense"
  amount: number
  method: string
  reservationNumber: string
  notes: string
  user: string
}

export interface PaymentLink {
  id: string
  createdAt: string
  amount: number
  description: string
  status: "active" | "paid" | "expired"
  expiresAt: string
  url: string
}

export interface Property {
  id: string
  name: string
  nameAr: string
  type: "hotel" | "apartments" | "resort" | "villa"
  address: string
  city: string
  country: string
  unitsCount: number
  status: "active" | "inactive"
  channelConnected: boolean
  image?: string
}

export interface Message {
  id: string
  conversationId: string
  sender: "guest" | "staff"
  content: string
  timestamp: string
  read: boolean
}

export interface Conversation {
  id: string
  guestId: string
  guestName: string
  reservationId?: string
  channel: "direct" | "booking" | "airbnb" | "whatsapp" | "email"
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: "open" | "resolved" | "pending"
}

export interface SmartLock {
  id: string
  unitId: string
  unitNumber: string
  provider: "ttlock" | "yale" | "august" | "schlage"
  deviceId: string
  status: "online" | "offline" | "low-battery"
  batteryLevel: number
  lastSync: string
}

export interface AccessKey {
  id: string
  lockId: string
  reservationId: string
  guestName: string
  code: string
  validFrom: string
  validTo: string
  status: "active" | "expired" | "revoked"
  usageCount: number
}

export interface Task {
  id: string
  title: string
  description: string
  type: "cleaning" | "maintenance" | "inspection" | "other"
  unitId?: string
  unitNumber?: string
  assignedTo: string
  dueDate: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  createdAt: string
}

export interface OwnerStatement {
  id: string
  ownerId: string
  ownerName: string
  period: string
  totalRevenue: number
  expenses: number
  commission: number
  netPayout: number
  status: "draft" | "sent" | "paid"
  createdAt: string
}

// Initial Data
const initialUnits: Unit[] = [
  {
    id: "1",
    number: "101",
    name: "جناح ديلوكس",
    status: "occupied",
    guest: "محمد أحمد العلي",
    checkIn: "2024-01-15",
    checkOut: "2024-01-20",
    balance: 1500,
    type: "suite",
    floor: "1",
    pricePerNight: 500,
    propertyId: "1",
  },
  {
    id: "2",
    number: "102",
    name: "غرفة عادية",
    status: "vacant",
    type: "room",
    floor: "1",
    pricePerNight: 300,
    propertyId: "1",
  },
  {
    id: "3",
    number: "103",
    name: "جناح رئاسي",
    status: "departure-today",
    guest: "سارة محمد الخالد",
    checkIn: "2024-01-10",
    checkOut: "2024-01-18",
    balance: 0,
    type: "suite",
    floor: "1",
    pricePerNight: 800,
    propertyId: "1",
  },
  {
    id: "4",
    number: "104",
    name: "غرفة مزدوجة",
    status: "arrival-today",
    guest: "أحمد خالد السعيد",
    checkIn: "2024-01-18",
    checkOut: "2024-01-25",
    balance: 3200,
    type: "room",
    floor: "1",
    pricePerNight: 400,
    propertyId: "1",
  },
  {
    id: "5",
    number: "105",
    name: "استوديو",
    status: "out-of-service",
    type: "studio",
    floor: "1",
    pricePerNight: 350,
    propertyId: "1",
  },
  {
    id: "6",
    number: "106",
    name: "جناح عائلي",
    status: "occupied",
    guest: "فاطمة علي الحسن",
    checkIn: "2024-01-12",
    checkOut: "2024-01-22",
    balance: 800,
    type: "suite",
    floor: "1",
    pricePerNight: 600,
    propertyId: "1",
  },
  {
    id: "7",
    number: "201",
    name: "غرفة فردية",
    status: "vacant",
    type: "room",
    floor: "2",
    pricePerNight: 250,
    propertyId: "2",
  },
  {
    id: "8",
    number: "202",
    name: "جناح تنفيذي",
    status: "occupied",
    guest: "عمر حسين الرشيد",
    checkIn: "2024-01-16",
    checkOut: "2024-01-19",
    balance: 0,
    type: "suite",
    floor: "2",
    pricePerNight: 700,
    propertyId: "2",
  },
]

const initialGuests: Guest[] = [
  {
    id: "1",
    name: "محمد أحمد العلي",
    nationality: "سعودي",
    idType: "هوية وطنية",
    idNumber: "1234567890",
    phone: "+966 50 123 4567",
    email: "mohammed@email.com",
    reservations: 5,
  },
  {
    id: "2",
    name: "سارة محمد الخالد",
    nationality: "إماراتي",
    idType: "جواز سفر",
    idNumber: "AB1234567",
    phone: "+971 50 987 6543",
    email: "sara@email.com",
    reservations: 3,
  },
  {
    id: "3",
    name: "أحمد خالد السعيد",
    nationality: "كويتي",
    idType: "جواز سفر",
    idNumber: "KW9876543",
    phone: "+965 66 555 1234",
    email: "ahmed@email.com",
    reservations: 8,
  },
  {
    id: "4",
    name: "فاطمة علي الحسن",
    nationality: "قطري",
    idType: "هوية وطنية",
    idNumber: "QA1122334455",
    phone: "+974 33 444 5566",
    email: "fatima@email.com",
    reservations: 2,
  },
  {
    id: "5",
    name: "عمر حسين الرشيد",
    nationality: "بحريني",
    idType: "جواز سفر",
    idNumber: "BH5566778899",
    phone: "+973 36 777 8899",
    email: "omar@email.com",
    reservations: 4,
  },
  {
    id: "6",
    name: "نورة سعد المنصور",
    nationality: "سعودي",
    idType: "هوية وطنية",
    idNumber: "0987654321",
    phone: "+966 55 999 8877",
    email: "noura@email.com",
    reservations: 6,
  },
]

const initialReservations: Reservation[] = [
  {
    id: "RES-001",
    date: "2024-01-15",
    checkIn: "2024-01-18",
    checkOut: "2024-01-22",
    nights: 4,
    unit: "101",
    guest: "محمد أحمد العلي",
    pricePerNight: 500,
    total: 2000,
    paid: 1500,
    balance: 500,
    status: "active",
    channel: "direct",
  },
  {
    id: "RES-002",
    date: "2024-01-14",
    checkIn: "2024-01-20",
    checkOut: "2024-01-25",
    nights: 5,
    unit: "205",
    guest: "سارة محمد الخالد",
    pricePerNight: 750,
    total: 3750,
    paid: 3750,
    balance: 0,
    status: "paid",
    channel: "booking",
    externalId: "BK-12345678",
  },
  {
    id: "RES-003",
    date: "2024-01-16",
    checkIn: "2024-02-01",
    checkOut: "2024-02-05",
    nights: 4,
    unit: "302",
    guest: "أحمد خالد السعيد",
    pricePerNight: 600,
    total: 2400,
    paid: 1200,
    balance: 1200,
    status: "upcoming",
    channel: "airbnb",
    externalId: "AB-98765432",
  },
  {
    id: "RES-004",
    date: "2024-01-10",
    checkIn: "2024-01-12",
    checkOut: "2024-01-15",
    nights: 3,
    unit: "108",
    guest: "فاطمة علي الحسن",
    pricePerNight: 450,
    total: 1350,
    paid: 1350,
    balance: 0,
    status: "completed",
    channel: "direct",
  },
  {
    id: "RES-005",
    date: "2024-01-17",
    checkIn: "2024-01-19",
    checkOut: "2024-01-23",
    nights: 4,
    unit: "201",
    guest: "عمر حسين الرشيد",
    pricePerNight: 550,
    total: 2200,
    paid: 2200,
    balance: 0,
    status: "paid",
    channel: "booking",
    externalId: "BK-87654321",
  },
]

const initialInvoices: Invoice[] = [
  {
    id: "INV-001",
    date: "2024-01-15",
    guest: "محمد أحمد العلي",
    contractNumber: "RES-001",
    subtotal: 2000,
    vat: 300,
    total: 2300,
    status: "paid",
  },
  {
    id: "INV-002",
    date: "2024-01-14",
    guest: "سارة محمد الخالد",
    contractNumber: "RES-002",
    subtotal: 3750,
    vat: 562.5,
    total: 4312.5,
    status: "paid",
  },
  {
    id: "INV-003",
    date: "2024-01-16",
    guest: "أحمد خالد السعيد",
    contractNumber: "RES-003",
    subtotal: 2400,
    vat: 360,
    total: 2760,
    status: "pending",
  },
  {
    id: "INV-004",
    date: "2024-01-10",
    guest: "فاطمة علي الحسن",
    contractNumber: "RES-004",
    subtotal: 1350,
    vat: 202.5,
    total: 1552.5,
    status: "paid",
  },
  {
    id: "INV-005",
    date: "2024-01-17",
    guest: "عمر حسين الرشيد",
    contractNumber: "RES-005",
    subtotal: 2200,
    vat: 330,
    total: 2530,
    status: "overdue",
  },
]

const initialReceipts: Receipt[] = [
  {
    id: "RCP-001",
    date: "2024-01-15 10:30",
    type: "income",
    amount: 1500,
    method: "بطاقة ائتمان",
    reservationNumber: "RES-001",
    notes: "دفعة مقدمة",
    user: "أحمد محمد",
  },
  {
    id: "RCP-002",
    date: "2024-01-14 14:45",
    type: "income",
    amount: 3750,
    method: "تحويل بنكي",
    reservationNumber: "RES-002",
    notes: "دفع كامل",
    user: "سارة علي",
  },
  {
    id: "RCP-003",
    date: "2024-01-16 09:15",
    type: "expense",
    amount: 500,
    method: "نقدي",
    reservationNumber: "-",
    notes: "صيانة الوحدة 105",
    user: "خالد حسن",
  },
  {
    id: "RCP-004",
    date: "2024-01-15 16:20",
    type: "income",
    amount: 1200,
    method: "نقدي",
    reservationNumber: "RES-003",
    notes: "دفعة جزئية",
    user: "أحمد محمد",
  },
  {
    id: "RCP-005",
    date: "2024-01-17 11:00",
    type: "expense",
    amount: 1200,
    method: "تحويل بنكي",
    reservationNumber: "-",
    notes: "فواتير كهرباء",
    user: "نورة سعد",
  },
  {
    id: "RCP-006",
    date: "2024-01-17 13:30",
    type: "income",
    amount: 2200,
    method: "بطاقة ائتمان",
    reservationNumber: "RES-005",
    notes: "دفع كامل",
    user: "أحمد محمد",
  },
]

const initialPaymentLinks: PaymentLink[] = [
  {
    id: "PL-001",
    createdAt: "2024-01-15",
    amount: 2300,
    description: "حجز وحدة 101",
    status: "active",
    expiresAt: "2024-01-22",
    url: "https://pay.pms.com/pl-001",
  },
  {
    id: "PL-002",
    createdAt: "2024-01-14",
    amount: 1500,
    description: "دفعة مقدمة - RES-003",
    status: "paid",
    expiresAt: "2024-01-21",
    url: "https://pay.pms.com/pl-002",
  },
  {
    id: "PL-003",
    createdAt: "2024-01-13",
    amount: 3750,
    description: "حجز جناح رئاسي",
    status: "expired",
    expiresAt: "2024-01-20",
    url: "https://pay.pms.com/pl-003",
  },
  {
    id: "PL-004",
    createdAt: "2024-01-16",
    amount: 800,
    description: "رسوم إضافية",
    status: "active",
    expiresAt: "2024-01-23",
    url: "https://pay.pms.com/pl-004",
  },
  {
    id: "PL-005",
    createdAt: "2024-01-17",
    amount: 4500,
    description: "حجز جناح عائلي",
    status: "active",
    expiresAt: "2024-01-24",
    url: "https://pay.pms.com/pl-005",
  },
]

const initialProperties: Property[] = [
  {
    id: "1",
    name: "Alula Sky Hotel",
    nameAr: "فندق علولا سكاي",
    type: "hotel",
    address: "شارع الملك فهد",
    city: "الرياض",
    country: "السعودية",
    unitsCount: 45,
    status: "active",
    channelConnected: true,
    image: "/luxury-hotel-exterior.png",
  },
  {
    id: "2",
    name: "Alula Sky Apartments",
    nameAr: "شقق علولا سكاي",
    type: "apartments",
    address: "حي النخيل",
    city: "جدة",
    country: "السعودية",
    unitsCount: 28,
    status: "active",
    channelConnected: true,
    image: "/modern-apartment-building.png",
  },
  {
    id: "3",
    name: "Alula Sky Resort",
    nameAr: "منتجع علولا سكاي",
    type: "resort",
    address: "طريق البحر",
    city: "الدمام",
    country: "السعودية",
    unitsCount: 60,
    status: "active",
    channelConnected: false,
    image: "/tropical-beach-resort.png",
  },
]

const initialConversations: Conversation[] = [
  {
    id: "conv-1",
    guestId: "1",
    guestName: "محمد أحمد العلي",
    reservationId: "RES-001",
    channel: "whatsapp",
    lastMessage: "شكراً لكم، سأصل غداً إن شاء الله",
    lastMessageTime: "2024-01-17 14:30",
    unreadCount: 2,
    status: "open",
  },
  {
    id: "conv-2",
    guestId: "2",
    guestName: "سارة محمد الخالد",
    reservationId: "RES-002",
    channel: "booking",
    lastMessage: "هل يمكنني الحصول على غرفة بإطلالة على البحر؟",
    lastMessageTime: "2024-01-17 12:15",
    unreadCount: 1,
    status: "pending",
  },
  {
    id: "conv-3",
    guestId: "3",
    guestName: "أحمد خالد السعيد",
    reservationId: "RES-003",
    channel: "airbnb",
    lastMessage: "تم تأكيد الحجز",
    lastMessageTime: "2024-01-16 18:00",
    unreadCount: 0,
    status: "resolved",
  },
  {
    id: "conv-4",
    guestId: "4",
    guestName: "فاطمة علي الحسن",
    channel: "email",
    lastMessage: "استفسار عن الأسعار للشهر القادم",
    lastMessageTime: "2024-01-17 09:45",
    unreadCount: 1,
    status: "open",
  },
]

const initialMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    sender: "guest",
    content: "مرحباً، أريد تأكيد موعد الوصول",
    timestamp: "2024-01-17 14:00",
    read: true,
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    sender: "staff",
    content: "أهلاً بك، موعد تسجيل الدخول من الساعة 3 مساءً",
    timestamp: "2024-01-17 14:15",
    read: true,
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    sender: "guest",
    content: "شكراً لكم، سأصل غداً إن شاء الله",
    timestamp: "2024-01-17 14:30",
    read: false,
  },
  {
    id: "msg-4",
    conversationId: "conv-2",
    sender: "guest",
    content: "هل يمكنني الحصول على غرفة بإطلالة على البحر؟",
    timestamp: "2024-01-17 12:15",
    read: false,
  },
]

const initialSmartLocks: SmartLock[] = [
  {
    id: "lock-1",
    unitId: "1",
    unitNumber: "101",
    provider: "ttlock",
    deviceId: "TT-001234",
    status: "online",
    batteryLevel: 85,
    lastSync: "2024-01-17 15:00",
  },
  {
    id: "lock-2",
    unitId: "2",
    unitNumber: "102",
    provider: "ttlock",
    deviceId: "TT-001235",
    status: "online",
    batteryLevel: 92,
    lastSync: "2024-01-17 15:00",
  },
  {
    id: "lock-3",
    unitId: "3",
    unitNumber: "103",
    provider: "yale",
    deviceId: "YL-005678",
    status: "low-battery",
    batteryLevel: 15,
    lastSync: "2024-01-17 14:30",
  },
  {
    id: "lock-4",
    unitId: "4",
    unitNumber: "104",
    provider: "ttlock",
    deviceId: "TT-001236",
    status: "offline",
    batteryLevel: 0,
    lastSync: "2024-01-16 10:00",
  },
  {
    id: "lock-5",
    unitId: "6",
    unitNumber: "106",
    provider: "august",
    deviceId: "AU-009876",
    status: "online",
    batteryLevel: 78,
    lastSync: "2024-01-17 15:00",
  },
]

const initialAccessKeys: AccessKey[] = [
  {
    id: "key-1",
    lockId: "lock-1",
    reservationId: "RES-001",
    guestName: "محمد أحمد العلي",
    code: "123456",
    validFrom: "2024-01-18 15:00",
    validTo: "2024-01-22 12:00",
    status: "active",
    usageCount: 3,
  },
  {
    id: "key-2",
    lockId: "lock-3",
    reservationId: "RES-003",
    guestName: "سارة محمد الخالد",
    code: "789012",
    validFrom: "2024-01-10 15:00",
    validTo: "2024-01-18 12:00",
    status: "active",
    usageCount: 8,
  },
  {
    id: "key-3",
    lockId: "lock-4",
    reservationId: "RES-004",
    guestName: "أحمد خالد السعيد",
    code: "345678",
    validFrom: "2024-01-18 15:00",
    validTo: "2024-01-25 12:00",
    status: "active",
    usageCount: 0,
  },
]

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "تنظيف وحدة 103",
    description: "تنظيف شامل بعد مغادرة الضيف",
    type: "cleaning",
    unitId: "3",
    unitNumber: "103",
    assignedTo: "فريق التنظيف",
    dueDate: "2024-01-18",
    status: "todo",
    priority: "high",
    createdAt: "2024-01-17",
  },
  {
    id: "task-2",
    title: "صيانة المكيف",
    description: "فحص وصيانة المكيف في الوحدة 105",
    type: "maintenance",
    unitId: "5",
    unitNumber: "105",
    assignedTo: "أحمد الفني",
    dueDate: "2024-01-19",
    status: "in-progress",
    priority: "medium",
    createdAt: "2024-01-16",
  },
  {
    id: "task-3",
    title: "فحص الوحدة 201",
    description: "فحص دوري للوحدة",
    type: "inspection",
    unitId: "7",
    unitNumber: "201",
    assignedTo: "مدير الصيانة",
    dueDate: "2024-01-20",
    status: "todo",
    priority: "low",
    createdAt: "2024-01-17",
  },
  {
    id: "task-4",
    title: "تجهيز وحدة 104",
    description: "تجهيز الوحدة لوصول الضيف",
    type: "cleaning",
    unitId: "4",
    unitNumber: "104",
    assignedTo: "فريق التنظيف",
    dueDate: "2024-01-18",
    status: "completed",
    priority: "high",
    createdAt: "2024-01-17",
  },
]

const initialOwnerStatements: OwnerStatement[] = [
  {
    id: "stmt-1",
    ownerId: "owner-1",
    ownerName: "عبدالله المالكي",
    period: "يناير 2024",
    totalRevenue: 45000,
    expenses: 5000,
    commission: 4500,
    netPayout: 35500,
    status: "sent",
    createdAt: "2024-01-15",
  },
  {
    id: "stmt-2",
    ownerId: "owner-2",
    ownerName: "سعود الدوسري",
    period: "يناير 2024",
    totalRevenue: 32000,
    expenses: 3200,
    commission: 3200,
    netPayout: 25600,
    status: "draft",
    createdAt: "2024-01-17",
  },
  {
    id: "stmt-3",
    ownerId: "owner-1",
    ownerName: "عبدالله المالكي",
    period: "ديسمبر 2023",
    totalRevenue: 52000,
    expenses: 6000,
    commission: 5200,
    netPayout: 40800,
    status: "paid",
    createdAt: "2023-12-31",
  },
]

// Store
interface PMSStore {
  units: Unit[]
  guests: Guest[]
  reservations: Reservation[]
  invoices: Invoice[]
  receipts: Receipt[]
  paymentLinks: PaymentLink[]
  properties: Property[]
  conversations: Conversation[]
  messages: Message[]
  smartLocks: SmartLock[]
  accessKeys: AccessKey[]
  tasks: Task[]
  ownerStatements: OwnerStatement[]

  // Unit actions
  addUnit: (unit: Omit<Unit, "id">) => void
  updateUnit: (id: string, unit: Partial<Unit>) => void
  deleteUnit: (id: string) => void

  // Guest actions
  addGuest: (guest: Omit<Guest, "id">) => void
  updateGuest: (id: string, guest: Partial<Guest>) => void
  deleteGuest: (id: string) => void

  // Reservation actions
  addReservation: (reservation: Omit<Reservation, "id">) => void
  updateReservation: (id: string, reservation: Partial<Reservation>) => void
  deleteReservation: (id: string) => void

  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, "id">) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void

  // Receipt actions
  addReceipt: (receipt: Omit<Receipt, "id">) => void
  updateReceipt: (id: string, receipt: Partial<Receipt>) => void
  deleteReceipt: (id: string) => void

  // Payment Link actions
  addPaymentLink: (link: Omit<PaymentLink, "id">) => void
  updatePaymentLink: (id: string, link: Partial<PaymentLink>) => void
  deletePaymentLink: (id: string) => void

  // Property actions
  addProperty: (property: Omit<Property, "id">) => void
  updateProperty: (id: string, property: Partial<Property>) => void
  deleteProperty: (id: string) => void

  // Conversation actions
  addConversation: (conversation: Omit<Conversation, "id">) => void
  updateConversation: (id: string, conversation: Partial<Conversation>) => void
  markConversationRead: (id: string) => void

  // Message actions
  addMessage: (message: Omit<Message, "id">) => void

  // Smart Lock actions
  addSmartLock: (lock: Omit<SmartLock, "id">) => void
  updateSmartLock: (id: string, lock: Partial<SmartLock>) => void
  deleteSmartLock: (id: string) => void

  // Access Key actions
  addAccessKey: (key: Omit<AccessKey, "id">) => void
  updateAccessKey: (id: string, key: Partial<AccessKey>) => void
  revokeAccessKey: (id: string) => void

  // Task actions
  addTask: (task: Omit<Task, "id">) => void
  updateTask: (id: string, task: Partial<Task>) => void
  deleteTask: (id: string) => void

  // Owner Statement actions
  addOwnerStatement: (statement: Omit<OwnerStatement, "id">) => void
  updateOwnerStatement: (id: string, statement: Partial<OwnerStatement>) => void
}

export const usePMSStore = create<PMSStore>((set) => ({
  units: initialUnits,
  guests: initialGuests,
  reservations: initialReservations,
  invoices: initialInvoices,
  receipts: initialReceipts,
  paymentLinks: initialPaymentLinks,
  properties: initialProperties,
  conversations: initialConversations,
  messages: initialMessages,
  smartLocks: initialSmartLocks,
  accessKeys: initialAccessKeys,
  tasks: initialTasks,
  ownerStatements: initialOwnerStatements,

  // Unit actions
  addUnit: (unit) =>
    set((state) => ({
      units: [...state.units, { ...unit, id: `unit-${Date.now()}` }],
    })),
  updateUnit: (id, unit) =>
    set((state) => ({
      units: state.units.map((u) => (u.id === id ? { ...u, ...unit } : u)),
    })),
  deleteUnit: (id) =>
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    })),

  // Guest actions
  addGuest: (guest) =>
    set((state) => ({
      guests: [...state.guests, { ...guest, id: `guest-${Date.now()}` }],
    })),
  updateGuest: (id, guest) =>
    set((state) => ({
      guests: state.guests.map((g) => (g.id === id ? { ...g, ...guest } : g)),
    })),
  deleteGuest: (id) =>
    set((state) => ({
      guests: state.guests.filter((g) => g.id !== id),
    })),

  // Reservation actions
  addReservation: (reservation) =>
    set((state) => ({
      reservations: [
        ...state.reservations,
        { ...reservation, id: `RES-${String(state.reservations.length + 1).padStart(3, "0")}` },
      ],
    })),
  updateReservation: (id, reservation) =>
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, ...reservation } : r)),
    })),
  deleteReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    })),

  // Invoice actions
  addInvoice: (invoice) =>
    set((state) => ({
      invoices: [...state.invoices, { ...invoice, id: `INV-${String(state.invoices.length + 1).padStart(3, "0")}` }],
    })),
  updateInvoice: (id, invoice) =>
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...invoice } : i)),
    })),
  deleteInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== id),
    })),

  // Receipt actions
  addReceipt: (receipt) =>
    set((state) => ({
      receipts: [...state.receipts, { ...receipt, id: `RCP-${String(state.receipts.length + 1).padStart(3, "0")}` }],
    })),
  updateReceipt: (id, receipt) =>
    set((state) => ({
      receipts: state.receipts.map((r) => (r.id === id ? { ...r, ...receipt } : r)),
    })),
  deleteReceipt: (id) =>
    set((state) => ({
      receipts: state.receipts.filter((r) => r.id !== id),
    })),

  // Payment Link actions
  addPaymentLink: (link) =>
    set((state) => ({
      paymentLinks: [
        ...state.paymentLinks,
        { ...link, id: `PL-${String(state.paymentLinks.length + 1).padStart(3, "0")}` },
      ],
    })),
  updatePaymentLink: (id, link) =>
    set((state) => ({
      paymentLinks: state.paymentLinks.map((l) => (l.id === id ? { ...l, ...link } : l)),
    })),
  deletePaymentLink: (id) =>
    set((state) => ({
      paymentLinks: state.paymentLinks.filter((l) => l.id !== id),
    })),

  // Property actions
  addProperty: (property) =>
    set((state) => ({
      properties: [...state.properties, { ...property, id: `prop-${Date.now()}` }],
    })),
  updateProperty: (id, property) =>
    set((state) => ({
      properties: state.properties.map((p) => (p.id === id ? { ...p, ...property } : p)),
    })),
  deleteProperty: (id) =>
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
    })),

  // Conversation actions
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [...state.conversations, { ...conversation, id: `conv-${Date.now()}` }],
    })),
  updateConversation: (id, conversation) =>
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? { ...c, ...conversation } : c)),
    })),
  markConversationRead: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
      messages: state.messages.map((m) => (m.conversationId === id ? { ...m, read: true } : m)),
    })),

  // Message actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: `msg-${Date.now()}` }],
      conversations: state.conversations.map((c) =>
        c.id === message.conversationId
          ? {
              ...c,
              lastMessage: message.content,
              lastMessageTime: message.timestamp,
              unreadCount: message.sender === "guest" ? c.unreadCount + 1 : c.unreadCount,
            }
          : c,
      ),
    })),

  // Smart Lock actions
  addSmartLock: (lock) =>
    set((state) => ({
      smartLocks: [...state.smartLocks, { ...lock, id: `lock-${Date.now()}` }],
    })),
  updateSmartLock: (id, lock) =>
    set((state) => ({
      smartLocks: state.smartLocks.map((l) => (l.id === id ? { ...l, ...lock } : l)),
    })),
  deleteSmartLock: (id) =>
    set((state) => ({
      smartLocks: state.smartLocks.filter((l) => l.id !== id),
    })),

  // Access Key actions
  addAccessKey: (key) =>
    set((state) => ({
      accessKeys: [...state.accessKeys, { ...key, id: `key-${Date.now()}` }],
    })),
  updateAccessKey: (id, key) =>
    set((state) => ({
      accessKeys: state.accessKeys.map((k) => (k.id === id ? { ...k, ...key } : k)),
    })),
  revokeAccessKey: (id) =>
    set((state) => ({
      accessKeys: state.accessKeys.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)),
    })),

  // Task actions
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: `task-${Date.now()}` }],
    })),
  updateTask: (id, task) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  // Owner Statement actions
  addOwnerStatement: (statement) =>
    set((state) => ({
      ownerStatements: [...state.ownerStatements, { ...statement, id: `stmt-${Date.now()}` }],
    })),
  updateOwnerStatement: (id, statement) =>
    set((state) => ({
      ownerStatements: state.ownerStatements.map((s) => (s.id === id ? { ...s, ...statement } : s)),
    })),
}))
