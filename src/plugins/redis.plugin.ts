import fp from "fastify-plugin";
import Redis from "ioredis";
import type { FastifyInstance } from "fastify";
import { env } from "@/config/env.config";

export interface CacheAdapter {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttlSeconds?: number): Promise<void>;
	/** Get and parse as JSON; returns null if missing or invalid. */
	getJson<T>(key: string): Promise<T | null>;
	/** Set value as JSON string. */
	setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
	del(key: string): Promise<void>;
	delByPattern(pattern: string): Promise<void>;
}

declare module "fastify" {
	interface FastifyInstance {
		cache: CacheAdapter;
		redis: Redis | null;
	}
}

function jsonHelpers<T extends { get: CacheAdapter["get"]; set: CacheAdapter["set"] }>(base: T): T & Pick<CacheAdapter, "getJson" | "setJson"> {
	return {
		...base,
		async getJson<R>(key: string): Promise<R | null> {
			const raw = await base.get(key);
			if (raw == null) return null;
			try {
				return JSON.parse(raw) as R;
			} catch {
				return null;
			}
		},
		async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
			await base.set(key, JSON.stringify(value), ttlSeconds);
		},
	};
}

/** In-memory fallback when REDIS_URL is not set (e.g. local dev without Redis). */
function createMemoryCache(): CacheAdapter {
	const store = new Map<string, { value: string; expiresAt?: number }>();
	const base = {
		async get(key: string): Promise<string | null> {
			const entry = store.get(key);
			if (!entry) return null;
			if (entry.expiresAt && Date.now() > entry.expiresAt) {
				store.delete(key);
				return null;
			}
			return entry.value;
		},
		async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
			const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
			store.set(key, { value, expiresAt });
		},
		async del(key: string): Promise<void> {
			store.delete(key);
		},
		async delByPattern(_pattern: string): Promise<void> {
			const prefix = _pattern.replace(/\*$/, "");
			for (const k of store.keys()) {
				if (prefix === "" || k.startsWith(prefix)) store.delete(k);
			}
		},
	};
	return jsonHelpers(base) as CacheAdapter;
}

/** Redis-backed cache adapter. */
function createRedisCache(redis: Redis): CacheAdapter {
	const base = {
		async get(key: string): Promise<string | null> {
			return redis.get(key);
		},
		async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
			if (ttlSeconds != null) {
				await redis.setex(key, ttlSeconds, value);
			} else {
				await redis.set(key, value);
			}
		},
		async del(key: string): Promise<void> {
			await redis.del(key);
		},
		async delByPattern(pattern: string): Promise<void> {
			const keys = await redis.keys(pattern);
			if (keys.length > 0) await redis.del(...keys);
		},
	};
	return jsonHelpers(base) as CacheAdapter;
}

async function redisPlugin(app: FastifyInstance) {
	const url = env.REDIS_URL?.trim() || "";

	if (!url) {
		app.decorate("cache", createMemoryCache());
		app.decorate("redis", null);
		app.log.info("📦 Cache: using in-memory store (REDIS_URL not set)");
		return;
	}

	const redis = new Redis(url, {
		maxRetriesPerRequest: 3,
		retryStrategy(times) {
			const delay = Math.min(times * 100, 3000);
			return delay;
		},
	});

	redis.on("error", (err) => {
		app.log.warn({ err }, "Redis connection error");
	});
	redis.on("connect", () => {
		app.log.info("📦 Redis connected");
	});

	app.decorate("cache", createRedisCache(redis));
	app.decorate("redis", redis);

	app.addHook("onClose", async (instance) => {
		if (instance.redis) {
			await instance.redis.quit();
			instance.log.info("Redis disconnected");
		}
	});
}

export default fp(redisPlugin, {
	name: "redis-cache-plugin",
});
