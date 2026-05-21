import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

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
