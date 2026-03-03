import { Router } from "express";
import { desc, eq, gt, and, SQL } from "drizzle-orm";
import { tasks, auditLog, docPushLog } from "../../shared/schema";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createAnalyticsRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router();

  // GET /api/analytics
  router.get("/", async (req, res, next) => {
    try {
      const projectId = req.query.projectId
        ? parseInt(req.query.projectId as string, 10)
        : undefined;

      // Tasks completed per week (last 8 weeks)
      const tasksPerWeek: { week: string; count: number }[] = [];
      try {
        const allTasks = await db.select().from(tasks);
        const now = new Date();
        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const completed = allTasks.filter((t) => {
            if (!t.completedAt) return false;
            if (projectId && t.projectId !== projectId) return false;
            const d = new Date(t.completedAt);
            return d >= weekStart && d < weekEnd;
          });

          tasksPerWeek.push({
            week: weekStart.toISOString().split("T")[0],
            count: completed.length,
          });
        }
      } catch {
        // Tasks table might not exist yet
      }

      // Task status distribution
      const taskStatusDist: Record<string, number> = {
        backlog: 0,
        todo: 0,
        in_progress: 0,
        review: 0,
        done: 0,
      };
      try {
        const conditions: SQL[] = [];
        if (projectId) conditions.push(eq(tasks.projectId, projectId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const allTasks = await db.select().from(tasks).where(where);
        for (const t of allTasks) {
          taskStatusDist[t.status] = (taskStatusDist[t.status] || 0) + 1;
        }
      } catch {
        // Tasks table might not exist yet
      }

      // Doc pushes over time (last 8 weeks)
      const pushesPerWeek: { week: string; count: number }[] = [];
      try {
        const allPushes = await db.select().from(docPushLog);
        const now = new Date();
        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const pushes = allPushes.filter((p) => {
            if (projectId && p.projectId !== projectId) return false;
            const d = new Date(p.pushedAt);
            return d >= weekStart && d < weekEnd;
          });

          pushesPerWeek.push({
            week: weekStart.toISOString().split("T")[0],
            count: pushes.length,
          });
        }
      } catch {
        // Table might not exist
      }

      // Recent audit activity
      const { entries: recentActivity } = await auditService.query({
        limit: 50,
      });

      res.json({
        tasksPerWeek,
        taskStatusDist,
        pushesPerWeek,
        recentActivity,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
