import ShopLayout from "@/components/ShopLayout";
import PaymentContent from "../PaymentContent";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <ShopLayout>
      <PaymentContent orderId={orderId} />
    </ShopLayout>
  );
}
