import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const validation = validateEmail(email);
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim() } });

    // 无论用户是否存在都返回成功，避免邮箱探测
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "如果该邮箱已注册，重置链接已发送",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1小时

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: 接入邮件服务发送重置链接
    // 当前阶段，token 记录在数据库，可通过 Prisma Studio 查看
    console.log(`Password reset link: http://localhost:105/auth/reset-password?token=${token}`);

    return NextResponse.json({
      success: true,
      message: "如果该邮箱已注册，重置链接已发送",
    });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
