import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { validateEmail } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { passwordResetTemplate } from "@/lib/email-templates";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(ip, "forgot-password");
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "RATE_LIMITED", message: "请求过于频繁，请稍后重试" },
        { status: 429 }
      );
    }

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

    // 删除该用户旧的重置令牌，避免多token并存
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:105";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "重置您的瀹岭账号密码",
      html: passwordResetTemplate(resetUrl),
    });

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
