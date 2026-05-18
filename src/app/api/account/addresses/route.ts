import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
  } catch (e) {
    console.error("Get addresses error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

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
    const { name, phone, province, city, district, detail, isDefault } = body;

    if (!name?.trim() || !phone?.trim() || !province?.trim() || !city?.trim() || !district?.trim() || !detail?.trim()) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "请填写完整的地址信息" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.shippingAddress.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      await tx.shippingAddress.create({
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
    });

    const address = await prisma.shippingAddress.findFirst({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ success: true, data: address }, { status: 201 });
  } catch (e) {
    console.error("Create address error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
