// Shared types between client and server
// Derived from the database schema but decoupled for API contracts

export type ProjectStatus =
  | "active"
  | "archived"
  | "maintenance"
  | "development"
  | "planned";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "reorder"
  | "sync"
  | "settings_change"
  | "login"
  | "logout";

// ── API Response Types ─────────────────────────────────

export interface Project {
  id: number;
  slug: string;
  displayName: string;
  description: string | null;
  githubRepo: string | null;
  githubOwner: string | null;
  defaultBranch: string | null;
  colorPrimary: string | null;
  colorAccent: string | null;
  colorBackground: string | null;
  iconUrl: string | null;
  iconEmoji: string | null;
  status: ProjectStatus;
  displayOrder: number;
  visible: boolean;
  tags: string[];
  subdomainUrl: string | null;
  productionUrl: string | null;
  customSettings: Record<string, unknown>;
  lastSyncedAt: string | null;
  syncEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSetting {
  id: number;
  projectId: number;
  key: string;
  value: string | null;
  valueType: string | null;
  category: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: number;
  userId: number;
  key: string;
  value: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  action: AuditAction;
  entityType: string;
  entityId: number | null;
  entitySlug: string | null;
  previousValue: unknown;
  newValue: unknown;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ── API Request/Response Shapes ────────────────────────

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface ProjectDetailResponse {
  project: Project;
  settings: ProjectSetting[];
}

export interface ProjectColorsResponse {
  projectId: number;
  slug: string;
  colorPrimary: string | null;
  colorAccent: string | null;
  colorBackground: string | null;
}

export interface ReorderResponse {
  success: boolean;
  projects: Project[];
}

export interface DeleteResponse {
  success: boolean;
  deleted: { id: number; slug: string };
}

export interface SyncResponse {
  synced: { repo: string; updatedFields: string[] }[];
  errors: { repo: string; error: string }[];
}

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
  version: string;
  timestamp: string;
  database: "connected" | "error";
  github: "configured" | "missing_token";
  cache: { entries: number; oldestEntry: string | null };
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
}

// ── Doc Types ─────────────────────────────────────────

export interface SharedDoc {
  id: number;
  slug: string;
  title: string;
  content: string;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDoc {
  id: number;
  projectId: number;
  slug: string;
  title: string;
  content: string;
  displayOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocPushLogEntry {
  id: number;
  projectId: number;
  targetRepo: string;
  targetPath: string;
  commitSha: string | null;
  assembledContent: string;
  status: "success" | "error";
  errorMessage: string | null;
  pushedAt: string;
}

export interface SharedDocListResponse {
  docs: SharedDoc[];
}

export interface ProjectDocListResponse {
  docs: ProjectDoc[];
}

export interface DocAssemblyPreview {
  assembledContent: string;
  sharedDocs: { title: string; slug: string }[];
  projectDocs: { title: string; slug: string }[];
}

export interface DocPushResponse {
  success: boolean;
  commitSha: string;
  commitUrl: string;
  targetRepo: string;
  targetPath: string;
}

export interface DocPushHistoryResponse {
  entries: DocPushLogEntry[];
  total: number;
}

export interface ReorderDocsResponse {
  success: boolean;
  docs: SharedDoc[] | ProjectDoc[];
}

// ── GitHub Types ───────────────────────────────────────

export interface GithubRepo {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  updatedAt: string;
  defaultBranch: string;
  size: number;
}

export interface GithubTreeItem {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number | null;
}

export interface GithubFile {
  repo: string;
  name: string;
  path: string;
  size: number;
  encoding: string;
  content: string;
}

export interface GithubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GithubReposResponse {
  count: number;
  repos: GithubRepo[];
  cached: boolean;
  cachedAt?: string;
}

export interface GithubTreeResponse {
  repo: string;
  path: string;
  type: "directory" | "file";
  contents: GithubTreeItem[];
  cached: boolean;
  cachedAt?: string;
}

export interface GithubFileResponse extends GithubFile {
  cached: boolean;
  cachedAt?: string;
}

export interface GithubCommitsResponse {
  repo: string;
  count: number;
  commits: GithubCommit[];
  cached: boolean;
  cachedAt?: string;
}

export interface GithubRoutesResponse {
  repo: string;
  sourceFile: string;
  routeCount: number;
  routes: string[];
  cached: boolean;
  cachedAt?: string;
}

export interface GithubSearchResponse {
  repo: string;
  query: string;
  path: string;
  count: number;
  files: { name: string; path: string; size: number }[];
  cached: boolean;
  cachedAt?: string;
}
