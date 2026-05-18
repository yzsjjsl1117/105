import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const addresses = await prisma.shippingAddress.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  return NextResponse.json({ success: true, data: addresses });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { name, phone, province, city, district, detail, isDefault } = body;

  if (!name || !phone || !province || !city || !district || !detail) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "请填写完整的地址信息" },
      { status: 400 }
    );
  }

  if (isDefault) {
    await prisma.shippingAddress.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.shippingAddress.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      phone: phone.trim(),
      province: province.trim(),
      city: city.trim(),
      district: district.trim(),
      detail: detail.trim(),
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json({ success: true, data: address }, { status: 201 });
}
