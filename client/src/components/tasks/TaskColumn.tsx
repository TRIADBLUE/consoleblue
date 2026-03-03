import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { SortableTaskCard } from "./SortableTaskCard";
import type { Task } from "@shared/types";

const COLUMN_LABELS: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "bg-gray-500" },
  todo: { label: "To Do", color: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-yellow-500" },
  review: { label: "Review", color: "bg-purple-500" },
  done: { label: "Done", color: "bg-green-500" },
};

interface TaskColumnProps {
  status: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskColumn({ status, tasks, onTaskClick }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_LABELS[status] || { label: status, color: "bg-gray-500" };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[320px] flex-1 rounded-lg ${
        isOver ? "bg-blue-50" : "bg-gray-50"
      } transition-colors`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-sm font-semibold text-gray-700">
          {config.label}
        </span>
        <Badge variant="secondary" className="text-xs ml-auto">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
