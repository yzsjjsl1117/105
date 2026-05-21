import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const { id } = await params;
    const { quantity } = await request.json();

    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "无效的数量" },
        { status: 400 }
      );
    }

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "购物车项不存在" },
        { status: 404 }
      );
    }
    await prisma.cartItem.update({ where: { id }, data: { quantity } });

    return NextResponse.json({ success: true, data: { id, quantity } });
  } catch (e) {
    console.error("Update cart item error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const { id } = await params;

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item || item.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "购物车项不存在" },
        { status: 404 }
      );
    }
    await prisma.cartItem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "已删除" });
  } catch (e) {
    console.error("Delete cart item error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
