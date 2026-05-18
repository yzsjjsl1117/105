import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, phone, province, city, district, detail, isDefault } = body;

    if (!name?.trim() || !phone?.trim() || !province?.trim() || !city?.trim() || !district?.trim() || !detail?.trim()) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "请填写完整的地址信息" },
        { status: 400 }
      );
    }

    const existing = await prisma.shippingAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "地址不存在" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.shippingAddress.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      await tx.shippingAddress.update({
        where: { id },
        data: {
          name: name.trim(),
          phone: phone.trim(),
          province: province.trim(),
          city: city.trim(),
          district: district.trim(),
          detail: detail.trim(),
          isDefault,
        },
      });
    });

    const address = await prisma.shippingAddress.findUnique({ where: { id } });

    return NextResponse.json({ success: true, data: address });
  } catch (e) {
    console.error("Update address error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "请先登录" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.shippingAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "地址不存在" },
        { status: 404 }
      );
    }

    await prisma.shippingAddress.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "地址已删除" });
  } catch (e) {
    console.error("Delete address error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
