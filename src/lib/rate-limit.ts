import { prisma } from "./prisma";

interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  max: number;       // 窗口内最多请求次数
}

const defaults: Record<string, RateLimitConfig> = {
  register: { windowMs: 60000, max: 5 },         // 60秒内最多5次注册
  login: { windowMs: 60000, max: 10 },            // 60秒内最多10次登录
  "forgot-password": { windowMs: 60000, max: 3 }, // 60秒内最多3次
  "reset-password": { windowMs: 60000, max: 5 },  // 60秒内最多5次
  "change-password": { windowMs: 60000, max: 5 }, // 60秒内最多5次
};

export async function rateLimit(
  ip: string,
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const config = defaults[action];
  if (!config) return { allowed: true, remaining: -1 };

  const since = new Date(Date.now() - config.windowMs);

  // 清理过期记录
  await prisma.rateLimitRecord.deleteMany({
    where: { createdAt: { lt: since } },
  });

  // 统计窗口内请求数
  const count = await prisma.rateLimitRecord.count({
    where: {
      ip,
      action,
      createdAt: { gte: since },
    },
  });

  if (count >= config.max) {
    return { allowed: false, remaining: 0 };
  }

  // 记录本次请求
  await prisma.rateLimitRecord.create({
    data: { ip, action },
  });

  return { allowed: true, remaining: config.max - count - 1 };
}
