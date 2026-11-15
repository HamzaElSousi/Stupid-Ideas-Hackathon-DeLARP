import { Redis } from "@upstash/redis";

export type Platform = "linkedin" | "x" | "unknown";

export type Larper = {
  key: string;
  username: string;
  platform: Platform;
  larpScore: number; // highest score recorded
  offenses: number; // how many times they got caught
  lastVerdict: string;
  lastComment: string;
  firstCaught: string;
  lastCaught: string;
};

export type Stats = {
  scans: number;
  realTalks: number;
  larpsCaught: number;
  farts: number;
  auraDestroyed: number;
  byPlatform: Record<Platform, number>;
};

const LIST_KEY = "delarp:list";
const STATS_KEY = "delarp:stats";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// In-memory fallback (resets on cold start, fine for local dev)
const g = globalThis as unknown as {
  __delarpList?: Map<string, Larper>;
  __delarpStats?: Record<string, number>;
};
const memList = (g.__delarpList ??= new Map());
const memStats = (g.__delarpStats ??= {});

export const storageMode = redis ? "redis" : "memory";

export function larperKey(platform: Platform, username: string) {
  return `${platform}:${username.replace(/^@/, "").trim().toLowerCase()}`;
}

export async function incrStat(field: string, by = 1): Promise<number> {
  if (redis) return redis.hincrby(STATS_KEY, field, by);
  memStats[field] = (memStats[field] ?? 0) + by;
  return memStats[field];
}

export async function getStats(): Promise<Stats> {
  const raw: Record<string, unknown> = redis
    ? ((await redis.hgetall(STATS_KEY)) ?? {})
    : { ...memStats };
  const n = (k: string) => Number(raw[k] ?? 0);
  return {
    scans: n("scans"),
    realTalks: n("realTalks"),
    larpsCaught: n("larpsCaught"),
    farts: n("farts"),
    auraDestroyed: n("auraDestroyed"),
    byPlatform: {
      linkedin: n("platform:linkedin"),
      x: n("platform:x"),
      unknown: n("platform:unknown"),
    },
  };
}

export async function getLarper(key: string): Promise<Larper | null> {
  if (redis) return (await redis.hget<Larper>(LIST_KEY, key)) ?? null;
  return memList.get(key) ?? null;
}

export async function addLarper(input: {
  username: string;
  platform: Platform;
  larpScore: number;
  verdict: string;
  comment: string;
}): Promise<Larper> {
  const key = larperKey(input.platform, input.username);
  const now = new Date().toISOString();
  const existing = await getLarper(key);
  const larper: Larper = {
    key,
    username: input.username.replace(/^@/, "").trim(),
    platform: input.platform,
    larpScore: Math.max(existing?.larpScore ?? 0, input.larpScore),
    offenses: (existing?.offenses ?? 0) + 1,
    lastVerdict: input.verdict,
    lastComment: input.comment,
    firstCaught: existing?.firstCaught ?? now,
    lastCaught: now,
  };
  if (redis) await redis.hset(LIST_KEY, { [key]: larper });
  else memList.set(key, larper);
  if (!existing) await incrStat(`platform:${input.platform}`);
  return larper;
}

export async function getLarpList(): Promise<Larper[]> {
  let all: Larper[];
  if (redis) {
    const raw = (await redis.hgetall<Record<string, Larper>>(LIST_KEY)) ?? {};
    all = Object.values(raw);
  } else {
    all = [...memList.values()];
  }
  return all.sort(
    (a, b) => b.larpScore * b.offenses - a.larpScore * a.offenses || b.lastCaught.localeCompare(a.lastCaught)
  );
}
