import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PackagesPage() {
  const packages = [
    {
      id: 1,
      name: 'ال gói الأساسي',
      price: 99,
      period: 'شهر',
      features: [
        'وصول إلى لوحة التحكم الأساسية',
        'إدارة حتى 10 وحدات',
        'تقارير شهرية محدودة',
        'دعم عبر البريد الإلكتروني',
        'تحديثات منتظمة'
      ],
      popular: false
    },
    {
      id: 2,
      name: 'ال gói الاحترافي',
      price: 199,
      period: 'شهر',
      features: [
        'وصول كامل إلى جميع الميزات',
        'إدارة حتى 50 وحدة',
        'تقارير متقدمة وتحليلات',
        'دعم عبر البريد الإلكتروني والهاتف',
        'تحديثات منتظمة',
        'تخصيص واجهة المستخدم'
      ],
      popular: true
    },
    {
      id: 3,
      name: 'ال gói الممتاز',
      price: 299,
      period: 'شهر',
      features: [
        'كل ميزات gói الاحترافي',
        'إدارة وحدات غير محدودة',
        'تقارير مخصصة',
        'دعم مخصص 24/7',
        'تكامل مع أنظمة طرف ثالث',
        'تقرير مخصص وتحليلات عميقة'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#1E2228]">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl font-medium tracking-tight lg:text-5xl text-[#EBEAE6]">
            خطط <span className="text-amber-500">الإشتراك</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[#494C4F]">
            اختر الخطة التي تناسب احتياجاتك وابدأ في إدارة فندقك بكفاءة
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
                  <span className="text-sm font-medium">الأكثر شعبية</span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-[#EBEAE6] text-2xl">{pkg.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#EBEAE6]">{pkg.price}</span>
                  <span className="text-[#494C4F]"> ر.س</span>
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
                    <span>الإشتراك</span>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-[#EBEAE6] mb-6">لماذا تختار منصتنا؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#1E2228]/50 p-6 rounded-xl border border-[#494C4F]">
              <div className="text-amber-500 text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-[#EBEAE6] mb-2">أمان عالي</h3>
              <p className="text-[#494C4F]">نظام مدمج لحماية البيانات والخصوصية</p>
            </div>
            <div className="bg-[#1E2228]/50 p-6 rounded-xl border border-[#494C4F]">
              <div className="text-amber-500 text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-[#EBEAE6] mb-2">أداء فائق</h3>
              <p className="text-[#494C4F]">نظام سريع ومستقر لتجربة استخدام ممتازة</p>
            </div>
            <div className="bg-[#1E2228]/50 p-6 rounded-xl border border-[#494C4F]">
              <div className="text-amber-500 text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-[#EBEAE6] mb-2">دعم مخصص</h3>
              <p className="text-[#494C4F]">فريق دعم متوفر للإجابة عن استفساراتك</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}