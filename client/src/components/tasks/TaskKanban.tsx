import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { useUpdateTask, useReorderTasks } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@shared/types";

const STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];

interface TaskKanbanProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskKanban({ tasks, onTaskClick }: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const updateTask = useUpdateTask();
  const reorderTasks = useReorderTasks();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Group tasks by status
  const columns: Record<string, Task[]> = {};
  for (const status of STATUSES) {
    columns[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    // Determine target status: either the column or the status of the task we're dropping on
    let targetStatus: string;
    const overTask = tasks.find((t) => t.id === over.id);

    if (overTask) {
      targetStatus = overTask.status;
    } else if (STATUSES.includes(over.id as TaskStatus)) {
      targetStatus = over.id as string;
    } else {
      return;
    }

    // If status changed, update the task
    if (activeTaskItem.status !== targetStatus) {
      updateTask.mutate({
        id: activeTaskItem.id,
        data: { status: targetStatus as TaskStatus },
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={columns[status]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
