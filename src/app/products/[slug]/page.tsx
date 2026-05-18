import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

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

const iconSvgs: Record<string, string> = {
  leaf: '<svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  flower: '<svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  droplet: '<svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
  mountain: '<svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
};

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
    <>
      <Navbar />
      <div className="pt-24 pb-16 px-6" style={{ background: "#F8F7F4" }}>
      <div className="max-w-7xl mx-auto">
        {/* 产品主体 */}
        <div className="grid md:grid-cols-2 gap-16 mb-20">
          {/* 左：图片 */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(45,80,22,0.1) 0%, rgba(45,80,22,0.05) 100%)",
                padding: "20px 20px 0 20px",
              }}
            >
              <img
                src={product.images[0] || "/images/产品图.png"}
                alt={product.name}
                className="w-full h-full object-cover rounded-t-2xl transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* 右：信息 */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-3 font-serif-en tracking-wider uppercase">
                {product.englishName}
              </p>
              <h1 className="text-5xl md:text-6xl font-serif-cn font-bold text-gray-900 mb-3">
                {product.name}
              </h1>
              <p className="text-xl text-green-700 font-medium">{product.subtitle}</p>
            </div>

            <div className="h-0.5 my-8 bg-gradient-to-r from-transparent via-green-800 to-transparent" />

            <div className="mb-8">
              <p className="relative inline-block text-6xl font-bold text-green-800 mb-6">
                ¥{Number(product.price).toFixed(0)}
                <span className="absolute bottom-0 left-0 w-full h-2 bg-green-800/10 -z-10" />
              </p>
              <p className="text-gray-600">{product.specs}</p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-10 text-lg">{product.description}</p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="relative overflow-hidden bg-gradient-to-r from-green-900 to-green-800 text-white px-10 py-4 rounded-full text-lg font-medium cursor-pointer flex-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-900/40">
                立即购买
              </button>
              <button className="bg-white/70 backdrop-blur-xl border border-green-800/10 text-green-800 px-10 py-4 rounded-full text-lg font-medium cursor-pointer hover:bg-green-800 hover:text-white transition-all flex-1">
                加入购物车
              </button>
            </div>
          </div>
        </div>

        {/* 产品特性 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif-cn font-bold text-gray-900 mb-4">产品特性</h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-green-800 to-transparent mx-auto" />
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-lg border border-green-800/10 rounded-2xl p-8 transition-all duration-400 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-900/15 hover:border-green-800/30"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-900 to-green-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-900/10 to-green-800/5 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-green-900 group-hover:to-green-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="group-hover:text-white transition-colors" dangerouslySetInnerHTML={{ __html: iconSvgs[feature.icon] || iconSvgs.leaf }} />
                </div>
                <h3 className="text-xl font-serif-cn font-semibold text-gray-900 mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 冲泡方法 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif-cn font-bold text-gray-900 mb-4">冲泡方法</h2>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-green-800 to-transparent mx-auto" />
          </div>
          <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl p-10 shadow-xl">
            <div className="grid md:grid-cols-2 gap-10">
              {[
                { num: 1, title: "水温选择", value: brewing.water },
                { num: 2, title: "茶水比例", value: brewing.ratio },
                { num: 3, title: "冲泡时间", value: brewing.time },
                { num: 4, title: "冲泡次数", value: brewing.times },
              ].map((step) => (
                <div key={step.num} className="relative pl-16 hover:translate-x-2 transition-transform duration-300">
                  <div className="absolute left-0 top-0 w-12 h-12 bg-gradient-to-br from-green-900 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg shadow-green-900/30">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-serif-cn font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-700 text-lg">{step.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 储存方法 */}
        <div className="bg-white/70 backdrop-blur-xl border-l-4 border-green-800 rounded-3xl p-10 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-10 h-10 text-green-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-serif-cn font-bold text-gray-900 mb-3">储存方法</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{product.storage}</p>
            </div>
          </div>
        </div>

        {/* 返回链接 */}
        <div className="mt-12 text-center">
          <Link href="/#products" className="inline-flex items-center gap-2 text-green-800 hover:text-green-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回茶叶系列</span>
          </Link>
        </div>
      </div>
    </div>
    </>
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
