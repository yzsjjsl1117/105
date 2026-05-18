-- CreateTable
CREATE TABLE "RateLimitRecord" (
    "id" UUID NOT NULL,
    "ip" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitRecord_ip_action_createdAt_idx" ON "RateLimitRecord"("ip", "action", "createdAt");
