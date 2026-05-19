import { prisma } from "./prisma";

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { featured: true },
    orderBy: { createdAt: "desc" },
  });
}
