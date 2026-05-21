import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order || order.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "订单不存在" },
        { status: 404 }
      );
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { success: false, error: "ORDER_NOT_CANCELLABLE", message: "当前订单状态不允许取消" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Rollback stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Update order status
      await tx.order.update({
        where: { id },
        data: { status: "cancelled" },
      });

      // Update payment record
      await tx.paymentRecord.updateMany({
        where: { orderId: id, status: "pending" },
        data: { status: "failed" },
      });
    });

    return NextResponse.json({ success: true, message: "订单已取消" });
  } catch (e) {
    console.error("Cancel order error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
