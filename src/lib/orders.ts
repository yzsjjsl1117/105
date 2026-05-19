import { prisma } from "./prisma";

const EXPIRE_MINUTES = 30;

export async function cancelExpiredOrders(userId: string) {
  const expireTime = new Date(Date.now() - EXPIRE_MINUTES * 60 * 1000);

  const expiredOrders = await prisma.order.findMany({
    where: {
      userId,
      status: "pending_payment",
      createdAt: { lt: expireTime },
    },
    include: { items: true },
  });

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "expired" },
      });
      await tx.paymentRecord.updateMany({
        where: { orderId: order.id, status: "pending" },
        data: { status: "failed" },
      });
    });
  }
}
