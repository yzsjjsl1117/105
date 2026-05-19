import { NextRequest, NextResponse } from "next/server";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for NextAuth session cookie (name depends on cookie prefix settings)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;
  const isLoggedIn = !!sessionToken;

  // 已登录用户访问 auth 页面 → 重定向到 account
  if (isLoggedIn && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // 未登录用户访问 account 或 admin → 重定向到 login
  if (!isLoggedIn && (pathname.startsWith("/account") || pathname.startsWith("/admin"))) {
    const callbackUrl = encodeURIComponent(req.url);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/auth/:path*", "/admin/:path*"],
};
