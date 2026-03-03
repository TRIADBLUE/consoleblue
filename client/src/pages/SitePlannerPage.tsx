import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "wouter";
import {
  useSitePlan,
  useUpdateSitePlan,
  useCreateSitePage,
  useUpdateSitePage,
  useDeleteSitePage,
  useCreateSiteConnection,
  useDeleteSiteConnection,
} from "@/hooks/use-site-planner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2,
  Trash2,
} from "lucide-react";
import type { SitePage, SiteConnection } from "@shared/types";

const STATUS_COLORS: Record<string, string> = {
  planned: "#9CA3AF",
  in_progress: "#3B82F6",
  complete: "#22C55E",
};

const PAGE_TYPE_ICONS: Record<string, string> = {
  page: "P",
  layout: "L",
  component: "C",
  api: "A",
};

export default function SitePlannerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const { data, isLoading } = useSitePlan(slug);
  const updatePlan = useUpdateSitePlan(slug);
  const createPage = useCreateSitePage(slug);
  const updatePage = useUpdateSitePage(slug);
  const deletePage = useDeleteSitePage(slug);
  const createConnection = useCreateSiteConnection(slug);
  const deleteConnection = useDeleteSiteConnection(slug);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingPage, setDraggingPage] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedPage, setSelectedPage] = useState<SitePage | null>(null);
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPagePath, setNewPagePath] = useState("");
  const [newPageType, setNewPageType] = useState("page");
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load canvas state from plan
  useEffect(() => {
    if (data?.plan.canvasState) {
      setZoom(data.plan.canvasState.zoom);
      setPan({ x: data.plan.canvasState.panX, y: data.plan.canvasState.panY });
    }
  }, [data?.plan.canvasState]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.2, Math.min(3, z + delta)));
    },
    [],
  );

  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-bg")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedPage(null);
    }
  }

  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (draggingPage !== null) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
      const y = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
      updatePage.mutate({
        pageId: draggingPage,
        data: { position: { x: Math.round(x), y: Math.round(y) } },
      });
    }
  }

  function handleCanvasMouseUp() {
    setIsPanning(false);
    if (draggingPage !== null) {
      setDraggingPage(null);
      // Save canvas state
      updatePlan.mutate({ canvasState: { zoom, panX: pan.x, panY: pan.y } });
    }
  }

  function handlePageMouseDown(e: React.MouseEvent, page: SitePage) {
    e.stopPropagation();
    if (connectingFrom !== null) {
      // Complete connection
      if (connectingFrom !== page.id) {
        createConnection.mutate({
          sourcePageId: connectingFrom,
          targetPageId: page.id,
        });
      }
      setConnectingFrom(null);
      return;
    }
    setSelectedPage(page);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setDragOffset({ x: mouseX - page.position.x, y: mouseY - page.position.y });
    setDraggingPage(page.id);
  }

  async function handleAddPage(e: React.FormEvent) {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    await createPage.mutateAsync({
      title: newPageTitle.trim(),
      path: newPagePath.trim() || undefined,
      pageType: newPageType as any,
      position: { x: 100 - pan.x / zoom, y: 100 - pan.y / zoom },
    });
    setNewPageTitle("");
    setNewPagePath("");
    setShowAddPage(false);
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const pages = data?.pages || [];
  const connections = data?.connections || [];

  // Helper to get page center
  function getPageCenter(page: SitePage) {
    return {
      x: page.position.x + (page.size?.w || 200) / 2,
      y: page.position.y + (page.size?.h || 120) / 2,
    };
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-gray-700">
            Site Planner: {data?.plan.name}
          </h1>
          <Badge variant="secondary" className="text-xs">
            {pages.length} pages
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConnectingFrom(null)}
            className={connectingFrom !== null ? "bg-orange-50 text-orange-600" : ""}
          >
            <Link2 className="h-4 w-4 mr-1" />
            {connectingFrom !== null ? "Cancel Link" : "Connect"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowAddPage(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Page
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative bg-gray-100 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* Grid pattern */}
        <div className="canvas-bg absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }} />

        {/* SVG connections layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {connections.map((conn) => {
              const source = pages.find((p) => p.id === conn.sourcePageId);
              const target = pages.find((p) => p.id === conn.targetPageId);
              if (!source || !target) return null;
              const sc = getPageCenter(source);
              const tc = getPageCenter(target);
              const midX = (sc.x + tc.x) / 2;
              const midY = (sc.y + tc.y) / 2;
              return (
                <g key={conn.id}>
                  <path
                    d={`M ${sc.x} ${sc.y} Q ${midX} ${sc.y} ${midX} ${midY} Q ${midX} ${tc.y} ${tc.x} ${tc.y}`}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray={conn.connectionType === "api_call" ? "4,4" : "none"}
                  />
                  {conn.label && (
                    <text
                      x={midX}
                      y={midY - 8}
                      textAnchor="middle"
                      className="text-xs fill-gray-500"
                      fontSize={11}
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Page nodes layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {pages.map((page) => (
            <div
              key={page.id}
              onMouseDown={(e) => handlePageMouseDown(e, page)}
              onClick={(e) => {
                e.stopPropagation();
                if (connectingFrom !== null && connectingFrom !== page.id) {
                  createConnection.mutate({
                    sourcePageId: connectingFrom,
                    targetPageId: page.id,
                  });
                  setConnectingFrom(null);
                } else {
                  setSelectedPage(page);
                }
              }}
              className={`absolute bg-white rounded-lg border-2 shadow-sm cursor-move select-none ${
                selectedPage?.id === page.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : connectingFrom === page.id
                    ? "border-orange-500"
                    : "border-gray-200 hover:border-gray-300"
              }`}
              style={{
                left: page.position.x,
                top: page.position.y,
                width: page.size?.w || 200,
                minHeight: page.size?.h || 80,
              }}
            >
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: STATUS_COLORS[page.status] }}
                  >
                    {PAGE_TYPE_ICONS[page.pageType]}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {page.title}
                  </span>
                </div>
                {page.path && (
                  <p className="text-xs text-gray-400 font-mono truncate">
                    {page.path}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Page sidebar */}
      {selectedPage && (
        <div className="absolute right-0 top-14 bottom-0 w-72 bg-white border-l shadow-lg z-30 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">{selectedPage.title}</h3>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setConnectingFrom(selectedPage.id);
                }}
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  deletePage.mutate(selectedPage.id);
                  setSelectedPage(null);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <Select
                value={selectedPage.status}
                onValueChange={(v) =>
                  updatePage.mutate({
                    pageId: selectedPage.id,
                    data: { status: v as any },
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500">Type</label>
              <Select
                value={selectedPage.pageType}
                onValueChange={(v) =>
                  updatePage.mutate({
                    pageId: selectedPage.id,
                    data: { pageType: v as any },
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="layout">Layout</SelectItem>
                  <SelectItem value="component">Component</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPage.description && (
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <p className="text-sm text-gray-700">{selectedPage.description}</p>
              </div>
            )}

            {/* Connections from this page */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Connections
              </label>
              {connections
                .filter(
                  (c) =>
                    c.sourcePageId === selectedPage.id ||
                    c.targetPageId === selectedPage.id,
                )
                .map((c) => {
                  const other = pages.find(
                    (p) =>
                      p.id ===
                      (c.sourcePageId === selectedPage.id
                        ? c.targetPageId
                        : c.sourcePageId),
                  );
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span className="text-gray-600">
                        {c.sourcePageId === selectedPage.id ? "\u2192" : "\u2190"}{" "}
                        {other?.title || "Unknown"}
                      </span>
                      <button
                        onClick={() => deleteConnection.mutate(c.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Add Page Dialog */}
      <Dialog open={showAddPage} onOpenChange={setShowAddPage}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Page</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPage} className="space-y-3">
            <Input
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Page title"
              autoFocus
            />
            <Input
              value={newPagePath}
              onChange={(e) => setNewPagePath(e.target.value)}
              placeholder="/path (optional)"
            />
            <Select value={newPageType} onValueChange={setNewPageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="layout">Layout</SelectItem>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowAddPage(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
