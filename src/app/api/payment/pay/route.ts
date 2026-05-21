import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const body = await request.json();
    const { orderId, method } = body as { orderId: string; method: string };

    if (!orderId || !method) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "缺少订单号或支付方式" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "订单不存在" },
        { status: 404 }
      );
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { success: false, error: "ORDER_NOT_PAYABLE", message: "订单无法支付" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "paid",
          paymentMethod: method,
        },
      });

      await tx.paymentRecord.updateMany({
        where: { orderId, status: "pending" },
        data: {
          status: "completed",
          method,
        },
      });
    });

    return NextResponse.json({ success: true, message: "支付成功" });
  } catch (e) {
    console.error("Payment error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
