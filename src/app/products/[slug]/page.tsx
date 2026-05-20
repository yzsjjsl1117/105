import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getAllProducts } from "@/lib/products";
import type { Metadata } from "next";
import ShopLayout from "@/components/ShopLayout";
import AddToCart from "@/components/AddToCart";
import BuyNowButton from "@/components/BuyNowButton";
import styles from "@/components/ProductDetail.module.css";

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

const promoImages: Record<string, string[]> = {
  "huangshan-maofeng": [
    "/images/huangshan-maofeng-origin.png",
    "/images/huangshan-maofeng-appearance.png",
    "/images/huangshan-maofeng-aroma.png",
    "/images/huangshan-maofeng-liquor.png",
    "/images/huangshan-maofeng-brewing.png",
  ],
};

const imageCaptions = [
  { en: "ORIGIN", cn: "产地环境", desc: "高山云雾出好茶" },
  { en: "APPEARANCE", cn: "外形特征", desc: "芽叶肥壮 白毫显露" },
  { en: "AROMA", cn: "香气特点", desc: "兰香幽远 山韵悠长" },
  { en: "LIQUOR & TASTE", cn: "汤色滋味", desc: "鲜爽甘润 韵味悠长" },
  { en: "BREWING GUIDE", cn: "冲泡方法", desc: "循茶之性 泡一盏山水清香" },
];

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
  const images = promoImages[product.slug];
  const featureImages = images?.slice(0, 4);
  const brewingImage = images?.[4];

  const allProducts = await getAllProducts();
  const otherProducts = allProducts.filter((p) => p.id !== product.id);

  return (
    <ShopLayout>
      {/* 商品区：背景 #f6f2ea */}
      <div className={styles["product-area"]} style={{ background: "#f6f2ea", position: "relative" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 24px 100px" }}>

          {/* 首屏：左右分栏 */}
          <div style={{ display: "flex", gap: "36px", flexWrap: "wrap" }}>
            {/* 左：产品大图 */}
            <div style={{ flex: "1 1 400px", minWidth: "300px", position: "relative", zIndex: 1 }}>
              <div style={{
                aspectRatio: "1", borderRadius: "12px", overflow: "hidden",
                background: "#f6f2ea",
                padding: "24px 24px 0 24px",
              }}>
                <img
                  src={product.images[0] || "/images/product-placeholder.png"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px 8px 0 0" }}
                />
              </div>
            </div>

            {/* 右：产品信息 */}
            <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "12px", position: "relative", zIndex: 1 }}>
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
                <BuyNowButton productId={product.id} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 海报区：背景 #f8f6f1 */}
      <div className={styles["poster-area"]} style={{ background: "#f8f6f1", position: "relative" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 24px 48px", position: "relative", zIndex: 1 }}>

          {/* 产品特性：纵向四张海报 */}
          {featureImages ? (
            <div style={{ marginBottom: "100px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "100px" }}>
                {featureImages.map((src, i) => (
                  <div key={i} className={styles["poster-section"]}>
                    <div className={styles["poster-wrap"]}>
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                      <p style={{
                        fontSize: "14px", color: "#C4953A", letterSpacing: "8px",
                        margin: "0 0 8px", fontFamily: "var(--font-serif-en)",
                      }}>
                        {imageCaptions[i].en}
                      </p>
                      <p style={{
                        fontSize: "48px", fontWeight: 500, color: "#1a3a2a",
                        margin: "0 0 6px", fontFamily: "var(--font-serif-cn)",
                      }}>
                        {imageCaptions[i].cn}
                      </p>
                      <p style={{ fontSize: "18px", color: "#8b867c", margin: 0 }}>
                        {imageCaptions[i].desc}
                      </p>
                    </div>
                    <div style={{
                      borderRadius: "28px", overflow: "hidden",
                      maxWidth: "750px", margin: "0 auto",
                      boxShadow: "0 20px 60px rgba(0,0,0,.06)",
                    }}>
                      <img
                        src={src}
                        alt={`${imageCaptions[i].cn}`}
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : features.length > 0 ? (
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
          ) : null}

          {/* 冲泡方法 */}
          {brewingImage ? (
            <div style={{ marginBottom: "100px" }} className={styles["poster-section"]}>
              <div className={styles["poster-wrap"]}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p style={{
                  fontSize: "14px", color: "#C4953A", letterSpacing: "8px",
                  margin: "0 0 8px", fontFamily: "var(--font-serif-en)",
                }}>
                  {imageCaptions[4].en}
                </p>
                <p style={{
                  fontSize: "48px", fontWeight: 500, color: "#1a3a2a",
                  margin: "0 0 6px", fontFamily: "var(--font-serif-cn)",
                }}>
                  {imageCaptions[4].cn}
                </p>
                <p style={{ fontSize: "18px", color: "#8b867c", margin: 0 }}>
                  {imageCaptions[4].desc}
                </p>
              </div>
              <div style={{
                borderRadius: "28px", overflow: "hidden",
                maxWidth: "750px", margin: "0 auto",
                boxShadow: "0 20px 60px rgba(0,0,0,.06)",
              }}>
                <img
                  src={brewingImage}
                  alt="冲泡方法"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              </div>
            </div>
          ) : brewing.water ? (
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
          ) : null}


          {/* 其他产品 */}
          {otherProducts.length > 0 && (
            <div style={{ marginBottom: "48px" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#1a3a2a", margin: 0, fontFamily: "var(--font-serif-cn)" }}>
                  其他产品
                </h2>
                <div style={{ width: "40px", height: "1px", background: "#C4953A", margin: "8px auto 0" }} />
              </div>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px", maxWidth: "750px", margin: "0 auto",
              }}>
                {otherProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className={styles["other-product-card"]}
                    style={{
                      textDecoration: "none", background: "#fff",
                      borderRadius: "10px", overflow: "hidden",
                      border: "1px solid rgba(26,58,42,0.08)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <div style={{
                      aspectRatio: "1", overflow: "hidden",
                      background: "linear-gradient(135deg, rgba(139,105,20,0.06), rgba(26,58,42,0.03))",
                      padding: "20px 20px 0 20px",
                    }}>
                      <img
                        src={p.images[0] || "/images/product-placeholder.png"}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px 6px 0 0" }}
                      />
                    </div>
                    <div style={{ padding: "16px 20px 20px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1a3a2a", margin: "0 0 4px", fontFamily: "var(--font-serif-cn)" }}>
                        {p.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px" }}>{p.subtitle}</p>
                      <p style={{ fontSize: "18px", fontWeight: 700, color: "#1a3a2a", margin: 0 }}>¥{Number(p.price).toFixed(0)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 返回链接 */}
          <div style={{ textAlign: "center" }}>
            <Link href="/" style={{
              fontSize: "14px", color: "#8B6914", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}>
              <span>←</span> 返回首页
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
