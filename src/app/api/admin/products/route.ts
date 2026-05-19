import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const { name, subtitle, englishName, slug, description, price, stock, categoryId, images, featured, specs, features, brewing, storage } = body;

  if (!name || !slug || price === undefined || price === null) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", message: "名称、slug 和价格不能为空" },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "SLUG_TAKEN", message: "该 slug 已被使用" },
      { status: 409 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      subtitle: subtitle || "",
      englishName: englishName || "",
      description: description || "",
      price,
      stock: stock || 0,
      categoryId: categoryId || null,
      images: images || [],
      featured: featured || false,
      specs: specs || "",
      features: features || [],
      brewing: brewing || {},
      storage: storage || "",
    },
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
