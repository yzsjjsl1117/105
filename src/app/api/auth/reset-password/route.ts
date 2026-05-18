import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateResetPasswordInput } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN", message: "重置链接无效" },
        { status: 400 }
      );
    }

    const validation = validateResetPasswordInput({ password, confirmPassword });
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) {
        await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      }
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN", message: "重置链接已过期或无效" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    ]);

    return NextResponse.json({ success: true, message: "密码已重置，请登录" });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
