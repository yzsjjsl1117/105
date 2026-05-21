import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cancelExpiredOrders } from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const body = await request.json();
    const { addressId, items, paymentMethod } = body as {
      addressId: string;
      items: { productId: string; quantity: number }[];
      paymentMethod?: string;
    };

    if (!addressId) {
      return NextResponse.json(
        { success: false, error: "ADDRESS_REQUIRED", message: "请选择收货地址" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "购物车为空" },
        { status: 400 }
      );
    }

    // Verify address ownership
    const address = await prisma.shippingAddress.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "地址不存在" },
        { status: 404 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItems: { productId: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stock: true },
          });
          if (!product) {
            throw new Error(`OUT_OF_STOCK:产品「${item.productId}」不存在`);
          }
          throw new Error(`OUT_OF_STOCK:产品「${product.name}」库存不足，仅剩 ${product.stock} 件`);
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { price: true },
        });
        const price = Number(product!.price);
        total += price * item.quantity;
        orderItems.push({ productId: item.productId, quantity: item.quantity, price });
      }

      const newOrder = await tx.order.create({
        data: {
          userId: user.userId,
          total,
          status: "pending_payment",
          paymentMethod: paymentMethod || "",
          items: { create: orderItems },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, images: true } },
            },
          },
        },
      });

      await tx.paymentRecord.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod || "",
          amount: total,
          status: "pending",
        },
      });

      const productIds = items.map((i) => i.productId);
      await tx.cartItem.deleteMany({
        where: { userId: user.userId, productId: { in: productIds } },
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (e) {
    console.error("Create order error:", e);
    if (e instanceof Error && e.message.startsWith("OUT_OF_STOCK:")) {
      return NextResponse.json(
        { success: false, error: "OUT_OF_STOCK", message: e.message.replace("OUT_OF_STOCK:", "") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    await cancelExpiredOrders(user.userId);

    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (e) {
    console.error("Get orders error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
