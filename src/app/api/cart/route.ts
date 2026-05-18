import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const cartInclude = {
  product: {
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
  },
};

export async function GET() {
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

    // 游客购物车由客户端 localStorage 管理
    return NextResponse.json({ success: true, data: [] });
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

    if (!productId || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "无效的商品或数量" },
        { status: 400 }
      );
    }

    if (session?.user?.id) {
      await prisma.cartItem.upsert({
        where: { userId_productId: { userId: session.user.id, productId } },
        update: { quantity: { increment: quantity } },
        create: { userId: session.user.id, productId, quantity },
      });

      const items = await prisma.cartItem.findMany({
        where: { userId: session.user.id },
        include: cartInclude,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, data: items }, { status: 201 });
    }

    // 游客：返回结果让客户端存 localStorage
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
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true, message: "购物车已清空" });
  } catch (e) {
    console.error("Clear cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
