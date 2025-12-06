import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PLANS, type PlanId, createPayment } from "@/lib/moyasar"
import Link from "next/link"
import { ArrowLeft, Shield, CreditCard, Smartphone, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string; package?: string; payment_method?: string }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams
  const planId = (params.plan || params.package) as PlanId | undefined
  const paymentMethod = params.payment_method || 'creditcard' // Default to credit card

  if (!planId || !PLANS[planId]) {
    redirect("/dashboard/upgrade")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

  const plan = PLANS[planId]
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/callback`

  // Payment methods available
  const paymentMethods = [
    {
      id: 'creditcard',
      name: 'البطاقة الائتمانية',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Visa, Mastercard, Mada'
    },
    {
      id: 'stcpay',
      name: 'STC Pay',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'STC Pay'
    },
  ]

  // Create Moyasar payment based on selected payment method
  let paymentUrl: string | null = null
  let paymentId: string | null = null

  try {
    // Create source object based on payment method
    let source: any
    if (paymentMethod === 'creditcard') {
      // For credit card redirect, we still need card details but we'll redirect to Moyasar
      source = { type: 'creditcard' }
    } else if (paymentMethod === 'stcpay') {
      // For STC Pay redirect
      source = { type: 'stcpay' }
    } else {
      // Default to credit card
      source = { type: 'creditcard' }
    }

    const paymentResponse = await createPayment({
      amount: plan.amount,
      currency: "SAR",
      source: source,
      description: `Payment for ${plan.name} subscription`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        user_email: profile?.email || user.email || "",
      },
      callback_url: callbackUrl,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/callback`,
    })

    paymentId = paymentResponse.id
    paymentUrl = paymentResponse.url || null

    // If payment URL is available, redirect user directly to Moyasar payment page
    if (paymentUrl) {
      redirect(paymentUrl)
    }
  } catch (error) {
    console.error("Error creating Moyasar payment:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-xl font-medium text-[#EBEAE6]">
            WhelHost
          </Link>
          <Link
            href="/dashboard/upgrade"
            className="flex items-center gap-2 text-sm text-[#494C4F] hover:text-[#EBEAE6]"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى الخطط
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Order Summary */}
          <div>
            <h1 className="font-serif text-3xl font-medium text-[#EBEAE6]">إكمال اشتراكك</h1>
            <p className="mt-2 text-[#494C4F]">أنت مشترك في WhelHost Premium</p>

            <div className="mt-8 border border-[#494C4F] bg-[#1E2228]/50 p-6">
              <h2 className="font-medium text-[#EBEAE6]">{plan.name}</h2>
              <p className="mt-1 text-sm text-[#494C4F]">{plan.description}</p>

              <div className="mt-6 border-t border-[#494C4F] pt-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-[#494C4F]">الاشتراك</span>
                  <span className="text-[#EBEAE6]">
                    {plan.displayPrice} ر.س/{plan.period}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-[#494C4F] pt-4">
                  <span className="font-medium text-[#EBEAE6]">المبلغ المستحق اليوم</span>
                  <span className="font-serif text-2xl font-medium text-[#EBEAE6]">{plan.displayPrice} ر.س</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-[#494C4F]">
              <Shield className="h-5 w-5" />
              <span>الدفع الآمن مدعوم من Moyasar. يتم تشفير بياناتك.</span>
            </div>

            <div className="mt-8">
              <h3 className="font-medium text-[#EBEAE6]">ما الذي يشمله:</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#494C4F]">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#EBEAE6]" />
                  إدارة الغرف والوحدات غير المحدودة
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#EBEAE6]" />
                  تقويم الحجز في الوقت الفعلي
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#EBEAE6]" />
                  التحليلات والتقارير المتقدمة
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#EBEAE6]" />
                  تكامل القفل الذكي
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#EBEAE6]" />
                  أدوات تواصل الضيوف
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-[#EBEAE6]" />
                  إنشاء الفواتير والمدفوعات
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <div className="border border-[#494C4F] bg-[#1E2228] p-8">
              <h2 className="font-serif text-xl font-medium text-[#EBEAE6]">طرق الدفع</h2>
              <p className="mt-1 text-sm text-[#494C4F]">
                اختر طريقة الدفع وسنوجهك إلى موقع Moyasar الآمن لإكمال عملية الدفع
              </p>

              <div className="mt-8 space-y-4">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant="outline"
                    className={`w-full h-16 rounded-none border-[#494C4F] justify-between ${
                      paymentMethod === method.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'hover:bg-[#494C4F]/30'
                    }`}
                    asChild
                  >
                    <Link
                      href={`/checkout?plan=${planId}&payment_method=${method.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-amber-500">{method.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-[#EBEAE6]">{method.name}</div>
                          <div className="text-xs text-[#494C4F]">{method.description}</div>
                        </div>
                      </div>
                      <span className="text-amber-500">→</span>
                    </Link>
                  </Button>
                ))}
              </div>

              <div className="mt-8 p-4 bg-amber-50/80 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800 flex items-center justify-between">
                  <span className="font-medium text-[#EBEAE6]">المبلغ:</span>
                  <span className="font-serif text-lg font-medium text-[#EBEAE6]">{plan.displayPrice} ر.س</span>
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-[#494C4F]">الدفع الآمن</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-[#494C4F]">محمي بواسطة Moyasar</span>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-[#494C4F]">
              بالاشتراك، فإنك توافق على{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-[#EBEAE6]">
                شروط الخدمة
              </Link>{" "}
              و{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-[#EBEAE6]">
                سياسة الخصوصية
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
