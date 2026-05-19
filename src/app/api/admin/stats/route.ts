import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [todayOrders, pendingOrders, totalProducts, recentSales] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ["pending_payment", "paid"] } } }),
    prisma.product.count(),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ["paid", "shipped", "completed"] },
      },
      _sum: { total: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      todayOrders,
      pendingOrders,
      totalProducts,
      recentSales: Number(recentSales._sum.total || 0),
    },
  });
}
