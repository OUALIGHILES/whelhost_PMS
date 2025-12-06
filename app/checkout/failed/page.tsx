import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const paymentId = searchParams.id ? String(searchParams.id) : "unknown";
  const orderId = searchParams.order_id ? String(searchParams.order_id) : "unknown";

  return (
    <div className="min-h-screen bg-[#1E2228] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-[#494C4F] bg-[#1E2228]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-[#EBEAE6] text-2xl">فشلت عملية الدفع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-[#EBEAE6]/80">
              فشلت عملية الدفع، يرجى المحاولة مرة أخرى.
              {orderId !== "unknown" && `<br />رقم الطلب: ${orderId}`}
              {paymentId !== "unknown" && `<br />رقم العملية: ${paymentId}`}
            </p>
            
            <div className="space-y-3">
              <Link href="/checkout" className="w-full block">
                <Button variant="outline" className="w-full border-red-700/30 text-red-600 hover:bg-[#494C4F]">
                  إعادة محاولة الدفع
                </Button>
              </Link>
              
              <Link href="/dashboard" className="w-full block">
                <Button variant="outline" className="w-full border-[#494C4F] text-[#EBEAE6] hover:bg-[#494C4F]">
                  العودة إلى لوحة التحكم
                </Button>
              </Link>
            </div>

            <div className="text-center text-sm text-[#494C4F]">
              <p>Payment ID: {paymentId}</p>
              <p className="mt-2">يرجى الاتصال بالدعم إذا استمرت المشكلة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}