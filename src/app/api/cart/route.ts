import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const cartInclude = {
  product: {
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (session?.user?.id) {
      const items = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: cartInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: items });
    }

    // Guest: read items from body, return full product info
    const body = await request.json().catch(() => ({}));
    const guestItems: { productId: string; quantity: number }[] = body.items || [];
    if (guestItems.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const productIds = guestItems.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
    });

    const data = guestItems.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return { id: `guest-${item.productId}`, productId: item.productId, quantity: item.quantity, product };
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("Get cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "无效的商品或数量" },
        { status: 400 }
      );
    }

    if (session?.user?.id) {
      const existing = await prisma.cartItem.findFirst({
        where: { userId: session.user.id, productId },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: { userId: session.user.id, productId, quantity },
        });
      }

      const items = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: cartInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: items }, { status: 201 });
    }

    // Guest: return result for client to save to localStorage
    return NextResponse.json({
      success: true,
      data: { productId, quantity },
    });
  } catch (e) {
    console.error("Add to cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    }
    return NextResponse.json({ success: true, message: "购物车已清空" });
  } catch (e) {
    console.error("Clear cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
