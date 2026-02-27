import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProjectSyncButton } from "./ProjectSyncButton";
import { ExternalLink, Github, GripVertical } from "lucide-react";
import { getBrandAssets } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { Project } from "@shared/types";

interface ProjectCardProps {
  project: Project;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function ProjectCard({
  project,
  isDragging,
  dragHandleProps,
}: ProjectCardProps) {
  const brandAssets = getBrandAssets(project.slug);

  return (
    <Card
      className={cn(
        "group relative transition-all duration-200 hover:shadow-md border-l-4",
        isDragging && "shadow-lg opacity-90 rotate-1",
      )}
      style={{
        borderLeftColor: project.colorPrimary || "#0000FF",
        ["--project-primary" as string]: project.colorPrimary,
        ["--project-accent" as string]: project.colorAccent,
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>
          )}

          {/* Icon */}
          <SafeImage
            src={project.iconUrl || brandAssets.icon}
            alt={project.displayName}
            className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
            fallbackInitials={project.displayName.slice(0, 2)}
            fallbackColor={project.colorPrimary || "#0000FF"}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/projects/${project.slug}`}
                className="text-base font-semibold text-gray-900 hover:underline truncate"
              >
                {project.displayName}
              </Link>
              <ProjectStatusBadge status={project.status} />
            </div>

            {project.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {project.description}
              </p>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer: URLs + Sync */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {project.productionUrl && (
                  <a
                    href={project.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {project.subdomainUrl || "Live"}
                  </a>
                )}
                {project.githubRepo && (
                  <a
                    href={`https://github.com/${project.githubOwner || "triadblue"}/${project.githubRepo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-gray-600 transition-colors"
                  >
                    <Github className="h-3 w-3" />
                    {project.githubRepo}
                  </a>
                )}
              </div>

              <ProjectSyncButton
                repo={project.githubRepo}
                projectId={project.id}
                lastSyncedAt={project.lastSyncedAt}
                size="icon"
              />
            </div>
          </div>

          {/* Color accent stripe */}
          <div
            className="absolute top-0 right-0 w-1 h-full rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: project.colorAccent || "#FF44CC" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
