"use client";

import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string;
}

// Static data placeholder — will be replaced with DB query in Phase 2 seed
const products: Product[] = [
  { id: "1", name: "黄山毛峰", slug: "huangshan-maofeng", price: "¥298", image: "/images/huangshan-maofeng.png" },
  { id: "2", name: "太平猴魁", slug: "taiping-houkui", price: "¥398", image: "/images/taiping-houkui.png" },
  { id: "3", name: "祁门红茶", slug: "qimen-hongcha", price: "¥268", image: "/images/qimen-black-tea.png" },
];

export default function ProductShowcase() {
  return (
    <section id="products" className="min-h-screen flex items-center px-6"
      style={{ background: "linear-gradient(to bottom, #F6F2EB 0%, #EEE7DC 100%)", paddingTop: 80, paddingBottom: 80 }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
        <div className="mb-12">
          <p className="font-serif-en" style={{ fontSize: 11, letterSpacing: 6, color: "#B7ADA1", marginBottom: 8 }}>
            TEA COLLECTION
          </p>
          <h2 className="font-serif-cn" style={{ fontSize: 28, fontWeight: 500, color: "#1F2D24" }}>
            茶叶系列
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48, alignItems: "start" }}>
          {products.map((product, i) => {
            const offsets = [
              { marginTop: 20 },
              { marginTop: -30 },
              { marginTop: 20 },
            ];
            const off = offsets[i];
            return (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                style={{ marginTop: off.marginTop, display: "block", transition: "transform 0.5s ease" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-8px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div className="mb-4 overflow-hidden" style={{ width: i === 1 ? "75%" : "65%", margin: "0 auto" }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ transition: "transform 0.5s ease", width: "100%" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  />
                </div>
                <div className="text-center" style={{ marginTop: i === 1 ? 70 : i === 0 ? 24 : 48 }}>
                  <div className="flex items-center gap-6 justify-center">
                    <div className="text-xl font-semibold" style={{ color: "#8A6A42" }}>{product.price}</div>
                    <span className="text-sm" style={{ color: "#8A6A42", transition: "letter-spacing 0.3s ease" }}
                      onMouseEnter={(e) => e.currentTarget.style.letterSpacing = "2px"}
                      onMouseLeave={(e) => e.currentTarget.style.letterSpacing = "0px"}
                    >
                      品鉴此茶 →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
