import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePassword, validatePasswordMatch } from "@/lib/validations";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "请先登录" },
      { status: 401 }
    );
  }

  const { currentPassword, newPassword, confirmPassword } = await request.json();

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.success) {
    return NextResponse.json(pwCheck, { status: 400 });
  }

  const matchCheck = validatePasswordMatch(newPassword, confirmPassword);
  if (!matchCheck.success) {
    return NextResponse.json(matchCheck, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "用户不存在" },
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
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true, message: "密码修改成功" });
}
