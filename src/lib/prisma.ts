import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // On Vercel, use Supavisor pooler (IPv4) instead of direct connection (IPv6)
  const isVercel = !!process.env.VERCEL;
  const connectionString = isVercel
    ? `postgresql://postgres.evlrzamowlommqscufjx:pdSjLrtXR6H3kbOm@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    : process.env.DATABASE_URL!;
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      ssl: { rejectUnauthorized: false },
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
