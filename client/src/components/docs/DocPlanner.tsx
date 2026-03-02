import { useState } from "react";
import {
  useGenerateDocs,
  useRegenerateDocs,
  useDocTemplates,
} from "@/hooks/use-doc-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Github,
} from "lucide-react";

interface DocPlannerProps {
  projectSlug: string;
  projectName: string;
  githubRepo: string | null;
  hasExistingDocs: boolean;
}

export function DocPlanner({
  projectSlug,
  projectName,
  githubRepo,
  hasExistingDocs,
}: DocPlannerProps) {
  const { data: templates, isLoading: templatesLoading } = useDocTemplates();
  const generateDocs = useGenerateDocs(projectSlug);
  const regenerateDocs = useRegenerateDocs(projectSlug);

  if (templatesLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const templateList = templates?.templates || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm">
              Markdown Planner — Auto-Generation
            </CardTitle>
          </div>
          <Badge
            variant={hasExistingDocs ? "default" : "secondary"}
            className="text-xs"
          >
            {hasExistingDocs ? "Docs Generated" : "Not Yet Generated"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template List */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Auto-generated document templates:
          </p>
          <div className="space-y-1.5">
            {templateList.map((t) => (
              <div
                key={t.slug}
                className="flex items-center gap-2 p-2 rounded-md bg-gray-50"
              >
                <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{t.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {t.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Info about what gets generated */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            These documents contain <strong>policy, procedures, and handbooks</strong>{" "}
            for {projectName}. They are auto-populated with project data from
            ConsoleBlue and define the rules agents must follow. They are{" "}
            <strong>not prompts</strong>.
          </p>
          {githubRepo && (
            <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
              <Github className="h-3 w-3" />
              Auto-push enabled — CLAUDE.md will be pushed to{" "}
              <code className="text-xs font-mono">{githubRepo}</code> on generation.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!hasExistingDocs ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={generateDocs.isPending}
                  className="gap-1.5"
                >
                  <Zap className="h-4 w-4" />
                  {generateDocs.isPending
                    ? "Generating..."
                    : "Generate Onboarding Docs"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Generate onboarding docs for {projectName}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create {templateList.length} project documents
                    (policy, procedures, handbook) and send a notification to
                    all team members.
                    {githubRepo && (
                      <>
                        {" "}
                        The assembled CLAUDE.md will also be auto-pushed to the{" "}
                        <code>{githubRepo}</code> repository.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => generateDocs.mutate()}
                  >
                    Generate & Notify
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={regenerateDocs.isPending}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  {regenerateDocs.isPending
                    ? "Regenerating..."
                    : "Regenerate Docs"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Regenerate docs for {projectName}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will update the auto-generated documents with the
                    latest project data from ConsoleBlue. Any manual edits
                    to auto-generated docs will be overwritten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => regenerateDocs.mutate()}
                  >
                    Regenerate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Success/Error feedback */}
        {generateDocs.isSuccess && generateDocs.data && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-700">
              <p className="font-medium">
                {generateDocs.data.docsCreated} docs generated successfully!
              </p>
              <p>
                {generateDocs.data.notificationsSent} notification(s) sent to
                team members.
              </p>
              {generateDocs.data.autoPushed && (
                <p className="mt-1">
                  CLAUDE.md auto-pushed to GitHub (commit:{" "}
                  <code className="font-mono">
                    {generateDocs.data.commitSha?.slice(0, 7)}
                  </code>
                  )
                </p>
              )}
            </div>
          </div>
        )}

        {generateDocs.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">
              Generation failed: {(generateDocs.error as Error).message}
            </p>
          </div>
        )}

        {regenerateDocs.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-700">
              {regenerateDocs.data?.docsUpdated} docs regenerated with latest
              project data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
