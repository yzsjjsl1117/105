"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";

interface Category {
  id: string;
  name: string;
}

interface ProductData {
  name: string;
  subtitle: string;
  englishName: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images: string[];
  featured: boolean;
  specs: string;
  features: string;
  brewing: string;
  storage: string;
}

interface Props {
  product?: {
    id: string;
    name: string;
    subtitle: string;
    englishName: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string | null;
    images: string[];
    featured: boolean;
    specs: string;
    features: unknown;
    brewing: unknown;
    storage: string;
  } | null;
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState<ProductData>({
    name: product?.name || "",
    subtitle: product?.subtitle || "",
    englishName: product?.englishName || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product ? Number(product.price) : 0,
    stock: product?.stock || 0,
    categoryId: product?.categoryId || "",
    images: product?.images || [],
    featured: product?.featured || false,
    specs: product?.specs || "",
    features: product ? JSON.stringify(product.features, null, 2) : "[]",
    brewing: product ? JSON.stringify(product.brewing, null, 2) : "{}",
    storage: product?.storage || "",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const cats: Category[] = [];
          const seen = new Set<string>();
          d.data.forEach((p: { category?: { id: string; name: string } | null }) => {
            if (p.category && !seen.has(p.category.id)) {
              seen.add(p.category.id);
              cats.push(p.category);
            }
          });
          setCategories(cats);
        }
      });
  }, []);

  function update<K extends keyof ProductData>(key: K, value: ProductData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Auto-generate slug from name (only in create mode)
  function handleNameChange(name: string) {
    update("name", name);
    if (!isEdit) {
      update("slug", name.replace(/\s+/g, "-").toLowerCase());
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let features, brewing;
    try {
      features = JSON.parse(form.features);
      brewing = JSON.parse(form.brewing);
    } catch {
      setError("features 或 brewing 不是有效的 JSON 格式");
      setLoading(false);
      return;
    }

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        features,
        brewing,
        price: Number(form.price),
        stock: Number(form.stock),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError(data.message);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#1F2D24", marginBottom: "24px" }}>
        {isEdit ? "编辑商品" : "新建商品"}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
        <div>
          <label style={labelStyle}>商品图片</label>
          <ImageUpload images={form.images} onChange={(urls) => update("images", urls)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>名称 *</label>
            <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Slug *</label>
            <input value={form.slug} onChange={(e) => update("slug", e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>副标题</label>
            <input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>英文名</label>
            <input value={form.englishName} onChange={(e) => update("englishName", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>价格 *</label>
            <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", Number(e.target.value))} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>库存</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => update("stock", Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>描述</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>分类</label>
            <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} style={inputStyle}>
              <option value="">无分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>规格</label>
            <input value={form.specs} onChange={(e) => update("specs", e.target.value)} style={inputStyle} placeholder="如：250g / 500g" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>产品特点 (JSON 数组)</label>
          <textarea value={form.features} onChange={(e) => update("features", e.target.value)} rows={4}
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px", resize: "vertical" }}
            placeholder='["高山茶园", "手工采摘"]' />
        </div>

        <div>
          <label style={labelStyle}>冲泡参数 (JSON 对象)</label>
          <textarea value={form.brewing} onChange={(e) => update("brewing", e.target.value)} rows={4}
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: "12px", resize: "vertical" }}
            placeholder='{"waterTemp": "85°C", "steepTime": "3分钟"}' />
        </div>

        <div>
          <label style={labelStyle}>储存建议</label>
          <input value={form.storage} onChange={(e) => update("storage", e.target.value)} style={inputStyle} placeholder="阴凉干燥处密封保存" />
        </div>

        <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
          首页精选展示
        </label>

        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}

        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={loading} style={submitBtnStyle(loading)}>
            {loading ? "保存中..." : isEdit ? "保存修改" : "创建商品"}
          </button>
          <button type="button" onClick={() => router.back()} style={cancelBtnStyle}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", fontSize: "13px",
  border: "1px solid #d1d5db", borderRadius: "6px", outline: "none",
  boxSizing: "border-box",
};

const submitBtnStyle = (loading: boolean): React.CSSProperties => ({
  padding: "10px 28px", background: "#1a3a2a", color: "#fff", border: "none",
  borderRadius: "6px", fontSize: "14px", fontWeight: 600,
  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
});

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 28px", background: "#fff", color: "#888", border: "1px solid #d1d5db",
  borderRadius: "6px", fontSize: "14px", cursor: "pointer",
};
