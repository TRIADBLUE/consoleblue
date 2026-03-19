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

export interface DocGenerateResponse {
  docs: ProjectDoc[];
  generated: number;
}

// ── Task Types ─────────────────────────────────────────

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type HighlightSourceType = "page" | "component" | "text";

export interface Task {
  id: number;
  projectId: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: number | null;
  parentTaskId: number | null;
  displayOrder: number;
  tags: string[];
  dueDate: string | null;
  completedAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskNote {
  id: number;
  taskId: number;
  content: string;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHighlight {
  id: number;
  taskId: number;
  sourceType: HighlightSourceType;
  sourcePath: string | null;
  highlightedText: string;
  contextSnippet: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface TaskDetailResponse {
  task: Task;
  notes: TaskNote[];
  highlights: TaskHighlight[];
}

export interface TaskStatsResponse {
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  total: number;
  overdue: number;
}

// ── Site Planner Types ─────────────────────────────────

export type PageType = "page" | "layout" | "component" | "api";
export type PageStatus = "planned" | "in_progress" | "complete";
export type ConnectionType = "navigates_to" | "includes" | "inherits" | "api_call";

export interface SitePlan {
  id: number;
  projectId: number;
  name: string;
  canvasState: { zoom: number; panX: number; panY: number };
  createdAt: string;
  updatedAt: string;
}

export interface SitePage {
  id: number;
  sitePlanId: number;
  title: string;
  path: string | null;
  pageType: PageType;
  description: string | null;
  status: PageStatus;
  position: { x: number; y: number };
  size: { w: number; h: number };
  linkedTaskId: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SiteConnection {
  id: number;
  sitePlanId: number;
  sourcePageId: number;
  targetPageId: number;
  connectionType: ConnectionType;
  label: string | null;
  createdAt: string;
}

export interface SitePlanResponse {
  plan: SitePlan;
  pages: SitePage[];
  connections: SiteConnection[];
}

// ── Chat Types ─────────────────────────────────────────

export type AgentRole = "builder" | "architect";
export type ChatThreadStatus = "active" | "archived";
export type ChatMessageRole = "user" | "assistant" | "system";
export type AIProviderType =
  | "anthropic"
  | "openai"
  | "google"
  | "deepseek"
  | "kimi"
  | "groq"
  | "replit";

export interface ChatThread {
  id: number;
  projectId: number | null;
  title: string;
  agentRole: AgentRole;
  providerSlug: string | null;
  modelId: string | null;
  status: ChatThreadStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  threadId: number;
  role: ChatMessageRole;
  content: string;
  tokenCount: number | null;
  linkedTaskId: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AIProviderConfig {
  id: number;
  slug: string;
  displayName: string;
  providerType: AIProviderType;
  isEnabled: boolean;
  defaultForRole: AgentRole | null;
  modelTiers: { builder?: string; architect?: string };
  config: { baseUrl?: string; headers?: Record<string, string> };
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThreadListResponse {
  threads: ChatThread[];
  total: number;
}

export interface ChatThreadDetailResponse {
  thread: ChatThread;
  messages: ChatMessage[];
}

export interface ChatProviderListResponse {
  providers: AIProviderConfig[];
}

// ── Asset Types ────────────────────────────────────────

export type AssetCategory = "icon" | "logo" | "screenshot" | "document";

export interface Asset {
  id: number;
  projectId: number | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  category: AssetCategory;
  uploadedBy: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AssetListResponse {
  assets: Asset[];
  total: number;
}

// ── Link Monitor Types ─────────────────────────────────

export interface LinkCheck {
  id: number;
  projectId: number;
  url: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  isHealthy: boolean;
  errorMessage: string | null;
  checkedAt: string;
}

export interface LinkCheckListResponse {
  checks: LinkCheck[];
  total: number;
}

// ── Dashboard Types ────────────────────────────────────

export interface DashboardStatsResponse {
  totalProjects: number;
  activeTasks: number;
  openThreads: number;
  recentPushes: number;
  tasksByStatus: Record<TaskStatus, number>;
  recentActivity: AuditLogEntry[];
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

// ── Online Global Assets (OGA) Types ──────────────────

export type OgaSiteStatus = "active" | "disabled" | "pending";

export interface OgaSite {
  id: number;
  domain: string;
  displayName: string;
  apiKey: string;
  status: OgaSiteStatus;
  emancipated: boolean;
  parentDomain: string | null;
  allowedOrigins: string[];
  lastFetchedAt: string | null;
  fetchCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OgaAsset {
  id: number;
  siteId: number;
  assetType: string;
  value: string;
  mimeType: string | null;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OgaSiteListResponse {
  sites: OgaSite[];
  total: number;
}

export interface OgaSiteDetailResponse {
  site: OgaSite;
  assets: OgaAsset[];
}

export interface OgaConfigResponse {
  domain: string;
  siteName: string;
  assets: {
    favicon16?: string;
    favicon32?: string;
    faviconIco?: string;
    appleTouchIcon?: string;
    ogImage?: string;
    themeColor?: string;
    manifestIcon192?: string;
    manifestIcon512?: string;
    headerLogo?: string;
    headerLogoDark?: string;
    loginLogo?: string;
    loginBackground?: string;
    loginAccentColor?: string;
  };
  updatedAt: string;
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
