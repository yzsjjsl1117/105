import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AuthError = { error: NextResponse };
type AuthSuccess = { userId: string };

export async function requireAdmin(): Promise<AuthError | AuthSuccess> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return { error: NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export async function requireUser(): Promise<AuthError | AuthSuccess> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}
