import { Request, Response, NextFunction } from "express";
import { eq, and, gt } from "drizzle-orm";
import { adminUsers, adminSessions } from "../../shared/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    sessionToken?: string;
  }
}

export function createAuthMiddleware(db: NodePgDatabase) {
  return async function authRequired(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Allow API key auth as alternative
    const apiKey = (req.headers["x-api-key"] || req.query.api_key) as string;
    if (apiKey && apiKey === process.env.CONSOLE_API_KEY) {
      return next();
    }

    // Check session
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify session token is still valid
    if (req.session.sessionToken) {
      const [session] = await db
        .select()
        .from(adminSessions)
        .where(
          and(
            eq(adminSessions.sessionToken, req.session.sessionToken),
            gt(adminSessions.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!session) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Session expired" });
      }

      // Update last activity
      await db
        .update(adminSessions)
        .set({ lastActivity: new Date() })
        .where(eq(adminSessions.id, session.id));
    }

    next();
  };
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
