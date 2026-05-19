import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { id: true, name: true, slug: true, images: true } } },
      },
      payments: true,
    },
  });

  if (!order) {
    return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: order });
}
