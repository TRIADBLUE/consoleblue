import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #FF44CC)");

const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Must be lowercase alphanumeric with hyphens, no leading/trailing hyphens",
  );

// ── Project Validators ─────────────────────────────────

export const insertProjectSchema = z.object({
  slug: slug,
  displayName: z.string().min(1).max(200),
  description: z.string().optional(),
  githubRepo: z.string().max(200).optional(),
  githubOwner: z.string().max(100).optional(),
  defaultBranch: z.string().max(100).optional(),
  colorPrimary: hexColor.optional(),
  colorAccent: hexColor.optional(),
  colorBackground: hexColor.optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  iconEmoji: z.string().max(10).optional().nullable(),
  status: z
    .enum(["active", "archived", "maintenance", "development", "planned"])
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  subdomainUrl: z.string().max(500).optional().nullable(),
  productionUrl: z.string().url().max(500).optional().nullable(),
  customSettings: z.record(z.unknown()).optional(),
  syncEnabled: z.boolean().optional(),
});

export const updateProjectSchema = insertProjectSchema.partial();

export const reorderProjectsSchema = z.object({
  projectIds: z
    .array(z.number().int().positive())
    .min(1, "Must provide at least one project ID"),
});

// ── Project Colors Validator ───────────────────────────

export const updateColorsSchema = z
  .object({
    colorPrimary: hexColor.optional(),
    colorAccent: hexColor.optional(),
    colorBackground: hexColor.optional().nullable(),
  })
  .refine(
    (data) =>
      data.colorPrimary !== undefined ||
      data.colorAccent !== undefined ||
      data.colorBackground !== undefined,
    { message: "Must provide at least one color to update" },
  );

// ── Project Settings Validators ────────────────────────

export const upsertSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1).max(200),
        value: z.string().nullable(),
        valueType: z.enum(["string", "number", "boolean", "json"]).optional(),
        category: z.string().max(100).optional(),
        description: z.string().optional(),
      }),
    )
    .min(1),
});

// ── User Preferences Validators ────────────────────────

export const upsertPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        key: z.string().min(1).max(200),
        value: z.string(),
      }),
    )
    .min(1),
});

// ── GitHub Sync Validator ──────────────────────────────

export const syncRequestSchema = z.object({
  projectId: z.number().int().positive().optional(),
  repo: z.string().max(200).optional(),
});

// ── Query Param Validators ─────────────────────────────

export const projectListQuerySchema = z.object({
  status: z
    .enum(["active", "archived", "maintenance", "development", "planned"])
    .optional(),
  visible: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  tag: z.string().optional(),
  sort: z
    .enum(["display_order", "display_name", "updated_at", "created_at"])
    .optional()
    .default("display_order"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const auditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.coerce.number().int().optional(),
  action: z
    .enum([
      "create",
      "update",
      "delete",
      "reorder",
      "sync",
      "settings_change",
      "login",
      "logout",
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ── Shared Doc Validators ──────────────────────────────

export const insertSharedDocSchema = z.object({
  slug: slug,
  title: z.string().min(1).max(200),
  content: z.string().default(""),
  displayOrder: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

export const updateSharedDocSchema = insertSharedDocSchema.partial();

export const reorderDocsSchema = z.object({
  docIds: z
    .array(z.number().int().positive())
    .min(1, "Must provide at least one doc ID"),
});

// ── Project Doc Validators ─────────────────────────────

export const insertProjectDocSchema = z.object({
  slug: slug,
  title: z.string().min(1).max(200),
  content: z.string().default(""),
  displayOrder: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

export const updateProjectDocSchema = insertProjectDocSchema.partial();

// ── Doc Push Validators ────────────────────────────────

export const docPushSchema = z.object({
  targetPath: z.string().max(500).optional().default("CLAUDE.md"),
  commitMessage: z.string().max(500).optional(),
});

// ── Doc Generate Validator ─────────────────────────────

export const docGenerateSchema = z.object({
  force: z.boolean().optional().default(false),
});

// ── Export Types ────────────────────────────────────────

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type ReorderProjects = z.infer<typeof reorderProjectsSchema>;
export type UpdateColors = z.infer<typeof updateColorsSchema>;
export type UpsertSettings = z.infer<typeof upsertSettingsSchema>;
export type UpsertPreferences = z.infer<typeof upsertPreferencesSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;
export type InsertSharedDoc = z.infer<typeof insertSharedDocSchema>;
export type UpdateSharedDoc = z.infer<typeof updateSharedDocSchema>;
export type InsertProjectDoc = z.infer<typeof insertProjectDocSchema>;
export type UpdateProjectDoc = z.infer<typeof updateProjectDocSchema>;
export type DocPushRequest = z.infer<typeof docPushSchema>;
export type ReorderDocs = z.infer<typeof reorderDocsSchema>;
export type DocGenerate = z.infer<typeof docGenerateSchema>;
