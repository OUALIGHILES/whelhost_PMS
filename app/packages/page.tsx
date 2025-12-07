"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { 
  Globe, 
  ArrowRight, 
  ShoppingCart, 
  User, 
  LogOut, 
  Home, 
  Menu,
  Sparkles
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { useAuth } from '@/components/auth-provider';
import { createClient } from '@/lib/supabase/client';

export default function PackagesPage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('rtl');

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
    return 'ar'; // default language for packages page
  };

  useEffect(() => {
    const initialLang = getInitialLanguage();
    setLanguage(initialLang as 'en' | 'ar');
    setDir(initialLang === 'ar' ? 'rtl' : 'ltr');
  }, []);

  // Function to toggle language
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    setDir(newLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('language', newLang);
  };

  // Navigation menu items in both languages
  const navigation = {
    en: [
      { name: 'Home', href: '/' },
      { name: 'Popular Cities', href: '/' },
      { name: 'Deals', href: '/' },
      { name: 'Packages', href: '/packages' },
      { name: 'Monthly Rentals', href: '/' },
      { name: 'Contact', href: '/' },
    ],
    ar: [
      { name: 'الرئيسية', href: '/' },
      { name: 'المدن الشهيرة', href: '/' },
      { name: 'العروض', href: '/' },
      { name: 'الباقات', href: '/packages' },
      { name: 'الإيجارات الشهرية', href: '/' },
      { name: 'اتصل بنا', href: '/' },
    ]
  };

  // Content based on language
  const content = {
    en: {
      pageTitle: 'Subscription Plans',
      pageSubtitle: 'Choose the plan that suits your needs and start managing your hotel efficiently',
      popular: 'Most Popular',
      subscribe: 'Subscribe',
      basicPackage: 'Basic Package',
      professionalPackage: 'Professional Package',
      premiumPackage: 'Premium Package',
      features: {
        basic: [
          'Access to basic dashboard',
          'Manage up to 10 units',
          'Limited monthly reports',
          'Email support',
          'Regular updates'
        ],
        professional: [
          'Full access to all features',
          'Manage up to 50 units',
          'Advanced reports and analytics',
          'Email and phone support',
          'Regular updates',
          'UI customization'
        ],
        premium: [
          'All Professional features',
          'Unlimited unit management',
          'Custom reports',
          'Dedicated 24/7 support',
          'Third-party integrations',
          'Custom reporting and deep analytics'
        ]
      },
      whyChoose: 'Why Choose Our Platform?',
      security: 'High Security',
      performance: 'Super Performance',
      support: 'Custom Support',
      securityDesc: 'Integrated system for data protection and privacy',
      performanceDesc: 'Fast and stable system for excellent user experience',
      supportDesc: 'Support team available to answer your inquiries',
      priceUnit: 'SAR',
      period: 'month'
    },
    ar: {
      pageTitle: 'خطط الإشتراك',
      pageSubtitle: 'اختر الخطة التي تناسب احتياجاتك وابدأ في إدارة فندقك بكفاءة',
      popular: 'الأكثر شعبية',
      subscribe: 'الإشتراك',
      basicPackage: 'ال gói الأساسي',
      professionalPackage: 'ال gói الاحترافي',
      premiumPackage: 'ال gói الممتاز',
      features: {
        basic: [
          'وصول إلى لوحة التحكم الأساسية',
          'إدارة حتى 10 وحدات',
          'تقارير شهرية محدودة',
          'دعم عبر البريد الإلكتروني',
          'تحديثات منتظمة'
        ],
        professional: [
          'وصول كامل إلى جميع الميزات',
          'إدارة حتى 50 وحدة',
          'تقارير متقدمة وتحليلات',
          'دعم عبر البريد الإلكتروني والهاتف',
          'تحديثات منتظمة',
          'تخصيص واجهة المستخدم'
        ],
        premium: [
          'كل ميزات gói الاحترافي',
          'إدارة وحدات غير محدودة',
          'تقارير مخصصة',
          'دعم مخصص 24/7',
          'تكامل مع أنظمة طرف ثالث',
          'تقرير مخصص وتحليلات عميقة'
        ]
      },
      whyChoose: 'لماذا تختار منصتنا؟',
      security: 'أمان عالي',
      performance: 'أداء فائق',
      support: 'دعم مخصص',
      securityDesc: 'نظام مدمج لحماية البيانات والخصوصية',
      performanceDesc: 'نظام سريع ومستقر لتجربة استخدام ممتازة',
      supportDesc: 'فريق دعم متوفر للإجابة عن استفساراتك',
      priceUnit: 'ر.س',
      period: 'شهر'
    }
  };

  const t = content[language]; // t stands for translation

  const packages = [
    {
      id: 1,
      name: language === 'ar' ? t.basicPackage : t.basicPackage.replace('ال gói ', ''),
      price: 99,
      period: t.period,
      features: t.features.basic,
      popular: false
    },
    {
      id: 2,
      name: language === 'ar' ? t.professionalPackage : t.professionalPackage.replace('ال gói ', ''),
      price: 199,
      period: t.period,
      features: t.features.professional,
      popular: true
    },
    {
      id: 3,
      name: language === 'ar' ? t.premiumPackage : t.premiumPackage.replace('ال gói ', ''),
      price: 299,
      period: t.period,
      features: t.features.premium,
      popular: false
    }
  ];

  // Get navigation based on current language
  const currentNavigation = navigation[language];

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
              aria-label={language === 'ar' ? 'تبديل اللغة' : 'Switch Language'}
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
                            alt={userProfile?.full_name || (language === 'ar' ? 'الملف الشخصي' : 'Profile')}
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
                  {language === 'ar' ? 'تبديل اللغة' : 'Switch Language'}
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

      {/* Main content with padding for fixed header */}
      <div className="pt-20">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">
              {t.pageTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[#494C4F]">
              {t.pageSubtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`rounded-2xl overflow-hidden border border-[#494C4F] ${
                  pkg.popular
                    ? 'ring-2 ring-amber-500 relative bg-[#1E2228]/90'
                    : 'bg-[#1E2228]/70'
                }`}
              >
                {pkg.popular && (
                  <div className="bg-amber-500 text-white text-center py-2">
                    <span className="text-sm font-medium">{t.popular}</span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-[#EBEAE6] text-2xl">{pkg.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#EBEAE6]">{pkg.price}</span>
                    <span className="text-[#494C4F]"> {t.priceUnit}</span>
                    <div className="text-[#494C4F] text-sm">/ {pkg.period}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-[#EBEAE6]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                  <Button
                    asChild
                    className={`${
                      pkg.popular
                        ? 'bg-amber-500 hover:bg-amber-600 text-[#1E2228] px-8'
                        : 'bg-[#494C4F] hover:bg-[#5a5e62] text-[#EBEAE6] px-8'
                    }`}
                  >
                    <Link href={`/checkout?plan=${pkg.id}`}>
                      <span>{t.subscribe}</span>
                      <ArrowRight
                        className="w-4 h-4 mr-2"
                      />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-[#EBEAE6] mb-6">{t.whyChoose}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-[#1E2228]/50 p-6 rounded-xl border border-[#494C4F]">
                <div className="text-amber-500 text-3xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-[#EBEAE6] mb-2">{t.security}</h3>
                <p className="text-[#494C4F]">{t.securityDesc}</p>
              </div>
              <div className="bg-[#1E2228]/50 p-6 rounded-xl border border-[#494C4F]">
                <div className="text-amber-500 text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-[#EBEAE6] mb-2">{t.performance}</h3>
                <p className="text-[#494C4F]">{t.performanceDesc}</p>
              </div>
              <div className="bg-[#1E2228]/50 p-6 rounded-xl border border-[#494C4F]">
                <div className="text-amber-500 text-3xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-[#EBEAE6] mb-2">{t.support}</h3>
                <p className="text-[#494C4F]">{t.supportDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}