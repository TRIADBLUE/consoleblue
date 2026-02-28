import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SharedDoc } from "../../../../shared/types";

interface SharedDocEditorProps {
  doc?: SharedDoc;
  onSave: (data: {
    slug: string;
    title: string;
    content: string;
    enabled?: boolean;
  }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function SharedDocEditor({
  doc,
  onSave,
  onCancel,
  isPending,
}: SharedDocEditorProps) {
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
        <Label htmlFor="doc-title">Title</Label>
        <Input
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Brand Rules"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-slug">Slug</Label>
        <Input
          id="doc-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoSlug(false);
          }}
          placeholder="e.g. brand-rules"
          required
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          title="Lowercase alphanumeric with hyphens"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="doc-content">Content (Markdown)</Label>
        <Textarea
          id="doc-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your markdown content here..."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="doc-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <Label htmlFor="doc-enabled">
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
