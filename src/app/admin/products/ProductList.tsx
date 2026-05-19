"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  featured: boolean;
  category?: { id: string; name: string } | null;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定删除「${name}」？此操作不可撤销。`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>加载中...</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24" }}>商品管理</h2>
        <Link
          href="/admin/products/new"
          style={{ padding: "8px 20px", background: "#1a3a2a", color: "#fff", borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}
        >
          新建商品
        </Link>
      </div>

      {products.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无商品</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: isMobile ? "700px" : undefined }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", width: "60px" }}>图片</th>
              <th style={{ padding: "10px 8px" }}>名称</th>
              <th style={{ padding: "10px 8px", width: "100px" }}>价格</th>
              <th style={{ padding: "10px 8px", width: "80px" }}>库存</th>
              <th style={{ padding: "10px 8px", width: "100px" }}>分类</th>
              <th style={{ padding: "10px 8px", width: "140px" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "4px", overflow: "hidden", background: "#f0ebe0" }}>
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  {p.featured && <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "3px", marginLeft: "6px" }}>精选</span>}
                  <br /><span style={{ fontSize: "11px", color: "#aaa" }}>{p.slug}</span>
                </td>
                <td style={{ padding: "10px 8px", fontWeight: 600, color: "#1a3a2a" }}>¥{Number(p.price)}</td>
                <td style={{ padding: "10px 8px" }}>{p.stock}</td>
                <td style={{ padding: "10px 8px", color: "#888" }}>{p.category?.name || "—"}</td>
                <td style={{ padding: "10px 8px" }}>
                  <Link href={`/admin/products/${p.id}/edit`} style={{ fontSize: "12px", color: "#1a3a2a", marginRight: "12px", textDecoration: "none" }}>
                    编辑
                  </Link>
                  <button onClick={() => handleDelete(p.id, p.name)} style={{ fontSize: "12px", color: "#dc2626", border: "none", background: "none", cursor: "pointer" }}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
