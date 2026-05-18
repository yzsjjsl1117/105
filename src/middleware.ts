import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 已登录用户访问 auth 页面 → 重定向到 account
  if (isLoggedIn && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // 未登录用户访问 account → 重定向到 login
  if (!isLoggedIn && pathname.startsWith("/account")) {
    const callbackUrl = encodeURIComponent(req.url);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/auth/:path*"],
};
