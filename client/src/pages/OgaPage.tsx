import { useState } from "react";
import {
  useOgaSites,
  useOgaSite,
  useCreateOgaSite,
  useUpdateOgaSite,
  useDeleteOgaSite,
  useRegenerateOgaKey,
  useEmancipateOgaSite,
  useUpsertOgaAssets,
  useDeleteOgaAsset,
} from "@/hooks/use-oga";
import { useUploadAsset } from "@/hooks/use-assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Globe,
  Plus,
  ArrowLeft,
  Copy,
  RefreshCw,
  Trash2,
  ExternalLink,
  Shield,
  Image,
  Palette,
  LogIn,
  Layout,
  Eye,
  Check,
  AlertTriangle,
  Info,
  Download,
} from "lucide-react";
import type { OgaSite, OgaAsset } from "@shared/types";

interface AssetTypeConfig {
  key: string;
  label: string;
  info: string;
  accept?: string;
  isColor?: boolean;
  isText?: boolean;
  isColorOrImage?: boolean;
}

const ASSET_GROUPS: {
  label: string;
  icon: typeof Globe;
  types: AssetTypeConfig[];
}[] = [
  {
    label: "Brand Identity",
    icon: Palette,
    types: [
      { key: "logo-full-mark", label: "Logo Full Mark (1200×240)", info: "Official horizontal lockup — icon + wordmark together. 1200×240 PNG, transparent background. Master brand asset. CDN: logo-lockup.png", accept: "image/png,image/svg+xml" },
      { key: "logo-image", label: "Logo Image (1024×1024)", info: "Master square icon — symbol only, no text. 1024×1024 PNG, transparent background. Source file for every favicon/avatar size. CDN: logo-image.png", accept: "image/png,image/svg+xml" },
      { key: "logo-text", label: "Logo Text (1200×240)", info: "Wordmark only — the styled brand name with NO icon. 1200×240 PNG, transparent. CDN: logo-text.png", accept: "image/png,image/svg+xml" },
      { key: "brand-url", label: "Brand URL", info: "The brand URL as plain text (e.g. businessblueprint.io). No image.", isText: true },
    ],
  },
  {
    label: "Browser Icons",
    icon: Globe,
    types: [
      { key: "logo-image-16px", label: "Favicon 16px (16×16)", info: "Browser tab icon, non-retina. 16×16 PNG, transparent. Auto-resize from logo-image if not provided.", accept: "image/png" },
      { key: "logo-image-32px", label: "Favicon 32px (32×32)", info: "Browser tab icon, retina/high-DPI. 32×32 PNG, transparent.", accept: "image/png" },
      { key: "logo-image-48px", label: "Favicon 48px (48×48)", info: "Windows taskbar shortcut. 48×48 PNG, transparent.", accept: "image/png" },
      { key: "logo-image-180px", label: "Apple Touch Icon (180×180)", info: "iOS home-screen icon. 180×180 PNG, no transparency (iOS adds its own background if transparent).", accept: "image/png" },
      { key: "logo-image-192px", label: "PWA Icon (192×192)", info: "Android PWA icon. 192×192 PNG. Required for Progressive Web Apps.", accept: "image/png" },
      { key: "logo-image-512px", label: "PWA Splash Icon (512×512)", info: "Android splash-screen icon, app launch. 512×512 PNG.", accept: "image/png" },
      { key: "logo-image-icon", label: "Generic Icon (512×512)", info: "Fallback icon for any 'small brand icon' usage. 512×512 PNG, transparent.", accept: "image/png,image/svg+xml" },
      { key: "logo-image-avatar", label: "Avatar (256×256)", info: "Circular avatar contexts — social profiles, team listings. 256×256 PNG.", accept: "image/png,image/jpeg" },
      { key: "theme-color", label: "Theme Color", info: "Mobile browser chrome color. Hex value (e.g. #f97316). Warning: messaging apps tint link-preview backgrounds with this — don't pick a color that clashes with og-image foreground.", isColor: true },
    ],
  },
  {
    label: "Header & Navigation",
    icon: Layout,
    types: [
      { key: "header-logo", label: "Header Logo — Light BG (1200×240)", info: "Horizontal lockup for the site header on a LIGHT background. 1200×240 PNG, transparent, dark ink. Usually identical to logo-full-mark. CDN: logo-lockup.png", accept: "image/png,image/svg+xml" },
      { key: "header-logo-dark", label: "Header Logo — Dark BG (1200×240)", info: "Horizontal lockup for DARK backgrounds. 1200×240 PNG, transparent, light/white ink. CDN: logo-lockup-dark.png", accept: "image/png,image/svg+xml" },
    ],
  },
  {
    label: "Login & Auth Pages",
    icon: LogIn,
    types: [
      { key: "login-logo", label: "Login Logo (600×120)", info: "Logo centered above the login form. 600×120 PNG, transparent. Usually a scaled-down lockup.", accept: "image/png,image/svg+xml" },
      { key: "login-background", label: "Login Background", info: "Solid color OR image for the login page backdrop. If image: 1920×1080 minimum, PNG or JPG.", isColorOrImage: true, accept: "image/png,image/jpeg,image/webp" },
      { key: "login-accent-color", label: "Login Accent Color", info: "Primary brand color used on login buttons, links, highlights. Hex value.", isColor: true },
    ],
  },
  {
    label: "Social & SEO",
    icon: Image,
    types: [
      { key: "og-image", label: "OG Image (1200×630)", info: "Open Graph social card — iMessage, Slack, Facebook, LinkedIn unfurls. 1200×630 PNG or JPG. SOLID background (no transparency — messaging apps tint transparent areas with theme-color and your brand washes out). Safe zone: keep critical content inside inner 1100×520. CDN: og-image.png", accept: "image/png,image/jpeg" },
      { key: "twitter-image", label: "Twitter Card (1200×675)", info: "Twitter/X large-card image. 1200×675 PNG or JPG, solid background. If not set, Twitter falls back to og-image. CDN: twitter-image.png", accept: "image/png,image/jpeg" },
      { key: "site-name", label: "Site Name", info: "Display name used in browser tabs, social unfurls, bookmarks (e.g. businessblueprint.io).", isText: true },
    ],
  },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    disabled: "bg-gray-100 text-gray-500",
    pending: "bg-yellow-100 text-yellow-700",
  };
  return (
    <Badge className={`text-[10px] ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Asset Slot Component ──

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Info className="h-3 w-3" />
      </button>
      {show && (
        <span className="absolute z-50 left-5 top-1/2 -translate-y-1/2 w-56 px-2.5 py-1.5 text-[10px] text-gray-700 bg-white border border-gray-200 rounded-md shadow-lg leading-relaxed">
          {text}
        </span>
      )}
    </span>
  );
}

function AssetSlot({
  siteId,
  assetType,
  label,
  info,
  currentAsset,
  accept,
  isColor,
  isText,
  isColorOrImage,
}: {
  siteId: number;
  assetType: string;
  label: string;
  info: string;
  currentAsset?: OgaAsset;
  accept?: string;
  isColor?: boolean;
  isText?: boolean;
  isColorOrImage?: boolean;
}) {
  const upsertAssets = useUpsertOgaAssets();
  const deleteAsset = useDeleteOgaAsset();
  const uploadAsset = useUploadAsset();
  const [textValue, setTextValue] = useState(currentAsset?.value || "");
  const [viewOpen, setViewOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // For color-or-image: detect current mode from stored value
  const currentValueIsColor = currentAsset?.value?.startsWith("#") ?? true;
  const [bgMode, setBgMode] = useState<"color" | "image">(
    currentAsset?.value && !currentValueIsColor ? "image" : "color"
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadAsset.mutateAsync({
      file,
      category: "icon",
    });

    const assetUrl = `${window.location.origin}/api/assets/file/${result.asset.id}`;
    await upsertAssets.mutateAsync({
      siteId,
      data: {
        assets: [{ assetType, value: assetUrl, mimeType: file.type }],
      },
    });

    setImgError(false);
    e.target.value = "";
  }

  function handleColorChange(color: string) {
    upsertAssets.mutate({
      siteId,
      data: {
        assets: [{ assetType, value: color }],
      },
    });
  }

  function handleTextSave() {
    if (!textValue.trim()) return;
    upsertAssets.mutate({
      siteId,
      data: {
        assets: [{ assetType, value: textValue.trim() }],
      },
    });
  }

  function handleDelete() {
    if (currentAsset) {
      deleteAsset.mutate({ siteId, assetId: currentAsset.id });
      setImgError(false);
    }
  }

  const isImageValue = currentAsset?.value && (
    currentAsset.mimeType?.startsWith("image") ||
    currentAsset.value.includes("/api/assets/file/")
  );

  if (isColor) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">{label} <InfoTip text={info} /></p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={currentAsset?.value || "#000000"}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          {currentAsset && (
            <span className="text-[10px] font-mono text-gray-500">
              {currentAsset.value}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (isText) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">{label} <InfoTip text={info} /></p>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="h-7 w-40 text-xs"
            placeholder="Enter value..."
            onBlur={handleTextSave}
            onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
          />
        </div>
      </div>
    );
  }

  // Color-or-image mode (login-background)
  if (isColorOrImage) {
    return (
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">{label} <InfoTip text={info} /></p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
            <button
              onClick={() => setBgMode("color")}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${bgMode === "color" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}
            >
              Color
            </button>
            <button
              onClick={() => setBgMode("image")}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${bgMode === "image" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}
            >
              Image
            </button>
          </div>
        </div>
        {bgMode === "color" ? (
          <div className="flex items-center gap-2 pl-0">
            <input
              type="color"
              value={currentValueIsColor ? (currentAsset?.value || "#000000") : "#000000"}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            {currentAsset?.value?.startsWith("#") && (
              <span className="text-[10px] font-mono text-gray-500">
                {currentAsset.value}
              </span>
            )}
            {currentAsset && (
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {currentAsset?.value && !currentValueIsColor && !imgError && (
              <>
                <button onClick={() => setViewOpen(true)} className="cursor-pointer">
                  <img
                    src={currentAsset.value}
                    alt={label}
                    className="h-12 w-12 object-contain rounded border border-gray-200 bg-gray-50 hover:border-gray-400 transition-colors"
                    onError={() => setImgError(true)}
                  />
                </button>
                <a
                  href={currentAsset.value}
                  download={label}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </a>
                <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-sm">{label}</DialogTitle>
                    </DialogHeader>
                    <img src={currentAsset.value} alt={label} className="w-full object-contain rounded" />
                    <p className="text-[10px] text-gray-400 truncate">{currentAsset.value}</p>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <label className="cursor-pointer">
              <input type="file" accept={accept} onChange={handleFileUpload} className="hidden" />
              <span className="text-[10px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                {currentAsset && !currentValueIsColor ? "Replace" : "Upload"}
              </span>
            </label>
            {currentAsset && (
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Standard file upload slot
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">{label} <InfoTip text={info} /></p>
        {currentAsset && (
          <p className="text-[10px] text-gray-400 truncate">{currentAsset.value}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {isImageValue && !imgError && (
          <>
            <button onClick={() => setViewOpen(true)} className="cursor-pointer">
              <img
                src={currentAsset.value}
                alt={label}
                className="h-12 w-12 object-contain rounded border border-gray-200 bg-gray-50 hover:border-gray-400 transition-colors"
                onError={() => setImgError(true)}
              />
            </button>
            <a
              href={currentAsset.value}
              download={label}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Download"
            >
              <Download className="h-3 w-3" />
            </a>
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-sm">{label}</DialogTitle>
                </DialogHeader>
                <img src={currentAsset.value} alt={label} className="w-full object-contain rounded" />
                <p className="text-[10px] text-gray-400 truncate">{currentAsset.value}</p>
              </DialogContent>
            </Dialog>
          </>
        )}
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-[10px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
            {currentAsset ? "Replace" : "Upload"}
          </span>
        </label>
        {currentAsset && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Site Detail View ──

function SiteDetail({
  siteId,
  onBack,
}: {
  siteId: number;
  onBack: () => void;
}) {
  const { data } = useOgaSite(siteId);
  const updateSite = useUpdateOgaSite();
  const regenerateKey = useRegenerateOgaKey();
  const emancipate = useEmancipateOgaSite();
  const deleteSite = useDeleteOgaSite();
  const [showKey, setShowKey] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  if (!data) return null;

  const { site, assets } = data;
  const assetMap = new Map<string, OgaAsset>();
  for (const a of assets) {
    assetMap.set(a.assetType, a);
  }

  const embedSnippet = `<script src="${window.location.origin}/api/oga/embed.js?key=${site.apiKey}"></script>`;
  const apiEndpoint = `${window.location.origin}/api/oga/config?key=${site.apiKey}`;
  const isSubdomain = !!site.parentDomain;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{site.displayName}</h2>
            <StatusBadge status={site.status} />
            {isSubdomain && !site.emancipated && (
              <Badge className="text-[10px] bg-blue-50 text-blue-600">
                Inherits from {site.parentDomain}
              </Badge>
            )}
            {site.emancipated && isSubdomain && (
              <Badge className="text-[10px] bg-purple-50 text-purple-600">
                Emancipated
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">{site.domain}</p>
        </div>
        <Switch
          checked={site.status === "active"}
          onCheckedChange={(checked) =>
            updateSite.mutate({
              id: site.id,
              data: { status: checked ? "active" : "disabled" },
            })
          }
        />
      </div>

      {/* Emancipate banner for subdomains */}
      {isSubdomain && !site.emancipated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
          <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-800">
              This subdomain inherits assets from {site.parentDomain}
            </p>
            <p className="text-[10px] text-blue-600">
              Emancipate to give it independent branding control.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={() => emancipate.mutate(site.id)}
          >
            Emancipate
          </Button>
        </div>
      )}

      {/* Integration section */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Integration</h3>

        {/* API Key */}
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-gray-500">
            API Key
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-xs bg-white px-2 py-1.5 rounded border border-gray-200 font-mono truncate">
              {showKey ? site.apiKey : site.apiKey.slice(0, 8) + "..." + site.apiKey.slice(-4)}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-[10px] text-gray-500 hover:text-gray-700"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <CopyButton text={site.apiKey} />
            {confirmRegen ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-[10px] h-6"
                  onClick={() => {
                    regenerateKey.mutate(site.id);
                    setConfirmRegen(false);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[10px] h-6"
                  onClick={() => setConfirmRegen(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRegen(true)}
                className="text-gray-400 hover:text-gray-600"
                title="Regenerate key"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Embed Snippet */}
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-gray-500">
            Embed Snippet
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-[10px] bg-white px-2 py-1.5 rounded border border-gray-200 font-mono truncate">
              {embedSnippet}
            </code>
            <CopyButton text={embedSnippet} />
          </div>
        </div>

        {/* API Endpoint */}
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-gray-500">
            API Endpoint
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-[10px] bg-white px-2 py-1.5 rounded border border-gray-200 font-mono truncate">
              GET {apiEndpoint}
            </code>
            <CopyButton text={`curl "${apiEndpoint}"`} />
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-gray-400 pt-1">
          <span className="flex items-center gap-1">
            Fetched {site.fetchCount} times
            <InfoTip text="Every time a visitor loads a page on this site, the OGA embed script requests the latest brand assets from ConsoleBlue. This counter tracks how many page loads have used OGA." />
          </span>
          {site.lastFetchedAt && (
            <span>
              Last: {new Date(site.lastFetchedAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Asset Groups */}
      {ASSET_GROUPS.map((group) => (
        <div key={group.label} className="border rounded-lg">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b rounded-t-lg">
            <group.icon className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              {group.label}
            </h3>
          </div>
          <div className="px-4 divide-y divide-gray-100">
            {group.types.map((type) => (
              <AssetSlot
                key={type.key}
                siteId={site.id}
                assetType={type.key}
                label={type.label}
                info={type.info}
                currentAsset={assetMap.get(type.key)}
                accept={type.accept}
                isColor={type.isColor}
                isText={type.isText}
                isColorOrImage={type.isColorOrImage}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Danger zone */}
      <div className="border border-red-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </h3>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-red-600 flex-1">
              Delete {site.domain} and all its assets? This cannot be undone.
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs"
              onClick={() => {
                deleteSite.mutate(site.id);
                onBack();
              }}
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Delete Site
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Add Site Dialog ──

function AddSiteDialog() {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [displayName, setDisplayName] = useState("");
  const createSite = useCreateOgaSite();

  function handleCreate() {
    if (!domain.trim() || !displayName.trim()) return;
    createSite.mutate(
      { domain: domain.trim(), displayName: displayName.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setDomain("");
          setDisplayName("");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Site</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs">Domain</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com or app.example.com"
              className="mt-1"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Subdomains will automatically inherit from their root domain unless emancipated.
            </p>
          </div>
          <div>
            <Label className="text-xs">Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Website"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!domain.trim() || !displayName.trim() || createSite.isPending}
            className="w-full"
          >
            {createSite.isPending ? "Creating..." : "Register Site"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──

export default function OgaPage() {
  const { data } = useOgaSites();
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null);

  const sites = data?.sites || [];

  if (selectedSiteId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <SiteDetail
          siteId={selectedSiteId}
          onBack={() => setSelectedSiteId(null)}
        />
      </div>
    );
  }

  // Group sites by root domain
  const rootSites = sites.filter((s) => !s.parentDomain);
  const subSites = sites.filter((s) => !!s.parentDomain);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Online Global Assets</h1>
          <p className="text-sm text-gray-500">
            Centrally manage favicons, logos, login branding, and more for any website.
          </p>
        </div>
        <AddSiteDialog />
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Globe className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No sites registered yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Add a site to start managing its global assets from here.
          </p>
          <AddSiteDialog />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Root domains first */}
          {rootSites.map((site) => {
            const children = subSites.filter(
              (s) => s.parentDomain === site.domain,
            );
            return (
              <div key={site.id}>
                <SiteRow site={site} onClick={() => setSelectedSiteId(site.id)} />
                {children.length > 0 && (
                  <div className="ml-6 border-l-2 border-gray-100 pl-3 space-y-1">
                    {children.map((child) => (
                      <SiteRow
                        key={child.id}
                        site={child}
                        isChild
                        onClick={() => setSelectedSiteId(child.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Orphan subdomains (parent not registered) */}
          {subSites
            .filter((s) => !rootSites.some((r) => r.domain === s.parentDomain))
            .map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                onClick={() => setSelectedSiteId(site.id)}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function SiteRow({
  site,
  isChild,
  onClick,
}: {
  site: OgaSite;
  isChild?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border hover:border-gray-300 hover:bg-gray-50 transition-colors ${
        isChild ? "border-gray-100 bg-white" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Globe className={`h-4 w-4 flex-shrink-0 ${
            site.status === "active" ? "text-green-500" : "text-gray-400"
          }`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">
                {site.displayName}
              </span>
              <StatusBadge status={site.status} />
              {site.emancipated && site.parentDomain && (
                <Badge className="text-[9px] bg-purple-50 text-purple-600">
                  emancipated
                </Badge>
              )}
              {!site.emancipated && site.parentDomain && (
                <Badge className="text-[9px] bg-blue-50 text-blue-500">
                  inherits
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">{site.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>{site.fetchCount} fetches</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}
