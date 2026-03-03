import { eq, and } from "drizzle-orm";
import { sitePlans, sitePages, siteConnections, projects } from "../../shared/schema";
import type { AuditService } from "./audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export class SitePlannerService {
  constructor(
    private db: NodePgDatabase,
    private auditService: AuditService,
  ) {}

  private async resolveProjectId(idOrSlug: string): Promise<number | null> {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const condition = isNumeric
      ? eq(projects.id, parseInt(idOrSlug, 10))
      : eq(projects.slug, idOrSlug);

    const [project] = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(condition)
      .limit(1);

    return project?.id ?? null;
  }

  async getOrCreate(idOrSlug: string) {
    const projectId = await this.resolveProjectId(idOrSlug);
    if (!projectId) return null;

    // Try to find existing plan
    let [plan] = await this.db
      .select()
      .from(sitePlans)
      .where(eq(sitePlans.projectId, projectId))
      .limit(1);

    // Auto-create if not exists
    if (!plan) {
      [plan] = await this.db
        .insert(sitePlans)
        .values({ projectId, name: "Site Plan" })
        .returning();
    }

    const pages = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.sitePlanId, plan.id));

    const connections = await this.db
      .select()
      .from(siteConnections)
      .where(eq(siteConnections.sitePlanId, plan.id));

    return { plan, pages, connections };
  }

  async updatePlan(
    idOrSlug: string,
    data: { name?: string; canvasState?: { zoom: number; panX: number; panY: number } },
  ) {
    const projectId = await this.resolveProjectId(idOrSlug);
    if (!projectId) return null;

    const [plan] = await this.db
      .select()
      .from(sitePlans)
      .where(eq(sitePlans.projectId, projectId))
      .limit(1);

    if (!plan) return null;

    const [updated] = await this.db
      .update(sitePlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sitePlans.id, plan.id))
      .returning();

    return updated;
  }

  async createPage(idOrSlug: string, data: Record<string, unknown>) {
    const projectId = await this.resolveProjectId(idOrSlug);
    if (!projectId) return null;

    const [plan] = await this.db
      .select()
      .from(sitePlans)
      .where(eq(sitePlans.projectId, projectId))
      .limit(1);

    if (!plan) return null;

    const [page] = await this.db
      .insert(sitePages)
      .values({ ...data, sitePlanId: plan.id } as any)
      .returning();

    await this.auditService.log({
      action: "create",
      entityType: "site_page",
      entityId: page.id,
      newValue: page,
    });

    return page;
  }

  async updatePage(pageId: number, data: Record<string, unknown>) {
    const [existing] = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.id, pageId))
      .limit(1);

    if (!existing) return null;

    const [updated] = await this.db
      .update(sitePages)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(sitePages.id, pageId))
      .returning();

    return updated;
  }

  async deletePage(pageId: number) {
    const [existing] = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.id, pageId))
      .limit(1);

    if (!existing) return null;

    await this.db.delete(sitePages).where(eq(sitePages.id, pageId));

    await this.auditService.log({
      action: "delete",
      entityType: "site_page",
      entityId: pageId,
      previousValue: existing,
    });

    return existing;
  }

  async createConnection(idOrSlug: string, data: Record<string, unknown>) {
    const projectId = await this.resolveProjectId(idOrSlug);
    if (!projectId) return null;

    const [plan] = await this.db
      .select()
      .from(sitePlans)
      .where(eq(sitePlans.projectId, projectId))
      .limit(1);

    if (!plan) return null;

    const [connection] = await this.db
      .insert(siteConnections)
      .values({ ...data, sitePlanId: plan.id } as any)
      .returning();

    return connection;
  }

  async deleteConnection(connId: number) {
    const [existing] = await this.db
      .select()
      .from(siteConnections)
      .where(eq(siteConnections.id, connId))
      .limit(1);

    if (!existing) return null;

    await this.db.delete(siteConnections).where(eq(siteConnections.id, connId));
    return existing;
  }

  async linkTask(pageId: number, taskId: number | null) {
    const [updated] = await this.db
      .update(sitePages)
      .set({ linkedTaskId: taskId, updatedAt: new Date() })
      .where(eq(sitePages.id, pageId))
      .returning();

    return updated || null;
  }
}
