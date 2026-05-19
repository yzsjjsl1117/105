import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "NOT_FOUND", message: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, subtitle, englishName, slug, description, price, stock, categoryId, images, featured, specs, features, brewing, storage } = body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "NOT_FOUND", message: "商品不存在" }, { status: 404 });
  }

  if (slug && slug !== existing.slug) {
    const slugConflict = await prisma.product.findUnique({ where: { slug } });
    if (slugConflict) {
      return NextResponse.json(
        { success: false, error: "SLUG_TAKEN", message: "该 slug 已被使用" },
        { status: 409 }
      );
    }
  }

  const product = await prisma.product.update({
    where: { id },
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

  return NextResponse.json({ success: true, data: product });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "商品已删除" });
}
