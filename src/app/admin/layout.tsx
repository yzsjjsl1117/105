import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminNavbar from "@/components/AdminNavbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#1a3a2a", marginBottom: "8px" }}>403</h1>
          <p style={{ fontSize: "16px", color: "#888" }}>无权访问后台管理</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <AdminNavbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        {children}
      </div>
    </div>
  );
}
