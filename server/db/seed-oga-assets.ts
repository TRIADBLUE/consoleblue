/**
 * Seed OGA assets from GitHub repos.
 * Run on Replit: npx tsx server/db/seed-oga-assets.ts
 */
import { db } from "./index";
import { assets, ogaSites, ogaAssets } from "../../shared/schema";
import { eq } from "drizzle-orm";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/TRIADBLUE";

interface AssetMapping {
  assetType: string;
  repo: string;
  path: string;
  mimeType: string;
}

const SITE_ASSETS: Record<string, AssetMapping[]> = {
  "businessblueprint.io": [
    // Brand Identity
    { assetType: "logo-full-mark", repo: "businessblueprint", path: "attached_assets/images_logos/bb-header-logo.png", mimeType: "image/png" },
    { assetType: "logo-image", repo: "businessblueprint", path: "attached_assets/images_logos/bb-logo-only.png", mimeType: "image/png" },
    { assetType: "logo-text", repo: "businessblueprint", path: "attached_assets/images_logos/bb-header-logo.png", mimeType: "image/png" },
    // Browser Assets
    { assetType: "logo-image-16px", repo: "businessblueprint", path: "attached_assets/images_logos/bb-favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-32px", repo: "businessblueprint", path: "attached_assets/images_logos/bb-favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-48px", repo: "businessblueprint", path: "attached_assets/images_logos/bb-favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-180px", repo: "businessblueprint", path: "client/public/apple-touch-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-192px", repo: "businessblueprint", path: "client/public/favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-512px", repo: "businessblueprint", path: "client/public/favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-icon", repo: "businessblueprint", path: "attached_assets/images_logos/bb-favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-avatar", repo: "businessblueprint", path: "attached_assets/images_logos/bb-logo-only.png", mimeType: "image/png" },
    // Header & Navigation
    { assetType: "header-logo", repo: "businessblueprint", path: "attached_assets/images_logos/bb-header-logo.png", mimeType: "image/png" },
    { assetType: "header-logo-dark", repo: "businessblueprint", path: "attached_assets/images_logos/bb-header-logo.png", mimeType: "image/png" },
    // Login & Auth
    { assetType: "login-logo", repo: "businessblueprint", path: "attached_assets/images_logos/bb-header-logo.png", mimeType: "image/png" },
    // Social & SEO
    { assetType: "og-image", repo: "businessblueprint", path: "attached_assets/images_logos/bb-header-logo.png", mimeType: "image/png" },
  ],

  "swipesblue.com": [
    // Brand Identity
    { assetType: "logo-full-mark", repo: "swipesblue", path: "client/public/images/logos/swipesblue-logo-url.png", mimeType: "image/png" },
    { assetType: "logo-image", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-text", repo: "swipesblue", path: "client/public/images/logos/swipesblue_logo_image_and_text_as_url.png", mimeType: "image/png" },
    // Browser Assets
    { assetType: "logo-image-16px", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-32px", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-48px", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-180px", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-192px", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-512px", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-icon", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    { assetType: "logo-image-avatar", repo: "swipesblue", path: "client/public/images/logos/swipesblue-icon.png", mimeType: "image/png" },
    // Header & Navigation
    { assetType: "header-logo", repo: "swipesblue", path: "client/public/images/logos/swipesblue-logo-url.png", mimeType: "image/png" },
    { assetType: "header-logo-dark", repo: "swipesblue", path: "client/public/images/logos/swipesblue-logo-url.png", mimeType: "image/png" },
    // Login & Auth
    { assetType: "login-logo", repo: "swipesblue", path: "client/public/images/logos/swipesblue-logo-url.png", mimeType: "image/png" },
    // Social & SEO
    { assetType: "og-image", repo: "swipesblue", path: "client/public/images/logos/swipesblue-logo-url.png", mimeType: "image/png" },
  ],

  "hostsblue.com": [
    // Brand Identity
    { assetType: "logo-full-mark", repo: "hostsblue", path: "public/hostsblue_logo_image_and_text_as_url.png", mimeType: "image/png" },
    { assetType: "logo-image", repo: "hostsblue", path: "public/HostsBlue_Logo_Image_Trans.png", mimeType: "image/png" },
    { assetType: "logo-text", repo: "hostsblue", path: "public/HostsBlue_Logo_text.png", mimeType: "image/png" },
    // Browser Assets
    { assetType: "logo-image-16px", repo: "hostsblue", path: "public/hostsblue_web_browser_favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-32px", repo: "hostsblue", path: "public/hostsblue_web_browser_favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-48px", repo: "hostsblue", path: "public/hostsblue_web_browser_favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-180px", repo: "hostsblue", path: "public/HostsBlue_Logo_Image_Trans.png", mimeType: "image/png" },
    { assetType: "logo-image-192px", repo: "hostsblue", path: "public/HostsBlue_Logo_Image_Trans.png", mimeType: "image/png" },
    { assetType: "logo-image-512px", repo: "hostsblue", path: "public/HostsBlue_Logo_Image_Trans.png", mimeType: "image/png" },
    { assetType: "logo-image-icon", repo: "hostsblue", path: "public/hostsblue_web_browser_favicon.png", mimeType: "image/png" },
    { assetType: "logo-image-avatar", repo: "hostsblue", path: "public/hostsblue_logo_image.png", mimeType: "image/png" },
    // Header & Navigation
    { assetType: "header-logo", repo: "hostsblue", path: "public/hostsblue_logo_image_and_text_as_url.png", mimeType: "image/png" },
    { assetType: "header-logo-dark", repo: "hostsblue", path: "public/hostsblue_logo_image_and_text_as_url.png", mimeType: "image/png" },
    // Login & Auth
    { assetType: "login-logo", repo: "hostsblue", path: "public/hostsblue_logo_image_and_text_as_url.png", mimeType: "image/png" },
    // Social & SEO
    { assetType: "og-image", repo: "hostsblue", path: "public/HostsBlue_Logo_text_and_image.png", mimeType: "image/png" },
  ],
};

// Text/color assets (no file download needed)
const SITE_TEXT_ASSETS: Record<string, { assetType: string; value: string }[]> = {
  "businessblueprint.io": [
    { assetType: "brand-url", value: "businessblueprint.io" },
    { assetType: "site-name", value: "businessblueprint.io" },
    { assetType: "theme-color", value: "#f97316" },
    { assetType: "login-accent-color", value: "#f97316" },
  ],
  "swipesblue.com": [
    { assetType: "brand-url", value: "swipesblue.com" },
    { assetType: "site-name", value: "swipesblue.com" },
    { assetType: "theme-color", value: "#008060" },
    { assetType: "login-accent-color", value: "#008060" },
  ],
  "hostsblue.com": [
    { assetType: "brand-url", value: "hostsblue.com" },
    { assetType: "site-name", value: "hostsblue.com" },
    { assetType: "theme-color", value: "#064A6C" },
    { assetType: "login-accent-color", value: "#064A6C" },
  ],
};

async function fetchImage(repo: string, filePath: string): Promise<Buffer> {
  const url = `${GITHUB_RAW_BASE}/${repo}/main/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`;
  console.log(`  Fetching: ${repo}/${filePath}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function seedSiteAssets(domain: string) {
  // Find the OGA site
  const [site] = await db
    .select()
    .from(ogaSites)
    .where(eq(ogaSites.domain, domain))
    .limit(1);

  if (!site) {
    console.log(`[oga-seed] Site "${domain}" not found in OGA — skipping`);
    return;
  }

  console.log(`\n[oga-seed] Seeding ${domain} (site ID: ${site.id})`);

  // Upload image assets
  const imageAssets = SITE_ASSETS[domain] || [];
  for (const mapping of imageAssets) {
    try {
      const buffer = await fetchImage(mapping.repo, mapping.path);
      const filename = mapping.path.split("/").pop() || "asset.png";

      // Insert into assets table (stores binary in DB)
      const [asset] = await db
        .insert(assets)
        .values({
          filename,
          mimeType: mapping.mimeType,
          sizeBytes: buffer.length,
          data: buffer,
          category: "icon" as any,
        })
        .returning();

      // Build the asset URL
      const origin = process.env.FRONTEND_URL || "https://console.blue";
      const assetUrl = `${origin}/api/assets/file/${asset.id}`;

      // Upsert into OGA assets
      const existing = await db
        .select()
        .from(ogaAssets)
        .where(
          eq(ogaAssets.siteId, site.id),
        );

      const existingAsset = existing.find(a => a.assetType === mapping.assetType);
      if (existingAsset) {
        await db
          .update(ogaAssets)
          .set({ value: assetUrl, mimeType: mapping.mimeType, updatedAt: new Date() })
          .where(eq(ogaAssets.id, existingAsset.id));
        console.log(`  Updated: ${mapping.assetType} → asset #${asset.id}`);
      } else {
        await db.insert(ogaAssets).values({
          siteId: site.id,
          assetType: mapping.assetType,
          value: assetUrl,
          mimeType: mapping.mimeType,
        });
        console.log(`  Created: ${mapping.assetType} → asset #${asset.id}`);
      }
    } catch (err: any) {
      console.error(`  FAILED: ${mapping.assetType} — ${err.message}`);
    }
  }

  // Set text/color assets
  const textAssets = SITE_TEXT_ASSETS[domain] || [];
  for (const ta of textAssets) {
    const existing = await db
      .select()
      .from(ogaAssets)
      .where(eq(ogaAssets.siteId, site.id));

    const existingAsset = existing.find(a => a.assetType === ta.assetType);
    if (existingAsset) {
      await db
        .update(ogaAssets)
        .set({ value: ta.value, updatedAt: new Date() })
        .where(eq(ogaAssets.id, existingAsset.id));
      console.log(`  Updated: ${ta.assetType} → ${ta.value}`);
    } else {
      await db.insert(ogaAssets).values({
        siteId: site.id,
        assetType: ta.assetType,
        value: ta.value,
      });
      console.log(`  Created: ${ta.assetType} → ${ta.value}`);
    }
  }

  console.log(`[oga-seed] Done: ${domain}`);
}

async function main() {
  console.log("[oga-seed] Starting OGA asset seeding...\n");

  for (const domain of Object.keys(SITE_ASSETS)) {
    await seedSiteAssets(domain);
  }

  console.log("\n[oga-seed] All sites seeded.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[oga-seed] Fatal error:", err);
  process.exit(1);
});
