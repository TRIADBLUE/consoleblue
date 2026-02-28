import { useDocPushHistory } from "@/hooks/use-doc-push";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DocPushHistoryProps {
  projectSlug: string;
  githubOwner?: string | null;
}

export function DocPushHistory({
  projectSlug,
  githubOwner,
}: DocPushHistoryProps) {
  const { data, isLoading } = useDocPushHistory(projectSlug);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const entries = data?.entries || [];

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-400">
          No push history yet. Push CLAUDE.md to see results here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Push History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {entries.map((entry) => {
            const owner = githubOwner || "triadblue";
            const commitUrl = entry.commitSha
              ? `https://github.com/${owner}/${entry.targetRepo}/commit/${entry.commitSha}`
              : null;
            const date = new Date(entry.pushedAt);

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <Badge
                  variant={entry.status === "success" ? "default" : "destructive"}
                  className="text-xs flex-shrink-0"
                >
                  {entry.status}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-mono text-xs text-gray-600">
                      {entry.targetPath}
                    </span>
                    {" → "}
                    <span className="font-mono text-xs text-gray-600">
                      {entry.targetRepo}
                    </span>
                  </div>
                  {entry.commitSha && commitUrl && (
                    <a
                      href={commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-600 hover:underline"
                    >
                      {entry.commitSha.slice(0, 7)}
                    </a>
                  )}
                  {entry.errorMessage && (
                    <p className="text-xs text-red-500">{entry.errorMessage}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {date.toLocaleDateString()}{" "}
                  {date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
