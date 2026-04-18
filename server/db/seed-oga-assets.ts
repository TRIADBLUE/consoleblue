/**
 * Seed OGA assets by pointing every asset type at the TRIADBLUE CDN
 * (https://cdn.triadblue.com/brands/<slug>/<file>.png).
 *
 * Files on the CDN are uploaded separately via ~/upload-brand-assets.sh.
 * This script does NOT touch the `assets` table — it only writes URLs
 * into `ogaAssets.value`.
 *
 * Requirements:
 *   - ogaSites rows must already exist (created by create-oga-sites.sql).
 *   - DATABASE_URL env var pointing at the target database.
 *
 * Run:
 *   cd /Users/deanlewis/consoleblue
 *   node --env-file=.env --import tsx server/db/seed-oga-assets.ts
 *
 * Safe to re-run. Existing oga_assets rows are updated in place.
 */
import { db } from "./index";
import { ogaSites, ogaAssets } from "../../shared/schema";
import { eq } from "drizzle-orm";

const CDN_BASE = "https://cdn.triadblue.com/brands";

// Every type in LOGO_IMAGE_TYPES points at <slug>/logo-image.png.
const LOGO_IMAGE_TYPES = [
  "logo-image",
  "logo-image-16px",
  "logo-image-32px",
  "logo-image-48px",
  "logo-image-180px",
  "logo-image-192px",
  "logo-image-512px",
  "logo-image-icon",
  "logo-image-avatar",
];

// Every type in LOCKUP_TYPES points at <slug>/logo-lockup.png, unless the
// brand has a dedicated override file on the CDN (hasLogoText / hasOgImage).
const LOCKUP_TYPES = [
  "logo-full-mark",
  "logo-text",
  "header-logo",
  "header-logo-dark",
  "login-logo",
  "og-image",
];

interface BrandConfig {
  ogaDomain: string;        // matches oga_sites.domain
  cdnSlug: string;          // folder under /var/www/cdn/brands/ on the server
  hasLogoText?: boolean;    // CDN has <slug>/logo-text.png
  hasOgImage?: boolean;     // CDN has <slug>/og-image.png
  themeColor: string;
  loginAccentColor: string;
}

const BRANDS: BrandConfig[] = [
  {
    ogaDomain: "businessblueprint.io",
    cdnSlug: "businessblueprint",
    hasLogoText: true,
    themeColor: "#f97316",
    loginAccentColor: "#f97316",
  },
  {
    ogaDomain: "swipesblue.com",
    cdnSlug: "swipesblue",
    hasOgImage: true,
    themeColor: "#008060",
    loginAccentColor: "#008060",
  },
  {
    ogaDomain: "hostsblue.com",
    cdnSlug: "hostsblue",
    themeColor: "#064A6C",
    loginAccentColor: "#064A6C",
  },
  {
    ogaDomain: "scansblue.com",
    cdnSlug: "scansblue",
    themeColor: "#E00420",
    loginAccentColor: "#E00420",
  },
  {
    ogaDomain: "triadblue.com",
    cdnSlug: "triadblue",
    themeColor: "#09080E",
    loginAccentColor: "#09080E",
  },
  {
    ogaDomain: "console.blue",
    cdnSlug: "consoleblue",
    themeColor: "#FF44CC",
    loginAccentColor: "#FF44CC",
  },
  {
    ogaDomain: "builderblue2.com",
    cdnSlug: "builderblue2",
    themeColor: "#09080E",
    loginAccentColor: "#09080E",
  },
];

async function upsertOgaAsset(
  siteId: number,
  assetType: string,
  value: string,
  mimeType: string | null,
) {
  const existing = await db
    .select()
    .from(ogaAssets)
    .where(eq(ogaAssets.siteId, siteId));
  const match = existing.find((a) => a.assetType === assetType);

  if (match) {
    await db
      .update(ogaAssets)
      .set({ value, mimeType, updatedAt: new Date() })
      .where(eq(ogaAssets.id, match.id));
  } else {
    await db.insert(ogaAssets).values({ siteId, assetType, value, mimeType });
  }
}

async function seedBrand(brand: BrandConfig) {
  console.log(`\n[oga-seed] ${brand.ogaDomain}`);

  const [site] = await db
    .select()
    .from(ogaSites)
    .where(eq(ogaSites.domain, brand.ogaDomain))
    .limit(1);

  if (!site) {
    console.log(
      `  ⚠ No ogaSites row for ${brand.ogaDomain}. ` +
        `Run create-oga-sites.sql first. Skipping.`,
    );
    return;
  }

  const logoUrl = `${CDN_BASE}/${brand.cdnSlug}/logo-image.png`;
  const lockupUrl = `${CDN_BASE}/${brand.cdnSlug}/logo-lockup.png`;

  for (const assetType of LOGO_IMAGE_TYPES) {
    await upsertOgaAsset(site.id, assetType, logoUrl, "image/png");
  }
  console.log(
    `  ✓ Wired ${LOGO_IMAGE_TYPES.length} favicon/avatar types → ${logoUrl}`,
  );

  const lockupSkips = new Set<string>();
  if (brand.hasLogoText) lockupSkips.add("logo-text");
  if (brand.hasOgImage) lockupSkips.add("og-image");

  const lockupAssetTypes = LOCKUP_TYPES.filter((t) => !lockupSkips.has(t));
  for (const assetType of lockupAssetTypes) {
    await upsertOgaAsset(site.id, assetType, lockupUrl, "image/png");
  }
  console.log(
    `  ✓ Wired ${lockupAssetTypes.length} header/lockup types → ${lockupUrl}`,
  );

  if (brand.hasLogoText) {
    const textUrl = `${CDN_BASE}/${brand.cdnSlug}/logo-text.png`;
    await upsertOgaAsset(site.id, "logo-text", textUrl, "image/png");
    console.log(`  ✓ Wired logo-text → ${textUrl}`);
  }

  if (brand.hasOgImage) {
    const ogUrl = `${CDN_BASE}/${brand.cdnSlug}/og-image.png`;
    await upsertOgaAsset(site.id, "og-image", ogUrl, "image/png");
    console.log(`  ✓ Wired og-image → ${ogUrl}`);
  }

  await upsertOgaAsset(site.id, "brand-url", brand.ogaDomain, null);
  await upsertOgaAsset(site.id, "site-name", brand.ogaDomain, null);
  await upsertOgaAsset(site.id, "theme-color", brand.themeColor, null);
  await upsertOgaAsset(
    site.id,
    "login-accent-color",
    brand.loginAccentColor,
    null,
  );
  console.log(`  ✓ Wired 4 text/color types`);
}

async function main() {
  console.log("[oga-seed] Seeding OGA assets → cdn.triadblue.com URLs…");

  for (const brand of BRANDS) {
    try {
      await seedBrand(brand);
    } catch (err: any) {
      console.error(`[oga-seed] ${brand.ogaDomain} FAILED:`, err.message);
    }
  }

  console.log(
    "\n[oga-seed] Done. linkblue.systems has no brand assets yet — add " +
      "/var/www/cdn/brands/linkblue/ on the server + BRANDS entry when ready.",
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[oga-seed] Fatal error:", err);
  process.exit(1);
});
