import type { Request, Response, NextFunction } from "express";
import type { CacheService } from "../services/cache.service";

export function githubCacheMiddleware(
  cacheService: CacheService,
  endpoint: string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const force = req.query.force === "true";

    if (force) {
      return next();
    }

    const params: Record<string, string | undefined> = {
      repo: req.query.repo as string | undefined,
      path: req.query.path as string | undefined,
      count: req.query.count as string | undefined,
      query: req.query.query as string | undefined,
    };

    const cacheKey = cacheService.buildKey(endpoint, params);

    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.json({
          ...cached.data as object,
          cached: true,
          cachedAt: cached.cachedAt.toISOString(),
        });
      }
    } catch (err) {
      // Cache read failed — proceed to live fetch
      console.warn(`[cache] Read error for ${cacheKey}:`, err);
    }

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);
    res.json = ((data: unknown) => {
      // Cache the response asynchronously (don't block the response)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const owner = process.env.GITHUB_OWNER || "triadblue";
        cacheService
          .set(cacheKey, endpoint, {
            owner,
            repo: params.repo,
            path: params.path,
          }, data)
          .catch((err) =>
            console.warn(`[cache] Write error for ${cacheKey}:`, err),
          );
      }
      return originalJson({ ...data as object, cached: false });
    }) as typeof res.json;

    next();
  };
}
