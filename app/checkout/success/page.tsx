import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const paymentId = searchParams.id ? String(searchParams.id) : "unknown";
  const amount = searchParams.amount ? String(searchParams.amount) : "unknown";
  const orderId = searchParams.order_id ? String(searchParams.order_id) : "unknown";

  return (
    <div className="min-h-screen bg-[#1E2228] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-[#494C4F] bg-[#1E2228]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-[#EBEAE6] text-2xl">الدفع ناجح!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-[#EBEAE6]/80">
              تم الدفع بنجاح! 
              <br />
              {amount !== "unknown" && `المبلغ: ${amount} SAR`}
              {orderId !== "unknown" && `<br />رقم الطلب: ${orderId}`}
              {paymentId !== "unknown" && `<br />رقم العملية: ${paymentId}`}
            </p>
            
            <div className="space-y-3">
              <Link href="/dashboard" className="w-full block">
                <Button variant="outline" className="w-full border-amber-800/30 text-[#EBEAE6] hover:bg-[#494C4F]">
                  الذهاب إلى لوحة التحكم
                </Button>
              </Link>
              
              <Link href="/profile" className="w-full block">
                <Button variant="outline" className="w-full border-[#494C4F] text-[#EBEAE6] hover:bg-[#494C4F]">
                  عرض الملف الشخصي
                </Button>
              </Link>
            </div>

            <div className="text-center text-sm text-[#494C4F]">
              <p>Payment ID: {paymentId}</p>
              <p className="mt-2">مدعوم من Moyasar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}