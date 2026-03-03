import { useState, createContext, useContext, type ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCreateTask } from "@/hooks/use-tasks";
import { TaskCreateDialog } from "./TaskCreateDialog";
import { ListPlus, Zap, ClipboardCopy } from "lucide-react";

interface TaskContextMenuContextType {
  isEnabled: boolean;
}

const TaskContextMenuContext = createContext<TaskContextMenuContextType>({
  isEnabled: true,
});

export function useTaskContextMenu() {
  return useContext(TaskContextMenuContext);
}

export function TaskContextMenuProvider({ children }: { children: ReactNode }) {
  const createTask = useCreateTask();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  function getSelectedText(): string {
    const selection = window.getSelection();
    return selection?.toString()?.trim() || "";
  }

  function handleQuickTask() {
    const text = getSelectedText();
    if (text) {
      createTask.mutate({ title: text });
    }
  }

  function handleCreateFromSelection() {
    const text = getSelectedText();
    setSelectedText(text);
    setCreateOpen(true);
  }

  return (
    <TaskContextMenuContext.Provider value={{ isEnabled: true }}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="contents">{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleCreateFromSelection}>
            <ListPlus className="h-4 w-4 mr-2" />
            Create Task from Selection
          </ContextMenuItem>
          <ContextMenuItem onClick={handleQuickTask}>
            <Zap className="h-4 w-4 mr-2" />
            Quick Task
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              const text = getSelectedText();
              if (text) navigator.clipboard.writeText(text);
            }}
          >
            <ClipboardCopy className="h-4 w-4 mr-2" />
            Copy
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultTitle={selectedText}
        defaultDescription={selectedText}
      />
    </TaskContextMenuContext.Provider>
  );
}
