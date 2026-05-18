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
    const guestItems: { productId: string; quantity: number }[] = body.items || [];

    for (const item of guestItems) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1) continue;
      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: session.user.id, productId: item.productId } },
      });
      await prisma.cartItem.upsert({
        where: { userId_productId: { userId: session.user.id, productId: item.productId } },
        update: { quantity: existing ? Math.max(existing.quantity, item.quantity) : item.quantity },
        create: { userId: session.user.id, productId: item.productId, quantity: item.quantity },
      });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    console.error("Merge cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
