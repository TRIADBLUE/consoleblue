import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { notifications, notificationPreferences } from "../../shared/schema";
import { createAuthMiddleware } from "../middleware/auth";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export function createNotificationRoutes(db: NodePgDatabase) {
  const router = Router();
  const authRequired = createAuthMiddleware(db);

  // GET /api/notifications
  router.get("/", authRequired, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      const unreadCount = rows.filter((n) => !n.read).length;
      res.set("X-Unread-Count", unreadCount.toString());
      res.json({ notifications: rows, unreadCount });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // PATCH /api/notifications/:id/read
  router.patch("/:id/read", authRequired, async (req, res) => {
    try {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, parseInt(req.params.id as string, 10)));
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // POST /api/notifications/bulk-read
  router.post("/bulk-read", authRequired, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "ids must be an array" });
      }

      await Promise.all(
        ids.map((id: number) =>
          db
            .update(notifications)
            .set({ read: true })
            .where(eq(notifications.id, id)),
        ),
      );
      res.json({ success: true, count: ids.length });
    } catch (err) {
      console.error("Error bulk marking as read:", err);
      res.status(500).json({ error: "Failed to bulk mark as read" });
    }
  });

  // DELETE /api/notifications/:id
  router.delete("/:id", authRequired, async (req, res) => {
    try {
      await db
        .delete(notifications)
        .where(eq(notifications.id, parseInt(req.params.id as string, 10)));
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting notification:", err);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // GET /api/notification-preferences
  router.get("/preferences", authRequired, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
      res.json({ preferences: prefs });
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // PATCH /api/notification-preferences/:type
  router.patch("/preferences/:type", authRequired, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { enabled } = req.body;
      const type = req.params.type as string;

      // Upsert
      const existing = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.userId, userId),
            eq(notificationPreferences.type, type),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(notificationPreferences)
          .set({ enabled })
          .where(eq(notificationPreferences.id, existing[0].id));
      } else {
        await db.insert(notificationPreferences).values({
          userId,
          type,
          enabled,
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating notification preference:", err);
      res.status(500).json({ error: "Failed to update preference" });
    }
  });

  return router;
}
