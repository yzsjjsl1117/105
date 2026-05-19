"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBreakpoint } from "@/lib/useBreakpoint";

const navLinks = [
  { href: "#home", label: "首页" },
  { href: "#story", label: "品牌故事" },
  { href: "#craft", label: "制茶工艺" },
  { href: "#products", label: "茶叶系列" },
];

export default function Navbar() {
  const { isMobile } = useBreakpoint();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(246, 243, 238, 0.99)" : "rgba(246, 243, 238, 0.97)",
        borderBottom: scrolled ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: scrolled ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "8px 16px" : "8px 64px 8px 44px" }}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center" style={{ gap: 12 }}>
            <img
              src="/images/LOGO_transparent.png"
              alt="瀹岭"
              className="h-10 w-auto shrink-0"
            />
            <span className="font-serif-cn font-semibold text-[#1F2D24]" style={{ fontSize: isMobile ? "16px" : "20px" }}>
              瀹岭
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="nav-link transition-colors"
                style={{ fontSize: isMobile ? "13px" : "15px" }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden nav-link"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="菜单"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pb-2 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="block nav-link py-2 transition-colors"
                style={{ fontSize: isMobile ? "14px" : "15px" }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
