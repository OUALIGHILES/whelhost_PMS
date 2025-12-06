import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CheckoutPendingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const paymentId = searchParams.id ? String(searchParams.id) : "unknown";

  return (
    <div className="min-h-screen bg-[#1E2228] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-[#494C4F] bg-[#1E2228]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CreditCard className="h-16 w-16 text-amber-500 animate-pulse" />
                <Loader2 className="h-6 w-6 text-amber-500 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            <CardTitle className="text-[#EBEAE6] text-2xl">جاري معالجة الدفع...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-[#EBEAE6]/80">
              يُرجى الانتظار بينما نقوم بمعالجة عملية الدفع الخاصة بك. قد يستغرق ذلك بضع دقائق.
              {paymentId !== "unknown" && `<br />رقم العملية: ${paymentId}`}
            </p>
            
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            </div>
            
            <div className="space-y-3">
              <Link href="/dashboard" className="w-full block">
                <Button variant="outline" className="w-full border-amber-800/30 text-[#EBEAE6] hover:bg-[#494C4F]">
                  الذهاب إلى لوحة التحكم
                </Button>
              </Link>
              
              <Link href="/checkout" className="w-full block">
                <Button variant="outline" className="w-full border-[#494C4F] text-[#EBEAE6] hover:bg-[#494C4F]">
                  تحديث الحالة
                </Button>
              </Link>
            </div>

            <div className="text-center text-sm text-[#494C4F]">
              <p>Payment ID: {paymentId}</p>
              <p className="mt-2">سيتم تحديث الحالة تلقائيًا</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}