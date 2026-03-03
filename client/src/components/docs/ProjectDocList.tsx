import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useProjectDocs,
  useCreateProjectDoc,
  useUpdateProjectDoc,
  useDeleteProjectDoc,
  useReorderProjectDocs,
} from "@/hooks/use-project-docs";
import { ProjectDocEditor } from "./ProjectDocEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { ProjectDoc } from "../../../../shared/types";

function SortableDocItem({
  doc,
  onEdit,
  onDelete,
}: {
  doc: ProjectDoc;
  onEdit: (doc: ProjectDoc) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{doc.title}</span>
            <Badge
              variant={doc.enabled ? "default" : "secondary"}
              className="text-xs"
            >
              {doc.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <span className="text-xs text-gray-400 font-mono">{doc.slug}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
            <Pencil className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{doc.title}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this project doc.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(doc.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectDocListProps {
  projectSlug: string;
}

export function ProjectDocList({ projectSlug }: ProjectDocListProps) {
  const { data, isLoading } = useProjectDocs(projectSlug);
  const createDoc = useCreateProjectDoc(projectSlug);
  const updateDoc = useUpdateProjectDoc(projectSlug);
  const deleteDoc = useDeleteProjectDoc(projectSlug);
  const reorderDocs = useReorderProjectDocs(projectSlug);
  const [editingDoc, setEditingDoc] = useState<ProjectDoc | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const docs = data?.docs || [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = docs.findIndex((d) => d.id === active.id);
    const newIndex = docs.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(docs, oldIndex, newIndex);
    reorderDocs.mutate(reordered.map((d) => d.id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Project-Specific Docs</h3>
          <p className="text-xs text-gray-500">
            Only included when pushing this project's CLAUDE.md.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Doc
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Project Doc</DialogTitle>
            </DialogHeader>
            <ProjectDocEditor
              onSave={async (data) => {
                await createDoc.mutateAsync(data);
                setCreateOpen(false);
              }}
              onCancel={() => setCreateOpen(false)}
              isPending={createDoc.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {docs.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-gray-400">
            No project docs yet. Add one to include project-specific
            instructions in CLAUDE.md.
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={docs.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {docs.map((doc) => (
                <SortableDocItem
                  key={doc.id}
                  doc={doc}
                  onEdit={setEditingDoc}
                  onDelete={(id) => deleteDoc.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editingDoc}
        onOpenChange={(open) => {
          if (!open) setEditingDoc(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit: {editingDoc?.title}</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <ProjectDocEditor
              doc={editingDoc}
              onSave={async (data) => {
                await updateDoc.mutateAsync({
                  docId: editingDoc.id,
                  data,
                });
                setEditingDoc(null);
              }}
              onCancel={() => setEditingDoc(null)}
              isPending={updateDoc.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
