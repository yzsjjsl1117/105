import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { validateName, validatePhone } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    console.error("Get profile error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    if ("error" in user) return user.error;

    const body = await request.json();

    const { name, phone } = body;

    const nameCheck = validateName(name || "");
    if (!nameCheck.success) {
      return NextResponse.json(nameCheck, { status: 400 });
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.success) {
      return NextResponse.json(phoneCheck, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { name: name.trim(), phone: phone?.trim() || null },
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    console.error("Update profile error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
