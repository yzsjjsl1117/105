import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { validatePassword, validatePasswordMatch } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(ip, "change-password");
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "RATE_LIMITED", message: "请求过于频繁，请稍后重试" },
        { status: 429 }
      );
    }

    const authed = await requireUser();
    if ("error" in authed) return authed.error;

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", message: "请输入当前密码" },
        { status: 400 }
      );
    }

    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.success) {
      return NextResponse.json(pwCheck, { status: 400 });
    }

    const matchCheck = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchCheck.success) {
      return NextResponse.json(matchCheck, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: authed.userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "用户不存在" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "WRONG_PASSWORD", message: "当前密码错误" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: authed.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: "密码修改成功" });
  } catch (e) {
    console.error("Change password error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
