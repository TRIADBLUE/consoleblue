import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useProject } from "@/hooks/use-projects";
import { useProjectDocs } from "@/hooks/use-project-docs";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectColorPicker } from "@/components/projects/ProjectColorPicker";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectSyncButton } from "@/components/projects/ProjectSyncButton";
import { ProjectDeleteDialog } from "@/components/projects/ProjectDeleteDialog";
import { SafeImage } from "@/components/ui/safe-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getBrandAssets } from "@/lib/assets";
import { DocPlanner } from "@/components/docs/DocPlanner";
import { ProjectDocList } from "@/components/docs/ProjectDocList";
import { DocAssemblyPreview } from "@/components/docs/DocAssemblyPreview";
import { DocPushHistory } from "@/components/docs/DocPushHistory";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Settings,
  Palette,
  FileCode,
  FileText,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProjectDetailPage() {
  const [, params] = useRoute("/projects/:slug");
  const slug = params?.slug || "";
  const { data, isLoading, error } = useProject(slug);
  const { data: docsData } = useProjectDocs(slug);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Project not found</p>
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { project, settings } = data;
  const brandAssets = getBrandAssets(project.slug);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div
          className="rounded-xl p-6 mb-6 border"
          style={{
            borderLeftWidth: "6px",
            borderLeftColor: project.colorPrimary || "#0000FF",
            backgroundColor: project.colorBackground || `${project.colorPrimary || "#0000FF"}05`,
          }}
        >
          <div className="flex items-start gap-4">
            <SafeImage
              src={project.iconUrl || brandAssets.icon}
              alt={project.displayName}
              className="w-16 h-16 rounded-xl object-contain"
              fallbackInitials={project.displayName.slice(0, 2)}
              fallbackColor={project.colorPrimary || "#0000FF"}
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {project.displayName}
                </h1>
                <ProjectStatusBadge status={project.status} />
              </div>

              {project.description && (
                <p className="text-gray-600 mb-3">{project.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-400">
                {project.productionUrl && (
                  <a
                    href={project.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {project.subdomainUrl || project.productionUrl}
                  </a>
                )}
                {project.githubRepo && (
                  <a
                    href={`https://github.com/${project.githubOwner || "triadblue"}/${project.githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-600"
                  >
                    <Github className="h-3.5 w-3.5" />
                    {project.githubRepo}
                  </a>
                )}
                <ProjectSyncButton
                  repo={project.githubRepo}
                  projectId={project.id}
                  lastSyncedAt={project.lastSyncedAt}
                  size="sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit {project.displayName}</DialogTitle>
                  </DialogHeader>
                  <ProjectForm
                    project={project}
                    onSuccess={() => setEditOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <ProjectDeleteDialog
                projectSlug={project.slug}
                projectName={project.displayName}
              />
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-200/50">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-white/80 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="settings">
          <TabsList className="mb-4">
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-1">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-1">
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="github" className="gap-1">
              <FileCode className="h-4 w-4" />
              GitHub
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {settings.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No custom settings configured for this project.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {settings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {setting.key}
                          </div>
                          {setting.category && (
                            <span className="text-xs text-gray-400">
                              {setting.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-mono text-gray-600">
                          {setting.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectColorPicker
                  projectSlug={project.slug}
                  colorPrimary={project.colorPrimary}
                  colorAccent={project.colorAccent}
                  colorBackground={project.colorBackground}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <div className="space-y-6">
              <DocPlanner
                projectSlug={project.slug}
                projectName={project.displayName}
                githubRepo={project.githubRepo}
                hasExistingDocs={(docsData?.docs?.length ?? 0) > 0}
              />
              <ProjectDocList projectSlug={project.slug} />
              <DocAssemblyPreview
                projectSlug={project.slug}
                githubRepo={project.githubRepo}
              />
              <DocPushHistory
                projectSlug={project.slug}
                githubOwner={project.githubOwner}
              />
            </div>
          </TabsContent>

          <TabsContent value="github">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Repository</CardTitle>
              </CardHeader>
              <CardContent>
                {project.githubRepo ? (
                  <div className="space-y-4">
                    {/* Lazy-load the full explorer components */}
                    <p className="text-sm text-gray-500">
                      Repository:{" "}
                      <span className="font-mono font-medium">
                        {project.githubRepo}
                      </span>
                      {" / "}
                      <span className="font-mono">{project.defaultBranch}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    No GitHub repository linked to this project.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
