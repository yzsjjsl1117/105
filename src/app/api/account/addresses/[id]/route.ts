import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const existing = await prisma.shippingAddress.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: "NOT_FOUND", message: "地址不存在" },
      { status: 404 }
    );
  }

  if (isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.shippingAddress.update({
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

  return NextResponse.json({ success: true, data: address });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
}
