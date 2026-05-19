import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import type { Metadata } from "next";
import ShopLayout from "@/components/ShopLayout";
import AddToCart from "@/components/AddToCart";

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface Brewing {
  water: string;
  ratio: string;
  time: string;
  times: string;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const features = (product.features as unknown as Feature[]) || [];
  const brewing = (product.brewing as unknown as Brewing) || {};

  return (
    <ShopLayout>
      <div style={{ background: "#FDF8F0", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "96px 24px 48px" }}>

          {/* 首屏：左右分栏 */}
          <div style={{ display: "flex", gap: "48px", marginBottom: "80px", flexWrap: "wrap" }}>
            {/* 左：产品大图 */}
            <div style={{ flex: "1 1 400px", minWidth: "300px" }}>
              <div style={{
                aspectRatio: "1", borderRadius: "12px", overflow: "hidden",
                background: "linear-gradient(135deg, rgba(139,105,20,0.08) 0%, rgba(26,58,42,0.04) 100%)",
                padding: "24px 24px 0 24px",
              }}>
                <img
                  src={product.images[0] || "/images/产品图.png"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                />
              </div>
            </div>

            {/* 右：产品信息 */}
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "12px" }}>
              <p style={{ fontSize: "12px", color: "#8B6914", letterSpacing: "3px", textTransform: "uppercase", margin: 0, fontFamily: "var(--font-serif-en)" }}>
                {product.englishName}
              </p>
              <h1 style={{ fontSize: "40px", fontWeight: 700, color: "#1a3a2a", margin: 0, fontFamily: "var(--font-serif-cn)" }}>
                {product.name}
              </h1>
              <p style={{ fontSize: "16px", color: "#5C3D2E", margin: 0 }}>{product.subtitle}</p>

              <div style={{ width: "40px", height: "1px", background: "#C4953A", margin: "8px 0" }} />

              <p style={{ fontSize: "36px", fontWeight: 700, color: "#1a3a2a", margin: 0 }}>¥{Number(product.price).toFixed(0)}</p>
              <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>{product.specs}</p>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.8, margin: "8px 0" }}>{product.description}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                <AddToCart productId={product.id} />
                <Link
                  href="/cart"
                  style={{
                    display: "inline-block", padding: "10px 24px", fontSize: "14px", fontWeight: 600,
                    background: "#fff", color: "#1a3a2a", border: "1px solid #1a3a2a",
                    borderRadius: "6px", textAlign: "center", textDecoration: "none",
                  }}
                >
                  查看购物车
                </Link>
              </div>
            </div>
          </div>

          {/* 产品特性：纵向四张大图 */}
          {features.length > 0 && (
            <div style={{ marginBottom: "80px" }}>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1a3a2a", margin: 0, fontFamily: "var(--font-serif-cn)" }}>
                  产品特性
                </h2>
                <div style={{ width: "40px", height: "1px", background: "#C4953A", margin: "10px auto 0" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {features.map((feature, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "21/9",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #f5efe0, #ede0cc)",
                      display: "flex", alignItems: "flex-end",
                      padding: "20px",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "18px", fontWeight: 700, color: "#1a3a2a", margin: "0 0 4px", fontFamily: "var(--font-serif-cn)" }}>
                        {feature.title}
                      </p>
                      <p style={{ fontSize: "14px", color: "#6B7F5E", margin: 0 }}>{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 冲泡方法：一张大图 */}
          {brewing.water && (
            <div style={{ marginBottom: "80px" }}>
              <div style={{
                aspectRatio: "21/9", borderRadius: "10px", overflow: "hidden",
                background: "linear-gradient(135deg, #efe8d8, #e0d5c0, #d5c8a8)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "48px 24px",
              }}>
                <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1a3a2a", margin: "0 0 16px", fontFamily: "var(--font-serif-cn)" }}>
                  冲泡方法
                </h2>
                <div style={{ width: "40px", height: "1px", background: "#C4953A", marginBottom: "20px" }} />
                <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center", fontSize: "14px", color: "#555" }}>
                  <span>水温：<b style={{color:"#1a3a2a"}}>{brewing.water}</b></span>
                  <span>茶水比：<b style={{color:"#1a3a2a"}}>{brewing.ratio}</b></span>
                  <span>时间：<b style={{color:"#1a3a2a"}}>{brewing.time}</b></span>
                  <span>次数：<b style={{color:"#1a3a2a"}}>{brewing.times}</b></span>
                </div>
              </div>
            </div>
          )}

          {/* 储存方法：一张大图 */}
          {product.storage && (
            <div style={{ marginBottom: "80px" }}>
              <div style={{
                aspectRatio: "21/9", borderRadius: "10px", overflow: "hidden",
                background: "linear-gradient(135deg, #ece4d4, #dcd0b8, #d0c4a8)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "48px 24px",
              }}>
                <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1a3a2a", margin: "0 0 16px", fontFamily: "var(--font-serif-cn)" }}>
                  储存方法
                </h2>
                <div style={{ width: "40px", height: "1px", background: "#C4953A", marginBottom: "20px" }} />
                <p style={{ fontSize: "15px", color: "#555", textAlign: "center", maxWidth: "400px", lineHeight: 1.8 }}>
                  {product.storage}
                </p>
              </div>
            </div>
          )}

          {/* 返回链接 */}
          <div style={{ textAlign: "center" }}>
            <Link href="/#products" style={{
              fontSize: "14px", color: "#8B6914", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}>
              <span>←</span> 返回茶叶系列
            </Link>
          </div>

        </div>
      </div>
    </ShopLayout>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "产品未找到" };
  return {
    title: `${product.name} - 瀹岭`,
    description: product.description,
  };
}
