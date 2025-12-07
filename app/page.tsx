'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Menu,
  Star,
  Award,
  Sparkles,
  User,
  LogOut,
  MapPin,
  Calendar,
  Home,
  Search,
  Heart,
  ShoppingCart,
  Phone,
  Mail,
  Globe,
  Users,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Mountain,
  Building,
  Moon,
  Sun,
  Check,
  X,
  ChefHat,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { PublicUnitsDisplayClient } from '@/components/public-units-display-client';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase/client';

// Function to get initial language from URL or localStorage
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl === 'ar' || langFromUrl === 'en') {
      return langFromUrl;
    }

    const savedLang = localStorage.getItem('language');
    if (savedLang === 'ar' || savedLang === 'en') {
      return savedLang;
    }
  }
  return 'en'; // default language
};

// Navigation menu items in both languages
const navigation = {
  en: [
    { name: 'Home', href: '/' },
    { name: 'Popular Cities', href: '#cities' },
    { name: 'Deals', href: '#offers' },
    { name: 'Packages', href: '/packages' },
    { name: 'Monthly Rentals', href: '#monthly' },
    { name: 'Contact', href: '#contact' },
  ],
  ar: [
    { name: 'الرئيسية', href: '/' },
    { name: 'المدن الشهيرة', href: '#cities' },
    { name: 'العروض', href: '#offers' },
    { name: 'الباقات', href: '/packages' },
    { name: 'الإيجارات الشهرية', href: '#monthly' },
    { name: 'اتصل بنا', href: '#contact' },
  ]
};

// Popular Saudi Arabian cities data
const popularCities = [
  { id: 1, name: 'Riyadh', image: '/cities/riyadh-kingdom-tower.jpg', href: '/search?city=riyadh', region: 'Riyadh Region' },
  { id: 2, name: 'Jeddah', image: '/cities/jeddah-seafront.jpg', href: '/search?city=jeddah', region: 'Makkah Region' },
  { id: 3, name: 'Makkah', image: '/cities/makkah-haram.jpg', href: '/search?city=makkah', region: 'Makkah Region' },
  { id: 4, name: 'Medina', image: '/cities/medina-prophet-mosque.jpg', href: '/search?city=medina', region: 'Al Madinah Region' },
  { id: 5, name: 'Dammam', image: '/cities/dammam-cityscape.jpg', href: '/search?city=dammam', region: 'Eastern Province' },
  { id: 6, name: 'Tabuk', image: '/cities/tabuk-heritage.jpg', href: '/search?city=tabuk', region: 'Tabuk Region' },
  { id: 7, name: 'Al Khobar', image: '/cities/khobar-marina.jpg', href: '/search?city=khobar', region: 'Eastern Province' },
  { id: 8, name: 'Taif', image: '/cities/taif-mountain.jpg', href: '/search?city=taif', region: 'Makkah Region' },
  { id: 9, name: 'Abha', image: '/cities/abha-asir-region.jpg', href: '/search?city=abha', region: 'Asir Region' },
  { id: 10, name: 'Hail', image: '/cities/hail-district.jpg', href: '/search?city=hail', region: 'Hail Region' },
  { id: 11, name: 'Arar', image: '/cities/arar-northern-borders.jpg', href: '/search?city=arar', region: 'Northern Borders Region' },
  { id: 12, name: 'Al Bahah', image: '/cities/bahah-mountainous.jpg', href: '/search?city=bahah', region: 'Al Bahah Region' },
];

// Daily offers data - This could be fetched from an API in a real application
const dailyOffers = [
  {
    id: 1,
    title: 'Royal Palace Hotel - 35% Off',
    description: 'Luxury accommodation in the heart of Riyadh with spa and dining',
    originalPrice: 950,
    discountedPrice: 618,
    image: '/offers/riyadh-ritz-carlton-exterior.jpg',
    discountPercentage: 35,
    location: 'Riyadh',
    rating: 4.8,
  },
  {
    id: 2,
    title: 'Marina Resort Jeddah - 30% Summer Discount',
    description: 'Beachfront luxury resort with private beach access',
    originalPrice: 820,
    discountedPrice: 574,
    image: '/offers/jeddah-fairmont-beach.jpg',
    discountPercentage: 30,
    location: 'Jeddah',
    rating: 4.7,
  },
  {
    id: 3,
    title: 'Abraj Al Bait - Makkah Special',
    description: 'Premium hotel near Haram with stunning views',
    originalPrice: 750,
    discountedPrice: 525,
    image: '/offers/makkah-abraj-al-bait-haram-view.jpg',
    discountPercentage: 30,
    location: 'Makkah',
    rating: 4.9,
  },
  {
    id: 4,
    title: 'The Red Sea Project - Exclusive Offer',
    description: 'Ultra-luxury resort in the new Red Sea destination',
    originalPrice: 1500,
    discountedPrice: 1200,
    image: '/offers/red-sea-private-beach.jpg',
    discountPercentage: 20,
    location: 'The Red Sea',
    rating: 5.0,
  },
  {
    id: 5,
    title: 'Al Ula Heritage Resort - Cultural Experience',
    description: 'Unique desert resort with cultural activities',
    originalPrice: 680,
    discountedPrice: 476,
    image: '/offers/alula-anantara-petra-style.jpg',
    discountPercentage: 30,
    location: 'AlUla',
    rating: 4.6,
  },
  {
    id: 6,
    title: 'Dammam Business Hotels - Corporate Rates',
    description: 'Top business hotels with conference facilities',
    originalPrice: 550,
    discountedPrice: 413,
    image: '/offers/dammam-four-seasons-business.jpg',
    discountPercentage: 25,
    location: 'Dammam',
    rating: 4.5,
  },
];

// This will be replaced by dynamic data from the database
// See the component implementation below for the actual data fetching

// Self-check-in accommodations in Saudi Arabia
const selfCheckInAccommodations = [
  {
    id: 1,
    name: 'Kingdom Tower Modern Apartment',
    location: 'Riyadh',
    rating: 4.5,
    price: 480,
    amenities: ['Self Check-in', 'WiFi', 'AC', 'Smart TV'],
    image: '/accommodations/riyadh-kingdom-center-apartments.jpg',
    description: 'Modern serviced apartment in Riyadh with smart check-in system',
  },
  {
    id: 2,
    name: 'Red Sea Private Villa',
    location: 'Jeddah',
    rating: 4.8,
    price: 1250,
    amenities: ['Self Check-in', 'WiFi', 'AC', 'Private Pool'],
    image: '/accommodations/jeddah-red-sea-private-villas.jpg',
    description: 'Luxury private villa with beach access and automated check-in',
  },
  {
    id: 3,
    name: 'Diplomatic Quarter Suite',
    location: 'Riyadh',
    rating: 4.6,
    price: 650,
    amenities: ['Self Check-in', 'WiFi', 'AC', 'Concierge'],
    image: '/accommodations/riyadh-diplomatic-quarter-luxury-suite.jpg',
    description: 'Executive suite with contactless check-in for business travelers',
  },
];

// Monthly rentals in Saudi Arabia
const monthlyRentals = [
  {
    id: 1,
    name: 'Premium Diplomatic Quarter Apartment',
    location: 'Riyadh',
    rating: 4.7,
    monthlyPrice: 15000,
    image: '/rentals/riyadh-diplomatic-quarter-luxury-apartments.jpg',
    description: 'Luxury fully furnished apartment in the diplomatic quarter',
  },
  {
    id: 2,
    name: 'Red Sea Beachfront Villa',
    location: 'Jeddah',
    rating: 4.9,
    monthlyPrice: 28000,
    image: '/rentals/jeddah-red-sea-beachfront-villas.jpg',
    description: 'Premium beachfront villa with stunning Red Sea views',
  },
  {
    id: 3,
    name: 'Eastern Province Family Compound',
    location: 'Dhahran',
    rating: 4.5,
    monthlyPrice: 22000,
    image: '/rentals/dhahran-eastern-family-compounds.jpg',
    description: 'Spacious family compound with multiple bedrooms and facilities',
  },
  {
    id: 4,
    name: 'Historic District Luxury Home',
    location: 'AlUla',
    rating: 4.6,
    monthlyPrice: 18000,
    image: '/rentals/alula-historical-district-luxury-home.jpg',
    description: 'Luxury home with cultural significance and modern amenities',
  },
];

// Function to render stars based on rating
const renderStars = (rating: number) => {
  return [...Array(5)].map((_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`}
    />
  ));
};

export default function HomePage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setUserLoading(false);
        }
      };
      fetchProfile();
    } else {
      setUserLoading(false);
    }
  }, [user]);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

  // State for search form
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');

  useEffect(() => {
    const initialLang = getInitialLanguage();
    setLanguage(initialLang as 'en' | 'ar');
    setDir(initialLang === 'ar' ? 'rtl' : 'ltr');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would route to search results
    console.log({ destination, checkIn, checkOut, roomType });
  };

  // Function to toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setDir(newLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('language', newLang);
  };

  // Get navigation based on current language
  const currentNavigation = navigation[language];

  // Content based on language
  const content = {
    en: {
      luxurySystem: 'Luxury Hotel Management System',
      hospitality: 'Exceptional Hospitality',
      meets: 'Meets',
      ultimateComfort: 'Ultimate Comfort',
      propertyRental: 'Premium property rental service in Saudi Arabia, offering unique experiences for your guests',
      destinationLabel: 'Destination',
      destinationPlaceholder: 'City or Area',
      checkInLabel: 'Check-in',
      checkOutLabel: 'Check-out',
      placeTypeLabel: 'Place Type',
      all: 'All',
      apartment: 'Apartment',
      studio: 'Studio',
      room: 'Room',
      villa: 'Villa',
      search: 'Search',
      stars: '5 Stars',
      trusted: 'Trusted by 500+ Hotels',
      support: '24/7 Support',
      scrollDown: 'Scroll down',
      popularCities: 'Popular Cities',
      featuredDestinations: 'Favorite Destinations',
      discover: 'Discover the best accommodations in Saudi Arabia\'s cities',
      dailyDeals: 'Daily Deals',
      amazingDeals: 'Amazing Deals',
      discoverDeals: 'Discover the best deals available today',
      packages: 'Packages',
      packageSubtitle: 'Choose the plan that suits your needs and start managing your hotel efficiently',
      selfCheckin: 'Self Check-in',
      convenientPlaces: 'Convenient places with self check-in system',
      monthlyRentals: 'Monthly Rentals',
      perfectPlace: 'Find your perfect place for monthly stays',
      premiumAmenities: 'Premium Amenities',
      amenitiesForPerfectStay: 'All the amenities you need for a perfect stay',
      guestReviews: 'Guest Reviews',
      whatGuestsSay: 'What Our Guests Say',
      realExperiences: 'Real experiences from our valued customers',
      contactUs: 'Contact Us',
      getInTouch: 'Get In Touch',
      haveQuestions: 'Have questions? We\'re here to help 24/7',
      contactInfo: 'Contact Information',
      phone: 'Phone',
      email: 'Email',
      sendUsMessage: 'Send Us a Message',
      nameLabel: 'Name',
      emailLabel: 'Email',
      messageLabel: 'Message',
      sendMessage: 'Send Message',
      about: 'About',
      terms: 'Terms',
      privacy: 'Privacy',
      home: 'Home',
      popularCitiesNav: 'Popular Cities',
      deals: 'Deals',
      packagesNav: 'Packages',
      monthlyRentalsNav: 'Monthly Rentals',
      contact: 'Contact',
      switchLanguage: 'Switch Language'
    },
    ar: {
      luxurySystem: 'نظام إدارة الفنادق الفاخرة',
      hospitality: 'ضيافة استثنائية',
      meets: 'تلتقي',
      ultimateComfort: 'بأعلى مستويات الراحة',
      propertyRental: 'خدمة تأجير ممتلكات سكنية متميزة في المملكة العربية السعودية تقدم تجربة فريدة لضيوفك',
      destinationLabel: 'الوجهة',
      destinationPlaceholder: 'المدينة أو المنطقة',
      checkInLabel: 'تاريخ الوصول',
      checkOutLabel: 'تاريخ المغادرة',
      placeTypeLabel: 'نوع المكان',
      all: 'الكل',
      apartment: 'شقة',
      studio: 'استوديو',
      room: 'غرفة',
      villa: 'فيلا',
      search: 'بحث',
      stars: '5 نجوم',
      trusted: 'م Trusted by 500+ Hotels',
      support: '24/7 دعم',
      scrollDown: 'اسحب للأسفل',
      popularCities: 'المدن الشهيرة',
      featuredDestinations: 'وجهات مميزة',
      discover: 'اكتشف أفضل أماكن الإقامة في مدن المملكة العربية السعودية',
      dailyDeals: 'العروض اليومية',
      amazingDeals: 'صفقات مذهلة',
      discoverDeals: 'اكتشف أفضل العروض المتوفرة اليوم',
      packages: 'الباقات',
      packageSubtitle: 'اختر الخطة التي تناسب احتياجاتك وابدأ في إدارة فندقك بكفاءة',
      selfCheckin: 'دخول ذاتي',
      convenientPlaces: 'أماكن مريحة مع نظام الدخول الذاتي',
      monthlyRentals: 'الإيجارات الشهرية',
      perfectPlace: 'ابحث عن المكان المثالي لفترات الإقامة الشهرية',
      premiumAmenities: 'المرافق المميزة',
      amenitiesForPerfectStay: 'جميع المرافق التي تحتاجها لإقامة مثالية',
      guestReviews: 'مراجعات الضيوف',
      whatGuestsSay: 'ما يقوله ضيوفنا',
      realExperiences: 'تجارب حقيقية من عملائنا القيمين',
      contactUs: 'اتصل بنا',
      getInTouch: 'ابق على تواصل',
      haveQuestions: 'هل لديك أسئلة؟ نحن هنا للمساعدة على مدار الساعة',
      contactInfo: 'معلومات الاتصال',
      phone: 'الهاتف',
      email: 'البريد الإلكتروني',
      sendUsMessage: 'أرسل لنا رسالة',
      nameLabel: 'الاسم',
      emailLabel: 'البريد الإلكتروني',
      messageLabel: 'الرسالة',
      sendMessage: 'إرسال الرسالة',
      about: 'حول',
      terms: 'الشروط',
      privacy: 'الخصوصية',
      home: 'الرئيسية',
      popularCitiesNav: 'المدن الشهيرة',
      deals: 'العروض',
      packagesNav: 'الباقات',
      monthlyRentalsNav: 'الإيجارات الشهرية',
      contact: 'اتصل بنا',
      switchLanguage: 'تبديل اللغة'
    }
  };

  const t = content[language]; // t stands for translation

  return (
    <div className="min-h-screen bg-[#1E2228]" dir={dir}>
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-[#1E2228]/80 backdrop-blur-md border-b border-[#494C4F]/30">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#EBEAE6]" />
            <span className="font-serif text-2xl font-medium tracking-tight text-[#EBEAE6]">{language === 'ar' ? 'وهل هست' : 'WhelHost'}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-12 md:flex">
            {currentNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium tracking-wide text-[#494C4F] transition-colors hover:text-[#EBEAE6]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons - Different based on auth status */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full hover:bg-[#494C4F] transition-colors"
              aria-label={t.switchLanguage}
            >
              <Globe className="h-5 w-5 text-[#EBEAE6]" />
            </button>

            {/* User icons - cart and profile */}
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-[#494C4F] transition-colors" aria-label={language === 'ar' ? 'السلة' : 'Cart'}>
                <ShoppingCart className="h-5 w-5 text-[#EBEAE6]" />
              </button>

              {user ? (
                // User is logged in - show profile dropdown
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 border rounded-full px-1 py-1.5 text-sm hover:bg-[#494C4F] transition-colors focus:outline-none"
                      aria-label={language === 'ar' ? 'قائمة الملف الشخصي' : 'Profile menu'}
                    >
                      <div className="h-8 w-8 rounded-full bg-[#494C4F] flex items-center justify-center overflow-hidden">
                        {userProfile?.avatar_url ? (
                          <img
                            src={userProfile.avatar_url}
                            alt={userProfile.full_name || (language === 'ar' ? 'الملف الشخصي' : 'Profile')}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-4 w-4 text-[#EBEAE6]" />
                          </div>
                        )}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-[#1E2228] border-[#494C4F] text-[#EBEAE6]">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium text-[#EBEAE6]">
                          {userProfile?.full_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-[#494C4F]">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 text-[#EBEAE6]">
                        <Home className="h-4 w-4" />
                        <span>{language === 'ar' ? 'الصفحة الرئيسية للإدارة' : 'Admin Home'}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#494C4F]" />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 text-[#EBEAE6]">
                        <User className="h-4 w-4" />
                        <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#494C4F]" />
                    <DropdownMenuItem asChild>
                      <Link href="/logout" className="flex items-center gap-2 text-red-500">
                        <LogOut className="h-4 w-4" />
                        <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // User is not logged in - show auth buttons
                <>
                  <Button variant="ghost" size="sm" asChild className="text-[#EBEAE6] hover:text-[#EBEAE6]">
                    <Link href="/login">{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</Link>
                  </Button>
                  <Button size="sm" asChild className="rounded-lg bg-white hover:bg-gray-200 px-6 text-[#1E2228]">
                    <Link href="/signup">{language === 'ar' ? 'ابدأ الآن' : 'Get Started'}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5 text-[#EBEAE6]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-[#1E2228] text-[#EBEAE6] border-[#494C4F]">
              <nav className="mt-12 flex flex-col gap-6">
                {currentNavigation.map((item) => (
                  <Link key={item.name} href={item.href} className="font-serif text-2xl font-medium text-[#EBEAE6]">
                    {item.name}
                  </Link>
                ))}

                {/* Language switcher in mobile */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 font-serif text-xl text-[#EBEAE6]"
                >
                  <Globe className="h-5 w-5" />
                  {t.switchLanguage}
                </button>

                <div className="mt-8 flex flex-col gap-4">
                  {user ? (
                    // User is logged in - show profile options
                    <>
                      <Button variant="outline" asChild className="rounded-lg bg-transparent border-amber-800/30 text-[#EBEAE6] hover:bg-[#494C4F]">
                        <Link href="/dashboard">{language === 'ar' ? 'الصفحة الرئيسية للإدارة' : 'Admin Home'}</Link>
                      </Button>

                      {/* Profile Options in Mobile */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" asChild className="justify-start rounded-lg bg-transparent border-amber-800/30 text-[#EBEAE6] hover:bg-[#494C4F]">
                          <Link href="/profile">{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</Link>
                        </Button>
                        <Button variant="outline" asChild className="justify-start rounded-lg bg-transparent border-red-700/30 text-red-600 hover:bg-[#494C4F]">
                          <Link href="/logout">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    // User is not logged in - show auth buttons
                    <>
                      <Button variant="outline" asChild className="rounded-lg bg-transparent border-[#494C4F] text-[#EBEAE6] hover:bg-[#494C4F]">
                        <Link href="/login">{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</Link>
                      </Button>
                      <Button asChild className="rounded-lg bg-white text-[#1E2228]">
                        <Link href="/signup">{language === 'ar' ? 'ابدأ الآن' : 'Get Started'}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="relative flex min-h-screen items-center justify-center pt-20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-100/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-[#494C4F]/50 text-[#EBEAE6] text-sm font-medium">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>{t.luxurySystem}</span>
            </div>

            <h1 className="font-serif text-5xl font-medium leading-tight tracking-tight sm:text-6xl lg:text-7xl text-[#EBEAE6]">
              <span className="italic">{t.hospitality}</span> <span className="text-amber-500">{t.meets}</span> <span className="italic">{t.ultimateComfort}</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#494C4F]">
              {t.propertyRental}
            </p>

            {/* Search Form */}
            <div className="mt-12 max-w-4xl mx-auto bg-[#1E2228] p-6 rounded-2xl shadow-lg border border-[#494C4F]">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#494C4F]">{t.destinationLabel}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#494C4F]" />
                    <input
                      type="text"
                      placeholder={t.destinationPlaceholder}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#494C4F]">{t.checkInLabel}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#494C4F]" />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#494C4F]">{t.checkOutLabel}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#494C4F]" />
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#494C4F]">{t.placeTypeLabel}</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="" className="bg-[#1E2228] text-[#EBEAE6]">{t.all}</option>
                    <option value="apartment" className="bg-[#1E2228] text-[#EBEAE6]">{t.apartment}</option>
                    <option value="studio" className="bg-[#1E2228] text-[#EBEAE6]">{t.studio}</option>
                    <option value="room" className="bg-[#1E2228] text-[#EBEAE6]">{t.room}</option>
                    <option value="villa" className="bg-[#1E2228] text-[#EBEAE6]">{t.villa}</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-amber-800 hover:bg-amber-700 text-[#EBEAE6] py-2">
                    <Search className="h-4 w-4 ml-2" />
                    {t.search}
                  </Button>
                </div>
              </form>
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-[#494C4F]">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-amber-600" />
                <span>{t.stars}</span>
              </div>
              <div className="h-2 w-px bg-[#494C4F]"></div>
              <div>{t.trusted}</div>
              <div className="h-2 w-px bg-[#494C4F]"></div>
              <div>{t.support}</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#494C4F]">{t.scrollDown}</span>
            <div className="h-12 w-px bg-[#494C4F]" />
          </div>
        </div>
      </section>

      {/* Popular Cities Section */}
      <section id="cities" className="py-24 lg:py-32 bg-[#1E2228]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Popular Cities</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Favorite Destinations</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Discover the best accommodations in Saudi Arabia's cities
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {popularCities.map((city) => (
              <Link
                key={city.id}
                href={city.href}
                className="flex flex-col items-center text-center group"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden mb-4">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback image if the primary image doesn't load
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                  />
                </div>
                <span className="font-medium text-[#EBEAE6]">{city.name}</span>
                <span className="text-xs text-[#494C4F] mt-1">{city.region}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Offers Section */}
      <section id="offers" className="py-24 lg:py-32 bg-[#1E2228]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Daily Deals</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Amazing Deals</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Discover the best deals available today
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {dailyOffers.map((offer) => (
              <div key={offer.id} className="bg-[#1E2228] rounded-2xl overflow-hidden border border-[#494C4F] shadow-lg">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback image if the primary image doesn't load
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-300 text-xs font-medium rounded-full mb-3">
                        <span>{offer.discountPercentage}% OFF</span>
                      </div>
                      <h3 className="font-serif text-xl font-medium text-[#EBEAE6]">{offer.title}</h3>
                      <p className="mt-2 text-sm text-[#494C4F]">{offer.description}</p>
                      <div className="flex items-center mt-3">
                        {renderStars(offer.rating)}
                        <span className="mx-2 text-[#494C4F]">•</span>
                        <span className="text-sm text-[#494C4F]">{offer.location}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-400 line-through">
                          SAR {offer.originalPrice}
                        </span>
                        <span className="text-xl font-bold text-[#EBEAE6]">
                          SAR {offer.discountedPrice}
                        </span>
                      </div>
                      <Button className="bg-amber-800 hover:bg-amber-700 text-[#1E2228]">Book Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-24 lg:py-32 bg-[#1E2228]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Packages</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">خطط <span className="text-amber-500">الإشتراك</span></h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              اختر الخطة التي تناسب احتياجاتك وابدأ في إدارة فندقك بكفاءة
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Basic Package */}
            <div className="bg-[#1E2228] rounded-2xl overflow-hidden border border-[#494C4F] shadow-lg">
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-2xl font-medium text-[#EBEAE6]">ال gói الأساسي</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#EBEAE6]">99</span>
                    <span className="text-[#494C4F]"> ر.س</span>
                    <div className="text-[#494C4F] text-sm">/ شهر</div>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">وصول إلى لوحة التحكم الأساسية</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">إدارة حتى 10 وحدات</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">تقارير شهرية محدودة</span>
                  </li>
                </ul>

                <div className="text-center">
                  <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-[#1E2228]">
                    <Link href="/packages/1">
                      <span>الإشتراك</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Professional Package */}
            <div className="bg-[#1E2228] rounded-2xl overflow-hidden border-2 border-amber-500 shadow-lg relative">
              <div className="bg-amber-500 text-white py-2 text-center">
                <span className="text-sm font-medium">الأكثر شعبية</span>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-2xl font-medium text-[#EBEAE6]">ال gói الاحترافي</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#EBEAE6]">199</span>
                    <span className="text-[#494C4F]"> ر.س</span>
                    <div className="text-[#494C4F] text-sm">/ شهر</div>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">وصول كامل إلى جميع الميزات</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">إدارة حتى 50 وحدة</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">تقارير متقدمة وتحليلات</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">دعم عبر البريد الإلكتروني والهاتف</span>
                  </li>
                </ul>

                <div className="text-center">
                  <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-[#1E2228]">
                    <Link href="/packages/2">
                      <span>الإشتراك</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Premium Package */}
            <div className="bg-[#1E2228] rounded-2xl overflow-hidden border border-[#494C4F] shadow-lg">
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-2xl font-medium text-[#EBEAE6]">ال gói الممتاز</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#EBEAE6]">299</span>
                    <span className="text-[#494C4F]"> ر.س</span>
                    <div className="text-[#494C4F] text-sm">/ شهر</div>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">كل ميزات gói الاحترافي</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">إدارة وحدات غير محدودة</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">تقارير مخصصة</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-[#EBEAE6]">دعم مخصص 24/7</span>
                  </li>
                </ul>

                <div className="text-center">
                  <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-[#1E2228]">
                    <Link href="/packages/3">
                      <span>الإشتراك</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Accommodations */}
      <section className="py-24 lg:py-32 bg-[#1E2228]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Featured Places</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Featured Places</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Best places we recommend for you
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <PublicUnitsDisplayClient />
          </div>
        </div>
      </section>

      {/* Self Check-in Section */}
      <section className="py-24 lg:py-32 bg-[#1E2228]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Self Check-in</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Self Check-in Places</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Convenient places with self check-in system
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {selfCheckInAccommodations.map((accommodation) => (
              <div key={accommodation.id} className="bg-[#1E2228] rounded-2xl overflow-hidden border border-[#494C4F]">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5">
                    <img
                      src={accommodation.image}
                      alt={accommodation.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback image if the primary image doesn't load
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-900/30 text-amber-300 text-xs font-medium rounded-full mb-3">
                        <Shield className="h-3 w-3 text-amber-400" />
                        <span>Self Check-in</span>
                      </div>
                      <h3 className="font-serif text-xl font-medium text-[#EBEAE6]">{accommodation.name}</h3>
                      <p className="mt-2 text-sm text-[#494C4F]">{accommodation.description}</p>
                      <div className="flex items-center mt-2">
                        {renderStars(accommodation.rating)}
                        <span className="mx-2 text-[#494C4F]">•</span>
                        <span className="text-sm text-[#494C4F]">{accommodation.location}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-[#EBEAE6]">
                          SAR {accommodation.price}
                        </span>
                        <span className="text-sm text-[#494C4F]"> /night</span>
                      </div>
                      <Button className="bg-amber-800 hover:bg-amber-700 text-[#1E2228]">Book Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Rentals */}
      <section id="monthly" className="py-24 lg:py-32 bg-[#1E2228]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Home className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Monthly Rentals</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Monthly Rentals</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Find your perfect place for monthly stays
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {monthlyRentals.map((rental) => (
              <div
                key={rental.id}
                className="border border-[#494C4F]/40 p-6 transition-all duration-300 hover:border-amber-700/50 rounded-xl bg-[#1E2228]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#494C4F] rounded-lg relative">
                  <img
                    src={rental.image}
                    alt={rental.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback image if the primary image doesn't load
                      (e.target as HTMLImageElement).src = '/placeholder.jpg';
                    }}
                  />
                  <button className="absolute top-4 right-4 p-2 rounded-full bg-[#494C4F]/80 hover:bg-[#494C4F]">
                    <Heart className="h-4 w-4 text-[#EBEAE6]" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif text-xl font-medium text-[#EBEAE6]">{rental.name}</h3>
                    <span className="text-lg font-bold text-[#EBEAE6]">
                      SAR {rental.monthlyPrice} <span className="text-sm text-[#494C4F]">/month</span>
                    </span>
                  </div>

                  <div className="flex items-center mt-2">
                    {renderStars(rental.rating)}
                    <span className="mx-2 text-[#494C4F]">•</span>
                    <span className="text-sm text-[#494C4F]">{rental.location}</span>
                  </div>

                  <p className="mt-4 text-sm text-[#494C4F] line-clamp-2">
                    {rental.description}
                  </p>

                  <Button variant="outline" className="w-full mt-6 border-amber-800/30 text-[#EBEAE6] hover:bg-[#494C4F]">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-24 lg:py-32 bg-[#1E2228]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Premium Amenities</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Premium Amenities</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              All the amenities you need for a perfect stay
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Wifi className="h-6 w-6" />, text: 'Free WiFi' },
              { icon: <Car className="h-6 w-6" />, text: 'Parking' },
              { icon: <ChefHat className="h-6 w-6" />, text: 'Fine Dining' },
              { icon: <Coffee className="h-6 w-6" />, text: 'Coffee Shop' },
              { icon: <Utensils className="h-6 w-6" />, text: 'Kitchen' },
              { icon: <Mountain className="h-6 w-6" />, text: 'Gym' },
              { icon: <Users className="h-6 w-6" />, text: 'Concierge' },
              { icon: <Building className="h-6 w-6" />, text: 'Business Center' },
            ].map((amenity, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="h-16 w-16 rounded-xl bg-[#494C4F]/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                  {amenity.icon}
                </div>
                <span className="mt-4 font-medium text-[#EBEAE6]">{amenity.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32 bg-[#1E2228]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Guest Reviews</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">What Our Guests Say</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Real experiences from our valued customers
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { name: 'Mohammed Al Saud', rating: 5, comment: 'Exceptional experience at the Ritz-Carlton Riyadh! The service was impeccable and the views of the Kingdom Tower were breathtaking.' },
              { name: 'Fatima Al Harbi', rating: 4, comment: 'Wonderful stay in Jeddah. The Fairmont location was perfect for exploring the historic district and Red Sea coastline.' },
              { name: 'Khalid Al Mubarak', rating: 5, comment: 'Perfect Hajj experience at the Marriott Makkah. The proximity to Haram and respectful staff made our pilgrimage memorable.' },
            ].map((review, index) => (
              <div key={index} className="p-6 border border-[#494C4F] rounded-xl bg-[#1E2228]">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <p className="mt-4 text-[#EBEAE6] italic">"{review.comment}"</p>
                <p className="mt-4 font-medium text-[#EBEAE6]">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 lg:py-32 bg-[#1E2228]/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="text-sm uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
              <Phone className="h-4 w-4 text-amber-400" />
              <span className="italic text-[#EBEAE6]">Contact Us</span>
            </span>
            <h2 className="mt-4 font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">Get In Touch</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F] italic">
              Have questions? We're here to help 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-[#EBEAE6] mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#494C4F]/30 flex items-center justify-center text-amber-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#EBEAE6]">Phone</h4>
                    <p className="text-[#494C4F]">+966 12 345 6789</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#494C4F]/30 flex items-center justify-center text-amber-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#EBEAE6]">Email</h4>
                    <p className="text-[#494C4F]">support@whelhost.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[#EBEAE6] mb-6">Send Us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#494C4F] mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#494C4F] mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#494C4F] mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-[#494C4F] rounded-lg bg-[#1E2228] text-[#EBEAE6] focus:outline-none focus:ring-2 focus:ring-amber-600"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <Button className="w-full bg-amber-800 hover:bg-amber-700 text-[#EBEAE6]">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
<footer className="relative overflow-hidden border-t border-[#494C4F]/20 bg-[#1E2228] py-20">
  {/* Decorative elements */}
  <div className="absolute -top-20 left-1/4 h-40 w-40 rounded-full bg-amber-600/5 blur-3xl" />
  <div className="absolute bottom-0 right-1/3 h-60 w-60 rounded-full bg-[#494C4F]/5 blur-3xl" />

  <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
    <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          <span className="font-serif text-xl font-medium text-[#EBEAE6]">WhelHost</span>
        </div>
        <p className="mt-2 text-sm text-[#494C4F] italic">Luxury hotel management, redefined.</p>
      </div>

      <nav className="flex flex-wrap justify-center gap-8">
        <Link
          href="/"
          className="text-sm text-[#494C4F] transition-colors hover:text-[#EBEAE6]"
        >
          About
        </Link>
        <Link
          href="/terms"
          className="text-sm text-[#494C4F] transition-colors hover:text-[#EBEAE6]"
        >
          Terms
        </Link>
        <Link
          href="/privacy"
          className="text-sm text-[#494C4F] transition-colors hover:text-[#EBEAE6]"
        >
          Privacy
        </Link>
      </nav>
    </div>

    <div className="mt-12 border-t border-[#494C4F]/40 pt-8 text-center">
      <div className="flex flex-col items-center">
        <div className="flex gap-6 mb-4">
          <Link href="#" className="text-[#494C4F] hover:text-[#EBEAE6]">
            <Globe className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-[#494C4F] hover:text-[#EBEAE6]">
            <span className="text-sm">Facebook</span>
          </Link>
          <Link href="#" className="text-[#494C4F] hover:text-[#EBEAE6]">
            <span className="text-sm">Twitter</span>
          </Link>
          <Link href="#" className="text-[#494C4F] hover:text-[#EBEAE6]">
            <span className="text-sm">Instagram</span>
          </Link>
        </div>
        <p className="text-sm text-[#494C4F] italic">© 2025 WhelHost. All rights reserved.</p>
      </div>
    </div>
  </div>
</footer>
    </div>
  )
}