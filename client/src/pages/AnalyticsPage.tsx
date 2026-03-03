import { useAnalytics } from "@/hooks/use-analytics";
import { useProjects } from "@/hooks/use-projects";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-400",
  todo: "bg-blue-500",
  in_progress: "bg-yellow-500",
  review: "bg-purple-500",
  done: "bg-green-500",
};

export default function AnalyticsPage() {
  const [projectId, setProjectId] = useState<string>("");
  const { data: projectData } = useProjects();
  const { data, isLoading } = useAnalytics(
    projectId ? parseInt(projectId, 10) : undefined,
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const totalTasks = data
    ? Object.values(data.taskStatusDist).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-[200px]">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {totalTasks > 0 ? (
              <div className="space-y-3">
                {Object.entries(data?.taskStatusDist || {}).map(
                  ([status, count]) => (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 capitalize">
                          {status.replace("_", " ")}
                        </span>
                        <span className="text-sm font-medium">
                          {count} ({Math.round((count / totalTasks) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[status] || "bg-gray-400"}`}
                          style={{
                            width: `${(count / totalTasks) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No tasks yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tasks Completed Per Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks Completed Per Week</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.tasksPerWeek && data.tasksPerWeek.length > 0 ? (
              <div className="flex items-end gap-2 h-40">
                {data.tasksPerWeek.map((week) => {
                  const maxCount = Math.max(
                    ...data.tasksPerWeek.map((w) => w.count),
                    1,
                  );
                  const height = (week.count / maxCount) * 100;
                  return (
                    <div
                      key={week.week}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-gray-500 font-medium">
                        {week.count}
                      </span>
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {new Date(week.week).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Doc Pushes Per Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doc Pushes Per Week</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.pushesPerWeek && data.pushesPerWeek.length > 0 ? (
              <div className="flex items-end gap-2 h-40">
                {data.pushesPerWeek.map((week) => {
                  const maxCount = Math.max(
                    ...data.pushesPerWeek.map((w) => w.count),
                    1,
                  );
                  const height = (week.count / maxCount) * 100;
                  return (
                    <div
                      key={week.week}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-gray-500 font-medium">
                        {week.count}
                      </span>
                      <div
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <span className="text-xs text-gray-400 truncate w-full text-center">
                        {new Date(week.week).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalTasks}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                <Progress
                  value={
                    totalTasks > 0
                      ? ((data?.taskStatusDist.done || 0) / totalTasks) * 100
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {data?.taskStatusDist.done || 0} of {totalTasks} complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
