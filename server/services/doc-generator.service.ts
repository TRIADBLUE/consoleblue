import { eq, asc } from "drizzle-orm";
import {
  projects,
  sharedDocs,
  projectDocs,
  notifications,
  docPushLog,
  adminUsers,
} from "../../shared/schema";
import { githubService } from "./github.service";
import type { AuditService } from "./audit.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// ── Template Sections ──────────────────────────────────
// These are NOT prompts. They are policy, procedure, and handbook
// content that gets auto-populated into each project's CLAUDE.md.

interface DocTemplate {
  slug: string;
  title: string;
  category: "policy" | "procedure" | "handbook";
  generateContent: (project: ProjectData) => string;
}

interface ProjectData {
  slug: string;
  displayName: string;
  description: string | null;
  githubRepo: string | null;
  githubOwner: string | null;
  defaultBranch: string | null;
  colorPrimary: string | null;
  status: string;
  tags: string[];
  subdomainUrl: string | null;
  productionUrl: string | null;
  customSettings: Record<string, unknown>;
}

// ── Doc Templates ──────────────────────────────────────

const DOC_TEMPLATES: DocTemplate[] = [
  {
    slug: "company-identity",
    title: "Company Identity & Overview",
    category: "handbook",
    generateContent: (project) => `## Who We Are

**TriadBlue** is a technology ecosystem that builds, manages, and operates multiple digital products and services under one umbrella. Every project in this ecosystem shares the same standards, infrastructure patterns, and operational philosophy.

**${project.displayName}** is a project within the TriadBlue ecosystem.
${project.description ? `\n**Project Purpose:** ${project.description}` : ""}
${project.productionUrl ? `**Live URL:** ${project.productionUrl}` : ""}
${project.subdomainUrl ? `**Subdomain:** ${project.subdomainUrl}` : ""}
${project.githubRepo ? `**Repository:** TRIADBLUE/${project.githubRepo}` : ""}

### Ecosystem Context

This project does not operate in isolation. It is part of a multi-project console managed at **console.blue** (ConsoleBlue). All documentation, settings, branding, and deployment configurations are centrally managed there. Changes to shared infrastructure affect all projects.

### Core Values

1. **Consistency** — Every project follows the same patterns, naming conventions, and code standards
2. **Transparency** — All work is tracked, logged, and auditable via ConsoleBlue
3. **Documentation First** — No work begins without reading the project documentation
4. **Approval Required** — All significant changes require owner review before deployment`,
  },

  {
    slug: "project-restrictions",
    title: "Project Restrictions & Boundaries",
    category: "policy",
    generateContent: (project) => `## Restrictions & Non-Negotiable Rules

These restrictions apply to ALL work on **${project.displayName}**. Violations will be flagged and rolled back.

### What You CANNOT Do

1. **No deployments without approval** — All changes must be reviewed before going live
2. **No database schema changes without documentation** — Every migration must be documented in the project docs
3. **No secret/API key modifications** — Environment variables are managed centrally through ConsoleBlue. Never hardcode secrets
4. **No breaking changes to shared APIs** — If ${project.displayName} exposes endpoints used by other TriadBlue projects, those contracts cannot be changed without ecosystem-wide review
5. **No skipping mobile implementation** — Every frontend change must work on both desktop and mobile (375px minimum width)
6. **No work without a task** — All significant work must have a corresponding task in the system
7. **No direct pushes to main** — All code changes go through the standard branch and review process

### Branding Restrictions

- Primary color: \`${project.colorPrimary || "#0000FF"}\` — Do not deviate from the project's brand palette
- All assets must follow the TriadBlue Asset Management Standards (kebab-case filenames, no spaces, no timestamps)
- Icons and logos are managed in ConsoleBlue's asset registry — do not create ad-hoc image files

### Data & Privacy

- No user PII in logs or console output
- No third-party analytics without owner approval
- All API responses must follow the established error format
- No storing sensitive data in localStorage or cookies

### Communication

- Report work completion with specific file paths and line numbers
- Provide screenshots for all visual changes (desktop AND mobile)
- Do not claim "everything works" without testing
- If something breaks, report it immediately — do not attempt to silently fix it`,
  },

  {
    slug: "unique-features",
    title: "Unique Features & Capabilities",
    category: "handbook",
    generateContent: (project) => {
      const tags = project.tags || [];
      const customSettings = project.customSettings || {};

      return `## ${project.displayName} — Unique Features

### Project Identity

| Property | Value |
|----------|-------|
| Slug | \`${project.slug}\` |
| Status | ${project.status} |
| Branch | \`${project.defaultBranch || "main"}\` |
${tags.length > 0 ? `| Tags | ${tags.join(", ")} |` : ""}
${project.subdomainUrl ? `| Subdomain | ${project.subdomainUrl} |` : ""}

### ConsoleBlue Integration

This project is managed through ConsoleBlue (console.blue). The following features are available:

- **Docs Tab** — Project-specific documentation is managed here and can be pushed to the repo as CLAUDE.md
- **GitHub Sync** — Repository data is cached and synced on a regular interval
- **Audit Log** — All changes to this project are recorded
- **Notification System** — Alerts are sent when project changes require attention
- **Settings** — Per-project configuration is stored in ConsoleBlue's database

### Custom Configuration

${Object.keys(customSettings).length > 0
  ? Object.entries(customSettings)
      .map(([key, value]) => `- **${key}:** ${JSON.stringify(value)}`)
      .join("\n")
  : "_No custom settings configured yet. Add them in ConsoleBlue → Project → Settings._"
}

### What Makes This Project Different

This section should be updated with ${project.displayName}'s specific capabilities, integrations, and unique selling points as the project develops. Update this doc in ConsoleBlue's Docs tab for this project.`;
    },
  },

  {
    slug: "general-direction",
    title: "General Direction & Development Standards",
    category: "procedure",
    generateContent: (project) => `## Development Direction for ${project.displayName}

### Work Process

1. **Read documentation FIRST** — Before any work, read this CLAUDE.md in its entirety
2. **Check ConsoleBlue for tasks** — See if there are assigned tasks or pending work items
3. **Work in phases** — Break large changes into logical phases. Complete one fully before starting the next
4. **Test before reporting** — Desktop AND mobile, all links functional, no console errors
5. **Report with evidence** — File paths, line numbers, screenshots

### Tech Stack Standards

All TriadBlue projects follow these standard patterns unless explicitly noted:

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL + Drizzle ORM
- **Deployment:** Replit (autoscale)
- **Version Control:** GitHub (TRIADBLUE organization)

### Code Standards

- TypeScript strict mode
- Kebab-case file names for assets
- PascalCase for React components
- camelCase for variables and functions
- All imports should be explicit (no wildcard imports in production code)
- Error handling: try/catch with proper error responses, never swallow errors silently

### Communication with ConsoleBlue

This project's documentation is assembled and pushed from ConsoleBlue. When you need to update onboarding docs:

1. Go to console.blue → Projects → ${project.displayName} → Docs tab
2. Edit the project-specific doc or create a new one
3. Use the Assembly Preview to see the full CLAUDE.md
4. Push to GitHub when ready

Shared docs (company-wide policy) are managed in ConsoleBlue → Docs (sidebar). Those automatically appear in every project's CLAUDE.md push.

### Current Status: ${project.status.toUpperCase()}

${project.status === "active" ? "This project is live and actively maintained. All changes should be carefully tested before deployment." : ""}
${project.status === "development" ? "This project is under active development. Focus on building core features and establishing patterns." : ""}
${project.status === "planned" ? "This project is in planning phase. Focus on architecture, documentation, and proof-of-concept work." : ""}
${project.status === "maintenance" ? "This project is in maintenance mode. Only bug fixes and critical updates. No new features without owner approval." : ""}
${project.status === "archived" ? "This project is archived. No changes should be made unless specifically requested by the owner." : ""}`,
  },
];

// ── Doc Generator Service ──────────────────────────────

export class DocGeneratorService {
  constructor(
    private db: NodePgDatabase,
    private auditService: AuditService,
  ) {}

  /**
   * Auto-generate onboarding docs for a newly created project.
   * Creates project-specific docs in the database and triggers
   * a notification to all admin users.
   */
  async generateForNewProject(projectId: number): Promise<{
    docsCreated: number;
    notificationsSent: number;
    autoPushed: boolean;
    commitSha?: string;
  }> {
    // 1. Fetch the project
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const projectData: ProjectData = {
      slug: project.slug,
      displayName: project.displayName,
      description: project.description,
      githubRepo: project.githubRepo,
      githubOwner: project.githubOwner,
      defaultBranch: project.defaultBranch,
      colorPrimary: project.colorPrimary,
      status: project.status,
      tags: (project.tags as string[]) || [],
      subdomainUrl: project.subdomainUrl,
      productionUrl: project.productionUrl,
      customSettings: (project.customSettings as Record<string, unknown>) || {},
    };

    // 2. Generate and insert project docs
    let docsCreated = 0;
    for (let i = 0; i < DOC_TEMPLATES.length; i++) {
      const template = DOC_TEMPLATES[i];
      const content = template.generateContent(projectData);

      // Check if doc already exists for this project
      const existing = await this.db
        .select()
        .from(projectDocs)
        .where(eq(projectDocs.projectId, projectId))
        .limit(100);

      const alreadyExists = existing.some((d) => d.slug === template.slug);
      if (alreadyExists) continue;

      await this.db.insert(projectDocs).values({
        projectId,
        slug: template.slug,
        title: template.title,
        content,
        displayOrder: i,
        enabled: true,
      });

      docsCreated++;
    }

    // 3. Send notification to ALL admin users
    const allUsers = await this.db.select().from(adminUsers);
    let notificationsSent = 0;

    for (const user of allUsers) {
      await this.db.insert(notifications).values({
        userId: user.id,
        type: "new_project_docs",
        title: `📋 New Project Onboarded: ${project.displayName}`,
        message: `${docsCreated} onboarding docs have been auto-generated for "${project.displayName}". Review the policy, procedures, and handbook documents in the Docs tab BEFORE starting any work on this project.`,
        metadata: {
          projectId: project.id,
          projectSlug: project.slug,
          docsGenerated: docsCreated,
          action: "review_docs_required",
        },
        projectId: project.id,
      });
      notificationsSent++;
    }

    // 4. Audit log
    await this.auditService.log({
      action: "create",
      entityType: "auto_generated_docs",
      entityId: project.id,
      entitySlug: project.slug,
      newValue: {
        docsCreated,
        templates: DOC_TEMPLATES.map((t) => t.slug),
        notificationsSent,
      },
    });

    // 5. Auto-push to GitHub if repo is configured
    let autoPushed = false;
    let commitSha: string | undefined;

    if (project.githubRepo && githubService.isConfigured) {
      try {
        const assembled = await this.assembleFullContent(projectId);

        const result = await githubService.pushFile({
          repo: project.githubRepo,
          path: "CLAUDE.md",
          content: assembled,
          message: `Auto-generate onboarding docs for ${project.displayName} via ConsoleBlue`,
          branch: project.defaultBranch || undefined,
        });

        // Log the push
        await this.db.insert(docPushLog).values({
          projectId: project.id,
          targetRepo: project.githubRepo,
          targetPath: "CLAUDE.md",
          commitSha: result.commitSha,
          assembledContent: assembled,
          status: "success",
        });

        autoPushed = true;
        commitSha = result.commitSha;

        // Send follow-up notification about auto-push
        for (const user of allUsers) {
          await this.db.insert(notifications).values({
            userId: user.id,
            type: "doc_auto_pushed",
            title: `✅ CLAUDE.md auto-pushed to ${project.githubRepo}`,
            message: `Onboarding docs for "${project.displayName}" have been automatically pushed to the repository. Commit: ${result.commitSha.slice(0, 7)}`,
            metadata: {
              projectId: project.id,
              projectSlug: project.slug,
              commitSha: result.commitSha,
              commitUrl: result.commitUrl,
            },
            projectId: project.id,
          });
        }
      } catch (pushErr: any) {
        console.error(
          `[doc-generator] Auto-push failed for ${project.slug}:`,
          pushErr.message,
        );

        // Log failure
        await this.db.insert(docPushLog).values({
          projectId: project.id,
          targetRepo: project.githubRepo,
          targetPath: "CLAUDE.md",
          assembledContent: "",
          status: "error",
          errorMessage: pushErr.message || "Auto-push failed",
        });
      }
    }

    return { docsCreated, notificationsSent, autoPushed, commitSha };
  }

  /**
   * Assemble full CLAUDE.md content (shared docs + project docs)
   */
  private async assembleFullContent(projectId: number): Promise<string> {
    const shared = await this.db
      .select()
      .from(sharedDocs)
      .where(eq(sharedDocs.enabled, true))
      .orderBy(asc(sharedDocs.displayOrder));

    const projectSpecific = await this.db
      .select()
      .from(projectDocs)
      .where(eq(projectDocs.projectId, projectId))
      .orderBy(asc(projectDocs.displayOrder));

    const enabledProjectDocs = projectSpecific.filter((d) => d.enabled);

    const sections: string[] = [];

    // Header
    sections.push(
      "<!-- Auto-generated by ConsoleBlue Doc Planner. Do not edit manually. -->\n",
    );

    // Shared docs first (company-wide policy)
    for (const doc of shared) {
      sections.push(`# ${doc.title}\n\n${doc.content}`);
    }

    // Project-specific docs
    for (const doc of enabledProjectDocs) {
      sections.push(`# ${doc.title}\n\n${doc.content}`);
    }

    // Footer
    sections.push(
      `\n---\n_Last generated: ${new Date().toISOString()} | Managed by ConsoleBlue_`,
    );

    return sections.join("\n\n---\n\n");
  }

  /**
   * Regenerate docs for an existing project (e.g., after settings change)
   */
  async regenerateForProject(projectId: number): Promise<{
    docsUpdated: number;
  }> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    const projectData: ProjectData = {
      slug: project.slug,
      displayName: project.displayName,
      description: project.description,
      githubRepo: project.githubRepo,
      githubOwner: project.githubOwner,
      defaultBranch: project.defaultBranch,
      colorPrimary: project.colorPrimary,
      status: project.status,
      tags: (project.tags as string[]) || [],
      subdomainUrl: project.subdomainUrl,
      productionUrl: project.productionUrl,
      customSettings: (project.customSettings as Record<string, unknown>) || {},
    };

    let docsUpdated = 0;

    for (const template of DOC_TEMPLATES) {
      const content = template.generateContent(projectData);

      // Find existing doc
      const existing = await this.db
        .select()
        .from(projectDocs)
        .where(eq(projectDocs.projectId, projectId))
        .limit(100);

      const existingDoc = existing.find((d) => d.slug === template.slug);

      if (existingDoc) {
        await this.db
          .update(projectDocs)
          .set({ content, updatedAt: new Date() })
          .where(eq(projectDocs.id, existingDoc.id));
        docsUpdated++;
      }
    }

    return { docsUpdated };
  }

  /**
   * Get list of available doc template slugs
   */
  getTemplates(): { slug: string; title: string; category: string }[] {
    return DOC_TEMPLATES.map((t) => ({
      slug: t.slug,
      title: t.title,
      category: t.category,
    }));
  }
}
