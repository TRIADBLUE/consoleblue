import { useState, useEffect } from "react";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, X } from "lucide-react";

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: number;
  defaultTitle?: string;
  defaultDescription?: string;
  sourceLabel?: string;
  sourcePage?: string;
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  defaultProjectId,
  defaultTitle = "",
  defaultDescription = "",
  sourceLabel,
  sourcePage,
}: TaskCreateDialogProps) {
  const createTask = useCreateTask();
  const { data: projectData } = useProjects();
  const projects = projectData?.projects || [];

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId ? String(defaultProjectId) : "none",
  );
  const [taggedProjects, setTaggedProjects] = useState<number[]>([]);

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      setProjectId(defaultProjectId ? String(defaultProjectId) : "none");
      setTaggedProjects(defaultProjectId ? [defaultProjectId] : []);
      setStatus("todo");
      setPriority("medium");
      setDueDate("");
    }
  }, [open, defaultTitle, defaultDescription, defaultProjectId]);

  function addTaggedProject(id: string) {
    const numId = parseInt(id, 10);
    if (!isNaN(numId) && !taggedProjects.includes(numId)) {
      setTaggedProjects((prev) => [...prev, numId]);
    }
  }

  function removeTaggedProject(id: number) {
    setTaggedProjects((prev) => prev.filter((p) => p !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    // Build tags from tagged projects
    const projectTags = taggedProjects
      .map((id) => projects.find((p) => p.id === id)?.slug)
      .filter(Boolean) as string[];

    // Add source page as a tag if available
    if (sourcePage) {
      projectTags.push(`source:${sourcePage}`);
    }

    const primaryProjectId = projectId !== "none" ? parseInt(projectId, 10) : undefined;

    // Build description with source context
    let fullDescription = description.trim();
    if (sourceLabel && fullDescription) {
      fullDescription = `${fullDescription}\n\n---\nSource: ${sourceLabel}`;
    } else if (sourceLabel) {
      fullDescription = `Source: ${sourceLabel}`;
    }

    await createTask.mutateAsync({
      title: title.trim(),
      description: fullDescription || undefined,
      status: status as any,
      priority: priority as any,
      dueDate: dueDate || undefined,
      projectId: primaryProjectId,
      tags: projectTags.length > 0 ? projectTags : undefined,
    });

    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setTaggedProjects([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        {/* Source indicator */}
        {sourceLabel && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 -mt-1">
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Captured from <span className="font-medium text-gray-700">{sourceLabel}</span></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Primary Project</Label>
            <Select value={projectId} onValueChange={(val) => {
              setProjectId(val);
              if (val !== "none") addTaggedProject(val);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: p.colorPrimary || "#666" }}
                      />
                      {p.displayName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Multi-project tagging */}
          <div>
            <Label>Also Related To</Label>
            <Select
              value=""
              onValueChange={addTaggedProject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tag additional projects..." />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter((p) => !taggedProjects.includes(p.id))
                  .map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.colorPrimary || "#666" }}
                        />
                        {p.displayName}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {taggedProjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {taggedProjects.map((id) => {
                  const project = projects.find((p) => p.id === id);
                  if (!project) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="text-xs flex items-center gap-1 pr-1"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: project.colorPrimary || "#666" }}
                      />
                      {project.displayName}
                      <button
                        type="button"
                        onClick={() => removeTaggedProject(id)}
                        className="ml-0.5 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
