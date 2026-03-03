import { Router } from "express";
import { eq, desc, count, and, gt } from "drizzle-orm";
import {
  projects,
  tasks,
  chatThreads,
  docPushLog,
  auditLog,
} from "../../shared/schema";
import type { AuditService } from "../services/audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createDashboardRoutes(
  db: NodePgDatabase,
  auditService: AuditService,
) {
  const router = Router();

  // GET /api/dashboard/stats
  router.get("/stats", async (_req, res, next) => {
    try {
      // Total projects
      const projectRows = await db.select({ id: projects.id }).from(projects);
      const totalProjects = projectRows.length;

      // Active tasks (not done)
      let activeTasks = 0;
      const tasksByStatus: Record<string, number> = {
        backlog: 0,
        todo: 0,
        in_progress: 0,
        review: 0,
        done: 0,
      };

      try {
        const allTasks = await db.select().from(tasks);
        for (const task of allTasks) {
          tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
          if (task.status !== "done") activeTasks++;
        }
      } catch {
        // Tasks table might not exist yet
      }

      // Open threads
      let openThreads = 0;
      try {
        const threadRows = await db
          .select({ id: chatThreads.id })
          .from(chatThreads)
          .where(eq(chatThreads.status, "active"));
        openThreads = threadRows.length;
      } catch {
        // Chat table might not exist yet
      }

      // Recent pushes (last 7 days)
      let recentPushes = 0;
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const pushRows = await db
          .select({ id: docPushLog.id })
          .from(docPushLog)
          .where(gt(docPushLog.pushedAt, weekAgo));
        recentPushes = pushRows.length;
      } catch {
        // Might not exist
      }

      // Recent activity
      const { entries: recentActivity } = await auditService.query({
        limit: 20,
      });

      res.json({
        totalProjects,
        activeTasks,
        openThreads,
        recentPushes,
        tasksByStatus,
        recentActivity,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
