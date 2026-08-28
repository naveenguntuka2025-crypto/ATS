import IORedis from "ioredis";

// Shared Redis connection for BullMQ. BullMQ requires maxRetriesPerRequest:
// null on the connection it's given (its own internal retry/backoff logic
// otherwise conflicts with ioredis's).
export function createRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
}
