import { useLinkChecks, useTriggerLinkCheck } from "@/hooks/use-link-monitor";
import { useProjects } from "@/hooks/use-projects";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Zap,
} from "lucide-react";

export default function LinkMonitorPage() {
  const [projectFilter, setProjectFilter] = useState<string>("");
  const { data: projectData } = useProjects();
  const { data, isLoading } = useLinkChecks(
    projectFilter ? { projectId: parseInt(projectFilter, 10) } : undefined,
  );
  const triggerCheck = useTriggerLinkCheck();

  function handleCheckAll() {
    const projects = projectData?.projects || [];
    for (const p of projects) {
      triggerCheck.mutate(p.id);
    }
  }

  function handleCheckProject(projectId: number) {
    triggerCheck.mutate(projectId);
  }

  // Group checks by URL to show latest status
  type CheckItem = NonNullable<typeof data>["checks"][number];
  const latestByUrl = new Map<string, CheckItem>();
  for (const check of data?.checks || []) {
    const existing = latestByUrl.get(check.url);
    if (!existing || new Date(check.checkedAt) > new Date(existing.checkedAt)) {
      latestByUrl.set(check.url, check);
    }
  }

  const latestChecks = Array.from(latestByUrl.values());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Link Monitor</h1>
        <div className="flex items-center gap-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projectData?.projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCheckAll}
            disabled={triggerCheck.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${
                triggerCheck.isPending ? "animate-spin" : ""
              }`}
            />
            Check All
          </Button>
        </div>
      </div>

      {/* Project URL cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {projectData?.projects
          .filter((p) => p.productionUrl || p.subdomainUrl)
          .filter((p) => !projectFilter || p.id === parseInt(projectFilter, 10))
          .map((project) => {
            const urls = [project.productionUrl, project.subdomainUrl].filter(
              Boolean,
            ) as string[];
            return (
              <Card key={project.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    {project.displayName}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCheckProject(project.id)}
                    disabled={triggerCheck.isPending}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Check
                  </Button>
                </CardHeader>
                <CardContent>
                  {urls.map((url) => {
                    const check = latestByUrl.get(url);
                    return (
                      <div
                        key={url}
                        className="flex items-center gap-3 py-2 border-b last:border-0"
                      >
                        {check ? (
                          check.isHealthy ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )
                        ) : (
                          <Globe className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {url}
                          </p>
                          {check && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant={check.isHealthy ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {check.statusCode || "ERR"}
                              </Badge>
                              {check.responseTimeMs && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {check.responseTimeMs}ms
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {new Date(check.checkedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                          {check?.errorMessage && (
                            <p className="text-xs text-red-500 mt-0.5">
                              {check.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Check History */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(data?.checks || []).slice(0, 50).map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0"
                >
                  {check.isHealthy ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="text-gray-600 truncate flex-1">
                    {check.url}
                  </span>
                  <Badge
                    variant={check.isHealthy ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {check.statusCode || "ERR"}
                  </Badge>
                  {check.responseTimeMs && (
                    <span className="text-xs text-gray-400">
                      {check.responseTimeMs}ms
                    </span>
                  )}
                  <span className="text-xs text-gray-400 w-36 text-right">
                    {new Date(check.checkedAt).toLocaleString()}
                  </span>
                </div>
              ))}
              {(!data?.checks || data.checks.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No checks yet. Click "Check All" to start monitoring.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
