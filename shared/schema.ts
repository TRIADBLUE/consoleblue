import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "archived",
  "maintenance",
  "development",
  "planned",
]);

export const auditLogActionEnum = pgEnum("audit_log_action", [
  "create",
  "update",
  "delete",
  "reorder",
  "sync",
  "settings_change",
  "login",
  "logout",
]);

// ── Projects ───────────────────────────────────────────

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),

  // Identity
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description"),

  // GitHub link
  githubRepo: varchar("github_repo", { length: 200 }),
  githubOwner: varchar("github_owner", { length: 100 }),
  defaultBranch: varchar("default_branch", { length: 100 }).default("main"),

  // Branding
  colorPrimary: varchar("color_primary", { length: 7 }).default("#0000FF"),
  colorAccent: varchar("color_accent", { length: 7 }).default("#FF44CC"),
  colorBackground: varchar("color_background", { length: 7 }),
  iconUrl: text("icon_url"),
  iconEmoji: varchar("icon_emoji", { length: 10 }),

  // Organization
  status: projectStatusEnum("status").default("active").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  visible: boolean("visible").default(true).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),

  // URLs
  subdomainUrl: varchar("subdomain_url", { length: 500 }),
  productionUrl: varchar("production_url", { length: 500 }),

  // Custom data
  customSettings: jsonb("custom_settings")
    .$type<Record<string, unknown>>()
    .default({}),

  // Sync
  lastSyncedAt: timestamp("last_synced_at"),
  syncEnabled: boolean("sync_enabled").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Project Settings ───────────────────────────────────

export const projectSettings = pgTable(
  "project_settings",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 200 }).notNull(),
    value: text("value"),
    valueType: varchar("value_type", { length: 20 }).default("string"),
    category: varchar("category", { length: 100 }),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("project_settings_project_key_idx").on(
      table.projectId,
      table.key,
    ),
  ],
);

// ── User Preferences ───────────────────────────────────

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    key: varchar("key", { length: 200 }).notNull(),
    value: text("value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_preferences_user_key_idx").on(table.userId, table.key),
  ],
);

// ── GitHub Sync Cache ──────────────────────────────────

export const githubSyncCache = pgTable("github_sync_cache", {
  id: serial("id").primaryKey(),
  cacheKey: varchar("cache_key", { length: 500 }).notNull().unique(),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  owner: varchar("owner", { length: 100 }).notNull(),
  repo: varchar("repo", { length: 200 }),
  path: text("path"),
  responseData: jsonb("response_data").notNull(),
  etag: varchar("etag", { length: 200 }),
  ttlSeconds: integer("ttl_seconds").default(300).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Audit Log ──────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: auditLogActionEnum("action").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: integer("entity_id"),
  entitySlug: varchar("entity_slug", { length: 200 }),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Admin Users ───────────────────────────────────────

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 200 }),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  accountLocked: boolean("account_locked").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lastFailedLogin: timestamp("last_failed_login"),
  lockedUntil: timestamp("locked_until"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Admin Sessions ────────────────────────────────────

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => adminUsers.id, { onDelete: "cascade" })
    .notNull(),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Password Reset Tokens ─────────────────────────────

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => adminUsers.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Notifications ─────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => adminUsers.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Notification Preferences ──────────────────────────

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => adminUsers.id, { onDelete: "cascade" })
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_prefs_user_type_idx").on(
      table.userId,
      table.type,
    ),
  ],
);

// ── Relations ──────────────────────────────────────────

export const projectsRelations = relations(projects, ({ many }) => ({
  settings: many(projectSettings),
  notifications: many(notifications),
}));

export const projectSettingsRelations = relations(
  projectSettings,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectSettings.projectId],
      references: [projects.id],
    }),
  }),
);

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  user: one(adminUsers, {
    fields: [adminSessions.userId],
    references: [adminUsers.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(adminUsers, {
    fields: [notifications.userId],
    references: [adminUsers.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(adminUsers, {
      fields: [notificationPreferences.userId],
      references: [adminUsers.id],
    }),
  }),
);
