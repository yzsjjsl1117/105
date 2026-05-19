import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

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

    if (!order || order.userId !== session.user.id) {
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
