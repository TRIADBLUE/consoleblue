import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProjectDoc } from "../../../../shared/types";

interface ProjectDocEditorProps {
  doc?: ProjectDoc;
  onSave: (data: {
    slug: string;
    title: string;
    content: string;
    enabled?: boolean;
  }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ProjectDocEditor({
  doc,
  onSave,
  onCancel,
  isPending,
}: ProjectDocEditorProps) {
  const [title, setTitle] = useState(doc?.title || "");
  const [slug, setSlug] = useState(doc?.slug || "");
  const [content, setContent] = useState(doc?.content || "");
  const [enabled, setEnabled] = useState(doc?.enabled ?? true);
  const [autoSlug, setAutoSlug] = useState(!doc);

  useEffect(() => {
    if (autoSlug && title) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  }, [title, autoSlug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ slug, title, content, enabled });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pdoc-title">Title</Label>
        <Input
          id="pdoc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Architecture"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdoc-slug">Slug</Label>
        <Input
          id="pdoc-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoSlug(false);
          }}
          placeholder="e.g. architecture"
          required
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          title="Lowercase alphanumeric with hyphens"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdoc-content">Content (Markdown)</Label>
        <Textarea
          id="pdoc-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write project-specific instructions here..."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="pdoc-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <Label htmlFor="pdoc-enabled">
          Enabled (included in CLAUDE.md assembly)
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !title || !slug}>
          {isPending ? "Saving..." : doc ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
