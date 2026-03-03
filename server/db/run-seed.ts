import { db } from "./index";
import { projects, aiProviderConfigs } from "../../shared/schema";
import { SEED_PROJECTS, SEED_AI_PROVIDERS } from "./seed";
import { eq } from "drizzle-orm";

async function runSeed() {
  console.log("[seed] Starting...");

  for (const project of SEED_PROJECTS) {
    const existing = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, project.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed] Skipping "${project.slug}" — already exists`);
      continue;
    }

    await db.insert(projects).values(project);
    console.log(`[seed] Created "${project.slug}"`);
  }

  for (const provider of SEED_AI_PROVIDERS) {
    const existing = await db
      .select({ id: aiProviderConfigs.id })
      .from(aiProviderConfigs)
      .where(eq(aiProviderConfigs.slug, provider.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed] Skipping AI provider "${provider.slug}" — already exists`);
      continue;
    }

    await db.insert(aiProviderConfigs).values(provider);
    console.log(`[seed] Created AI provider "${provider.slug}"`);
  }

  console.log("[seed] Done.");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
