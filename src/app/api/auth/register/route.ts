import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { validateRegisterInput } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await rateLimit(ip, "register");
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "RATE_LIMITED", message: "请求过于频繁，请稍后重试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password, confirmPassword, phone } = body;

    const validation = validateRegisterInput({ name, email, password, confirmPassword, phone });
    if (!validation.success) {
      return NextResponse.json(validation, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        passwordHash,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json(
      { success: true, data: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "EMAIL_TAKEN", message: "该邮箱已被注册" },
        { status: 409 }
      );
    }
    console.error("Register error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}
