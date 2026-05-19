"use client";

import { useBreakpoint } from "@/lib/useBreakpoint";

export default function Footer() {
  const { isMobile } = useBreakpoint();
  return (
    <footer style={{ background: "#111827", color: "#9CA3AF", padding: isMobile ? "16px 12px 12px 12px" : "20px 24px 16px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* 上半部分 */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? 16 : 400, padding: "10px 0", borderBottom: "1px solid #1F2937" }}>
          {/* 社交媒体 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="#" style={{ width: 32, height: 32, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} title="微信">
              <svg style={{ width: 16, height: 16, color: "#fff" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3.5 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM9 4c-4.4 0-8 3.1-8 7 0 2.1.9 4 2.5 5.4-.3 1.2-1 2.6-1 2.6 0 0 2.1-.3 3.4-1.1 1 .4 2 .6 3.1.6 4.4 0 8-3.1 8-7s-3.6-7-8-7z"/>
              </svg>
            </a>
            <a href="#" style={{ width: 32, height: 32, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} title="抖音">
              <svg style={{ width: 16, height: 16, color: "#fff" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 8.5v7.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5c.3 0 .5 0 .8.1V11c-.3 0-.5-.1-.8-.1-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V9.5c.9.6 2 1 3.2 1V9c-1.7 0-3.2-1.3-3.2-3h-1.5c0 1.2.5 2.3 1.3 3.1z"/>
              </svg>
            </a>
            <a href="#" style={{ width: 32, height: 32, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} title="微博">
              <svg style={{ width: 16, height: 16, color: "#fff" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 17c-3.3 0-6-2-6-4.5 0-1.4.7-2.7 2-3.7-.2-.5-.3-1-.3-1.5 0-2.2 2-4 4.5-4 1.5 0 2.8.7 3.6 1.7 1.5.2 2.7 1.5 2.7 3 0 .5-.1 1-.3 1.4 1.2 1 2 2.3 2 3.8 0 2.5-2.7 4.5-6 4.5zm0-1.5c2.5 0 4.5-1.3 4.5-3s-2-3-4.5-3-4.5 1.3-4.5 3 2 3 4.5 3z"/>
              </svg>
            </a>
          </div>

          {/* 导航 + 电话 */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 12 : 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isMobile ? 12 : 14 }}>
              <a href="#" style={{ color: "#9CA3AF", padding: "4px 12px", transition: "color 0.2s" }}>建议反馈</a>
              <span style={{ color: "#4B5563" }}>|</span>
              <a href="#" style={{ color: "#9CA3AF", padding: "4px 12px", transition: "color 0.2s" }}>联系我们</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg style={{ width: 20, height: 20, color: "#B8863B" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span style={{ color: "#B8863B", fontSize: 18, fontWeight: 600 }}>400-000-0000</span>
            </div>
          </div>
        </div>

        {/* 下半部分 */}
        <div style={{ padding: "8px 0", textAlign: "center", fontSize: isMobile ? 10 : 12, color: "#6B7280" }}>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: isMobile ? 4 : 16 }}>
            <span>版权所有© 瀹岭茶业有限公司</span>
            <span style={{ color: "#374151" }}>|</span>
            <a href="#" style={{ color: "#6B7280", transition: "color 0.2s" }}>皖ICP备2024086742号-1</a>
            <span style={{ color: "#374151" }}>|</span>
            <a href="#" style={{ color: "#6B7280", transition: "color 0.2s", display: "flex", alignItems: "center", gap: 4 }}>
              <svg style={{ width: 12, height: 12 }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v2H9V5zm0 4h2v6H9V9z"/>
              </svg>
              <span>皖公网安备34102402000156号</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
