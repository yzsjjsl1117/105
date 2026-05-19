import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
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

  const cards = [
    { label: "今日订单", value: todayOrders, href: "/admin/orders" },
    { label: "待处理", value: pendingOrders, href: "/admin/orders?status=paid" },
    { label: "商品总数", value: totalProducts, href: "/admin/products" },
    { label: "近7日销售额", value: `¥${Number(recentSales._sum.total || 0)}`, href: "/admin/orders" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>概览</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{
              background: "#fff", borderRadius: "8px", padding: "20px",
              border: "1px solid #e5e7eb", textDecoration: "none",
            }}
          >
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 8px" }}>{card.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#1a3a2a", margin: 0 }}>{card.value}</p>
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <Link href="/admin/products/new" style={{
          padding: "10px 24px", background: "#1a3a2a", color: "#fff",
          borderRadius: "6px", fontSize: "14px", textDecoration: "none",
        }}>
          新建商品
        </Link>
        <Link href="/admin/orders" style={{
          padding: "10px 24px", background: "#fff", color: "#1a3a2a",
          border: "1px solid #1a3a2a", borderRadius: "6px",
          fontSize: "14px", textDecoration: "none",
        }}>
          查看所有订单
        </Link>
      </div>
    </div>
  );
}
