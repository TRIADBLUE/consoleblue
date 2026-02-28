// ── Asset Registry ──────────────────────────────────────
// Single source of truth for all asset paths.
// All assets live in client/public/assets/ and are served statically.
// No more @assets imports with timestamped Replit filenames.

const BASE = "/assets";

// ── Brand Assets ───────────────────────────────────────
// Each product in the TriadBlue ecosystem has icon + logo

export const BRAND_ASSETS = {
  triadblue: {
    icon: `${BASE}/brands/triadblue/icon.png`,
    logo: `${BASE}/brands/triadblue/logo.png`,
    wordmark: `${BASE}/brands/triadblue/wordmark.png`,
  },
  consoleblue: {
    icon: `${BASE}/brands/consoleblue/icon.png`,
  },
  linkblue: {
    icon: `${BASE}/brands/linkblue/icon.png`,
    logo: `${BASE}/brands/linkblue/logo.png`,
  },
  hostsblue: {
    icon: `${BASE}/brands/hostsblue/icon.png`,
    logo: `${BASE}/brands/hostsblue/logo.png`,
  },
  swipesblue: {
    icon: `${BASE}/brands/swipesblue/icon.png`,
    logo: `${BASE}/brands/swipesblue/logo.png`,
  },
  businessblueprint: {
    icon: `${BASE}/brands/businessblueprint/icon.png`,
    logo: `${BASE}/brands/businessblueprint/logo.png`,
    avatar: `${BASE}/brands/businessblueprint/avatar.png`,
  },
  scansblue: {
    icon: `${BASE}/brands/scansblue/icon.png`,
    logo: `${BASE}/brands/scansblue/logo.png`,
  },
} as const;

// ── Commverse Product Assets ───────────────────────────
// Sub-products within the marketing suite

export const PRODUCT_ASSETS = {
  inbox: {
    icon: `${BASE}/products/inbox/icon.png`,
    logo: `${BASE}/products/inbox/logo.png`,
    logoBlue: `${BASE}/products/inbox/logo-blue.png`,
  },
  send: {
    icon: `${BASE}/products/send/icon.png`,
    logo: `${BASE}/products/send/logo.png`,
    logoBlue: `${BASE}/products/send/logo-blue.png`,
  },
  livechat: {
    icon: `${BASE}/products/livechat/icon.png`,
    logo: `${BASE}/products/livechat/logo.png`,
    logoBlue: `${BASE}/products/livechat/logo-blue.png`,
  },
  content: {
    icon: `${BASE}/products/content/icon.png`,
  },
  commverse: {
    icon: `${BASE}/products/commverse/icon.png`,
  },
} as const;

// ── Service Icons ──────────────────────────────────────
// Icons for individual services/features shown in navigation and dashboards

export const ICON_ASSETS = {
  localSeo: `${BASE}/icons/local-seo.png`,
  reputationMgmt: `${BASE}/icons/reputation-mgmt.png`,
  socialMediaMgmt: `${BASE}/icons/social-media-mgmt.png`,
  aiCoach: `${BASE}/icons/ai-coach.png`,
  digitalAssessment: `${BASE}/icons/digital-assessment.png`,
  settings: `${BASE}/icons/settings.png`,
  captaining: `${BASE}/icons/captaining.png`,
  digitalPath: `${BASE}/icons/digital-path.png`,
} as const;

// ── UI Assets ──────────────────────────────────────────

export const UI_ASSETS = {
  placeholder: `${BASE}/ui/placeholder.svg`,
  loadingSpinner: `${BASE}/ui/loading-spinner.svg`,
} as const;

// ── Helper: Get brand assets by slug ───────────────────

export function getBrandAssets(slug: string) {
  return (
    BRAND_ASSETS[slug as keyof typeof BRAND_ASSETS] ?? {
      icon: UI_ASSETS.placeholder,
      logo: UI_ASSETS.placeholder,
    }
  );
}
