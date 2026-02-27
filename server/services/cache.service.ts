import { eq, lt, and } from "drizzle-orm";
import { githubSyncCache } from "../../shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const DEFAULT_TTLS: Record<string, number> = {
  repos: 300,
  tree: 300,
  file: 600,
  commits: 120,
  search: 300,
  routes: 600,
};

export class CacheService {
  constructor(private db: NodePgDatabase) {}

  buildKey(
    endpoint: string,
    params: Record<string, string | undefined>,
  ): string {
    const owner = process.env.GITHUB_OWNER || "triadblue";
    switch (endpoint) {
      case "repos":
        return `repos:${owner}`;
      case "tree":
        return `tree:${params.repo}:${params.path || "/"}`;
      case "file":
        return `file:${params.repo}:${params.path}`;
      case "commits":
        return `commits:${params.repo}:${params.count || "10"}`;
      case "search":
        return `search:${params.repo}:${params.query}:${params.path || "/"}`;
      case "routes":
        return `routes:${params.repo}`;
      default:
        return `${endpoint}:${JSON.stringify(params)}`;
    }
  }

  async get(cacheKey: string): Promise<{ data: unknown; cachedAt: Date } | null> {
    const rows = await this.db
      .select()
      .from(githubSyncCache)
      .where(eq(githubSyncCache.cacheKey, cacheKey))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    if (row.expiresAt < new Date()) {
      // Expired — clean it up
      await this.db
        .delete(githubSyncCache)
        .where(eq(githubSyncCache.id, row.id));
      return null;
    }

    return { data: row.responseData, cachedAt: row.updatedAt };
  }

  async set(
    cacheKey: string,
    endpoint: string,
    params: { owner: string; repo?: string; path?: string },
    data: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    const ttl = ttlSeconds || DEFAULT_TTLS[endpoint] || 300;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const existing = await this.db
      .select({ id: githubSyncCache.id })
      .from(githubSyncCache)
      .where(eq(githubSyncCache.cacheKey, cacheKey))
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(githubSyncCache)
        .set({
          responseData: data,
          expiresAt,
          ttlSeconds: ttl,
          updatedAt: new Date(),
        })
        .where(eq(githubSyncCache.id, existing[0].id));
    } else {
      await this.db.insert(githubSyncCache).values({
        cacheKey,
        endpoint,
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        responseData: data,
        ttlSeconds: ttl,
        expiresAt,
      });
    }
  }

  async invalidate(cacheKey: string): Promise<void> {
    await this.db
      .delete(githubSyncCache)
      .where(eq(githubSyncCache.cacheKey, cacheKey));
  }

  async invalidateByRepo(repo: string): Promise<void> {
    // Delete all cache entries containing this repo name
    const rows = await this.db.select().from(githubSyncCache);
    const toDelete = rows.filter((r) => r.cacheKey.includes(repo));
    for (const row of toDelete) {
      await this.db
        .delete(githubSyncCache)
        .where(eq(githubSyncCache.id, row.id));
    }
  }

  async cleanup(): Promise<number> {
    const result = await this.db
      .delete(githubSyncCache)
      .where(lt(githubSyncCache.expiresAt, new Date()))
      .returning({ id: githubSyncCache.id });
    return result.length;
  }

  async stats(): Promise<{ entries: number; oldestEntry: string | null }> {
    const rows = await this.db.select().from(githubSyncCache);
    if (rows.length === 0) {
      return { entries: 0, oldestEntry: null };
    }
    const oldest = rows.reduce((a, b) =>
      a.createdAt < b.createdAt ? a : b,
    );
    return {
      entries: rows.length,
      oldestEntry: oldest.createdAt.toISOString(),
    };
  }
}
