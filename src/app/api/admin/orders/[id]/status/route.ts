import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  paid: ["shipped", "completed"],
  shipped: ["completed"],
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const { id } = await params;
  const { status: newStatus } = await request.json();

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return NextResponse.json(
      { success: false, error: "INVALID_STATUS", message: `不能从「${order.status}」变为「${newStatus}」` },
      { status: 400 }
    );
  }

  await prisma.order.update({ where: { id }, data: { status: newStatus } });

  return NextResponse.json({ success: true, message: "状态已更新" });
}
