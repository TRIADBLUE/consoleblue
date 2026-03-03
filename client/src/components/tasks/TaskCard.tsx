import { Badge } from "@/components/ui/badge";
import { Calendar, Flag } from "lucide-react";
import type { Task } from "@shared/types";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
        {task.title}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
          <Flag className="h-3 w-3 mr-1" />
          {task.priority}
        </Badge>

        {task.dueDate && (
          <span
            className={`text-xs flex items-center gap-1 ${
              isOverdue ? "text-red-600 font-medium" : "text-gray-500"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}

        {task.tags && task.tags.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {task.tags[0]}
          </Badge>
        )}
      </div>
    </div>
  );
}
