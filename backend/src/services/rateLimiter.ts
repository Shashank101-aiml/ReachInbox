import { redisConnection } from "@/queues/connection";
import { env } from "@/config/env";
const TRY_CONSUME_LUA = `
local keys = {KEYS[1], KEYS[2], KEYS[3]}
local limits = {tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])}
local ttl = tonumber(ARGV[4])

for i = 1, 3 do
  if keys[i] ~= '' and limits[i] > 0 then
    local count = tonumber(redis.call('GET', keys[i]) or '0')
    if count >= limits[i] then
      return 0
    end
  end
end

for i = 1, 3 do
  if keys[i] ~= '' and limits[i] > 0 then
    redis.call('INCR', keys[i])
    redis.call('EXPIRE', keys[i], ttl)
  end
end

return 1
`;

declare module "ioredis" {
  interface RedisCommander<Context> {
    tryConsumeEmailSlot(
      globalKey: string,
      senderKey: string,
      campaignKey: string,
      globalLimit: number,
      senderLimit: number,
      campaignLimit: number,
      ttlSeconds: number
    ): Promise<number>;
  }
}

redisConnection.defineCommand("tryConsumeEmailSlot", {
  numberOfKeys: 3,
  lua: TRY_CONSUME_LUA,
});

function hourBucket(at: Date): string {
  return (
    at.getUTCFullYear().toString() +
    String(at.getUTCMonth() + 1).padStart(2, "0") +
    String(at.getUTCDate()).padStart(2, "0") +
    String(at.getUTCHours()).padStart(2, "0")
  );
}

export function nextHourBoundary(at: Date): Date {
  const next = new Date(at);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

export interface RateLimitParams {
  senderId?: string;
  campaignId?: number;
  campaignHourlyLimit?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAt: Date;
}


export async function checkAndConsume(
  params: RateLimitParams,
  at: Date = new Date()
): Promise<RateLimitResult> {
  const bucket = hourBucket(at);
  const globalKey = `ratelimit:global:${bucket}`;
  const senderKey = params.senderId ? `ratelimit:sender:${params.senderId}:${bucket}` : "";
  const campaignKey =
    params.campaignId && params.campaignHourlyLimit
      ? `ratelimit:campaign:${params.campaignId}:${bucket}`
      : "";

  const ttlSeconds = 3700;

  const result = await redisConnection.tryConsumeEmailSlot(
    globalKey,
    senderKey,
    campaignKey,
    env.MAX_EMAILS_PER_HOUR,
    env.MAX_EMAILS_PER_HOUR_PER_SENDER,
    params.campaignHourlyLimit ?? 0,
    ttlSeconds
  );

  if (result === 1) {
    return { allowed: true, retryAt: at };
  }
  return { allowed: false, retryAt: nextHourBoundary(at) };
}
