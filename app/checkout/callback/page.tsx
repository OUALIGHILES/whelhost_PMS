// This page handles payment gateway callbacks and should be dynamically rendered
// This is a Server Component that handles the checkout callback
import { redirect } from "next/navigation";

// Export to ensure this page is treated as dynamic and not prebuilt
export const dynamic = 'force-dynamic';

export default function CheckoutCallbackPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Extract payment parameters from search params
  const paymentId = searchParams.id ? String(searchParams.id) : undefined;
  const paymentStatus = searchParams.status ? String(searchParams.status) : undefined;
  const amount = searchParams.amount ? String(searchParams.amount) : undefined;
  const currency = searchParams.currency || "SAR";
  const orderId = searchParams.order_id ? String(searchParams.order_id) : undefined;
  
  // Handle the payment callback based on the parameters
  if (paymentStatus === "success" || paymentStatus === "completed") {
    // Payment was successful - redirect to success page
    redirect(`/checkout/success?id=${paymentId}&amount=${amount}&order_id=${orderId}`);
  } else if (paymentStatus === "failed" || paymentStatus === "error") {
    // Payment failed - redirect to failure page
    redirect(`/checkout/failed?id=${paymentId}&order_id=${orderId}`);
  } else {
    // If no clear status, redirect to a processing page
    redirect(`/checkout/pending?id=${paymentId}`);
  }
}