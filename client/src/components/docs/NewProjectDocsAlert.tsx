import { useGenerateDocs } from "@/hooks/use-doc-generator";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle } from "lucide-react";

interface NewProjectDocsAlertProps {
  projectSlug: string;
  projectName: string;
}

export function NewProjectDocsAlert({
  projectSlug,
  projectName,
}: NewProjectDocsAlertProps) {
  const generate = useGenerateDocs(projectSlug);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">
          {projectName} has no docs yet
        </p>
        <p className="text-sm text-blue-700 mt-0.5">
          Generate starter docs from this project's metadata to quickly populate
          a project overview, tech stack, and getting started guide.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => generate.mutate({})}
            disabled={generate.isPending}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {generate.isPending ? "Generating…" : "Generate Starter Docs"}
          </Button>
          {generate.isError && (
            <p className="text-sm text-red-600">
              {(generate.error as Error).message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
