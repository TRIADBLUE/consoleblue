import { useState } from "react";
import { useDocPreview, useDocPush } from "@/hooks/use-doc-push";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Eye, Upload, Check, AlertCircle } from "lucide-react";

interface DocAssemblyPreviewProps {
  projectSlug: string;
  githubRepo: string | null;
}

export function DocAssemblyPreview({
  projectSlug,
  githubRepo,
}: DocAssemblyPreviewProps) {
  const { data: preview, isLoading } = useDocPreview(projectSlug);
  const push = useDocPush(projectSlug);
  const [targetPath, setTargetPath] = useState("CLAUDE.md");
  const [commitMessage, setCommitMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!preview) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-400">
          Unable to load preview.
        </CardContent>
      </Card>
    );
  }

  const hasContent =
    preview.sharedDocs.length > 0 || preview.projectDocs.length > 0;

  return (
    <div className="space-y-4">
      {/* Doc inventory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Assembly Contents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">
              Shared Docs ({preview.sharedDocs.length})
            </p>
            {preview.sharedDocs.length === 0 ? (
              <p className="text-xs text-gray-400">None</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {preview.sharedDocs.map((d) => (
                  <Badge key={d.slug} variant="secondary" className="text-xs">
                    {d.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">
              Project Docs ({preview.projectDocs.length})
            </p>
            {preview.projectDocs.length === 0 ? (
              <p className="text-xs text-gray-400">None</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {preview.projectDocs.map((d) => (
                  <Badge key={d.slug} variant="outline" className="text-xs">
                    {d.title}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          disabled={!hasContent}
        >
          <Eye className="h-4 w-4 mr-1" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>

        {showPreview && (
          <Card className="mt-2">
            <CardContent className="py-4">
              <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border max-h-96 overflow-auto">
                {preview.assembledContent || "(empty)"}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Push controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Push to GitHub</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!githubRepo ? (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              No GitHub repo linked. Configure one in project settings.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Target Path</Label>
                  <Input
                    value={targetPath}
                    onChange={(e) => setTargetPath(e.target.value)}
                    placeholder="CLAUDE.md"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Commit Message (optional)</Label>
                  <Input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder={`Update ${targetPath} via ConsoleBlue`}
                    className="text-sm"
                  />
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!hasContent || push.isPending}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {push.isPending ? "Pushing..." : `Push to ${githubRepo}`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Push CLAUDE.md to {githubRepo}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will commit <code>{targetPath}</code> to the{" "}
                      <code>{githubRepo}</code> repository. Any existing file at
                      that path will be overwritten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        push.mutate({
                          targetPath,
                          ...(commitMessage ? { commitMessage } : {}),
                        })
                      }
                    >
                      Push
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {push.isSuccess && push.data && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Pushed! Commit:{" "}
                  <a
                    href={push.data.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono underline"
                  >
                    {push.data.commitSha.slice(0, 7)}
                  </a>
                </p>
              )}

              {push.isError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Push failed: {(push.error as Error).message}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
