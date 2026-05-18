import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { productId: string; quantity: number }[] = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
    });

    const data = items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return { id: `guest-${item.productId}`, productId: item.productId, quantity: item.quantity, product };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("Resolve cart error:", e);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "服务器错误" },
      { status: 500 }
    );
  }
}
