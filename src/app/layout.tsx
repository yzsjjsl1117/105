import type { Metadata } from "next";
import { Noto_Serif_SC, Playfair_Display } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-serif-cn",
});

const playfairDisplay = Playfair_Display({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-serif-en",
});

export const metadata: Metadata = {
  title: "瀹岭 — 云雾之间的馈赠",
  description: "瀹岭高山绿茶，源自黄山云雾深处，百年制茶传承。品质茶礼，一叶知匠心。",
  openGraph: {
    title: "瀹岭 — 云雾之间的馈赠",
    description: "瀹岭高山绿茶，源自黄山云雾深处，百年制茶传承。",
    type: "website",
    locale: "zh_CN",
    siteName: "瀹岭",
  },
  twitter: {
    card: "summary_large_image",
    title: "瀹岭 — 云雾之间的馈赠",
    description: "瀹岭高山绿茶，源自黄山云雾深处，百年制茶传承。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth" className={`${notoSerifSC.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
