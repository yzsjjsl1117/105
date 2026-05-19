import { prisma } from "@/lib/prisma";
import ProductForm from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return <p style={{ textAlign: "center", color: "#888", padding: "60px 0" }}>商品不存在</p>;
  }

  return <ProductForm product={{ ...product, price: Number(product.price) }} />;
}
