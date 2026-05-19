"use client";

import { useBreakpoint } from "@/lib/useBreakpoint";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isMobile } = useBreakpoint();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: isMobile ? "16px" : "24px" }}>
      {children}
    </div>
  );
}
