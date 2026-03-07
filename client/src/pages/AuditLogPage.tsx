import { useState } from "react";
import { useAuditLog } from "@/hooks/use-audit-log";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AuditAction } from "@shared/types";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  reorder: "bg-purple-100 text-purple-700",
  sync: "bg-cyan-100 text-cyan-700",
  settings_change: "bg-yellow-100 text-yellow-700",
  login: "bg-gray-100 text-gray-700",
  logout: "bg-gray-100 text-gray-700",
};

export default function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const limit = 25;

  const { data, isLoading } = useAuditLog({
    action: actionFilter !== "all" ? (actionFilter as AuditAction) : undefined,
    entityType: entityFilter !== "all" ? entityFilter : undefined,
    limit,
    offset,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          {data && (
            <span className="text-sm text-gray-400">{data.total} entries</span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="reorder">Reorder</SelectItem>
              <SelectItem value="sync">Sync</SelectItem>
              <SelectItem value="settings_change">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="project_settings">Settings</SelectItem>
              <SelectItem value="github_sync">GitHub Sync</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !data?.entries.length ? (
              <div className="p-8 text-center text-gray-400">
                No audit entries found
              </div>
            ) : (
              <div className="divide-y">
                {data.entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
                  return (
                    <div key={entry.id}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <Badge
                          className={`text-xs ${ACTION_COLORS[entry.action] || ""}`}
                        >
                          {entry.action}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700">
                            {entry.entityType}
                            {entry.entitySlug && (
                              <span className="font-mono ml-1 text-gray-500">
                                {entry.entitySlug}
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                        {hasMetadata && (
                          isExpanded
                            ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && hasMetadata && (
                        <div className="px-4 pb-3 pt-0">
                          <pre className="text-xs font-mono bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.total > limit && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-400">
              {offset + 1}–{Math.min(offset + limit, data.total)} of{" "}
              {data.total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + limit >= data.total}
                onClick={() => setOffset(offset + limit)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
