"use client";

import { CartProvider } from "@/context/CartContext";
import ShopNavbar from "./ShopNavbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ShopNavbar />
      {children}
    </CartProvider>
  );
}
