import { Badge } from "@/components/ui/badge";
import { Flag, Calendar } from "lucide-react";
import type { Task } from "@shared/types";

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700",
  todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  medium: "text-blue-600",
  low: "text-gray-400",
};

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left px-4 py-2 font-medium text-gray-500">
              Title
            </th>
            <th className="text-left px-4 py-2 font-medium text-gray-500 w-32">
              Status
            </th>
            <th className="text-left px-4 py-2 font-medium text-gray-500 w-28">
              Priority
            </th>
            <th className="text-left px-4 py-2 font-medium text-gray-500 w-32">
              Due Date
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate) < new Date() &&
              task.status !== "done";

            return (
              <tr
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium text-gray-900">
                    {task.title}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={`text-xs ${STATUS_COLORS[task.status]}`}>
                    {task.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`flex items-center gap-1 text-xs ${PRIORITY_COLORS[task.priority]}`}
                  >
                    <Flag className="h-3 w-3" />
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {task.dueDate ? (
                    <span
                      className={`flex items-center gap-1 text-xs ${
                        isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">-</span>
                  )}
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-gray-400"
              >
                No tasks found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
