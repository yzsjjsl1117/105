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
    const { addressId, items } = body as {
      addressId: string;
      items: { productId: string; quantity: number }[];
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
    if (!address || address.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "地址不存在" },
        { status: 404 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate stock & calculate total
      let total = 0;
      const productUpdates: { id: string; price: number; quantity: number }[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`OUT_OF_STOCK:产品「${item.productId}」不存在`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`OUT_OF_STOCK:产品「${product.name}」库存不足，仅剩 ${product.stock} 件`);
        }
        total += Number(product.price) * item.quantity;
        productUpdates.push({ id: product.id, price: Number(product.price), quantity: item.quantity });
      }

      // 2. Decrement stock
      for (const pu of productUpdates) {
        await tx.product.update({
          where: { id: pu.id },
          data: { stock: { decrement: pu.quantity } },
        });
      }

      // 3. Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total,
          items: {
            create: productUpdates.map((pu) => ({
              productId: pu.id,
              quantity: pu.quantity,
              price: pu.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, images: true } },
            },
          },
        },
      });

      // 4. Clear cart items that were ordered
      const productIds = items.map((i) => i.productId);
      await tx.cartItem.deleteMany({
        where: { userId: session.user.id, productId: { in: productIds } },
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
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
