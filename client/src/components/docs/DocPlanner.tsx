import { useProjectDocs } from "@/hooks/use-project-docs";
import { ProjectDocList } from "./ProjectDocList";
import { DocAssemblyPreview } from "./DocAssemblyPreview";
import { DocPushHistory } from "./DocPushHistory";
import { NewProjectDocsAlert } from "./NewProjectDocsAlert";
import { Skeleton } from "@/components/ui/skeleton";

interface DocPlannerProps {
  projectSlug: string;
  projectName: string;
  githubRepo: string | null;
  githubOwner: string | null;
}

export function DocPlanner({
  projectSlug,
  projectName,
  githubRepo,
  githubOwner,
}: DocPlannerProps) {
  const { data, isLoading } = useProjectDocs(projectSlug);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const hasDocs = (data?.docs?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {!hasDocs && (
        <NewProjectDocsAlert
          projectSlug={projectSlug}
          projectName={projectName}
        />
      )}
      <ProjectDocList projectSlug={projectSlug} />
      <DocAssemblyPreview
        projectSlug={projectSlug}
        githubRepo={githubRepo}
      />
      <DocPushHistory
        projectSlug={projectSlug}
        githubOwner={githubOwner}
      />
    </div>
  );
}
