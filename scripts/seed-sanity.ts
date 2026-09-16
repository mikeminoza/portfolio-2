/**
 * Pushes the bundled content into Sanity, plus the project screenshots.
 *
 * Run once after creating the project so the Studio starts populated instead
 * of empty. It reads `SEED` from `lib/content.ts` — the same data the site
 * renders before the CMS is connected — so the two can never disagree.
 *
 *   pnpm seed
 *
 * Idempotent: every document has a stable id and is written with
 * `createOrReplace`, so running it twice changes nothing. That also means it
 * OVERWRITES edits made in the Studio for those documents — it is a seed, not
 * a sync. It refuses to touch a dataset that already has content unless
 * `--force` is passed.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@sanity/client";
import { SEED } from "../src/lib/content";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set. See .env.local.example.");
  process.exit(1);
}

if (!token) {
  console.error(
    [
      "SANITY_API_WRITE_TOKEN is not set.",
      "",
      "Create one at https://sanity.io/manage → API → Tokens, with Editor",
      "permission, and put it in .env.local. It is a write credential: keep it",
      "out of NEXT_PUBLIC_* and out of the client bundle.",
    ].join("\n"),
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-09-01",
  useCdn: false,
});

/** Stable, readable ids so re-running replaces rather than duplicates. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function uploadCover(project: (typeof SEED.projects)[number]) {
  if (!project.staticCover) return undefined;

  const file = path.join(process.cwd(), "public", project.staticCover.src);
  try {
    const asset = await client.assets.upload("image", await readFile(file), {
      filename: path.basename(file),
    });
    return {
      _type: "image" as const,
      asset: { _type: "reference" as const, _ref: asset._id },
      alt: project.staticCover.alt,
    };
  } catch (error) {
    // A missing screenshot shouldn't abort the whole seed — the site falls
    // back to the checked-in file anyway.
    console.warn(`  ! cover skipped for ${project.slug}: ${String(error)}`);
    return undefined;
  }
}

async function main() {
  const force = process.argv.includes("--force");

  const existing = await client.fetch<number>(
    `count(*[_type in ["profile","role","project","skillGroup","education"]])`,
  );

  if (existing > 0 && !force) {
    console.error(
      `Dataset "${dataset}" already has ${existing} document(s).\n` +
        "Re-run with --force to overwrite them:  pnpm seed -- --force",
    );
    process.exit(1);
  }

  console.log(`Seeding ${projectId}/${dataset}…`);

  const documents: Record<string, unknown>[] = [
    { _id: "profile", _type: "profile", ...SEED.profile },
    { _id: "education", _type: "education", ...SEED.education },
  ];

  SEED.experience.forEach((role, index) => {
    documents.push({
      _id: `role-${slugify(role.company)}`,
      _type: "role",
      ...role,
      order: index,
    });
  });

  SEED.skills.forEach((group, index) => {
    documents.push({
      _id: `skill-${slugify(group.title)}`,
      _type: "skillGroup",
      ...group,
      order: index,
    });
  });

  for (const [index, project] of SEED.projects.entries()) {
    const cover = await uploadCover(project);

    // Listed field by field rather than spread: `staticCover` is a code-side
    // fallback, not a CMS field, and spreading would quietly push it.
    documents.push({
      _id: `project-${project.slug}`,
      _type: "project",
      title: project.title,
      slug: { _type: "slug", current: project.slug },
      summary: project.summary,
      year: project.year,
      role: project.role,
      kind: project.kind,
      stack: project.stack,
      order: index,
      ...(project.repo ? { repo: project.repo } : {}),
      ...(project.demo ? { demo: project.demo } : {}),
      ...(cover ? { cover } : {}),
    });
  }

  const transaction = documents.reduce(
    (tx, doc) => tx.createOrReplace(doc as never),
    client.transaction(),
  );

  await transaction.commit();

  console.log(`✓ ${documents.length} documents written`);
  for (const doc of documents) console.log(`  · ${doc._id as string}`);
  console.log("\nOpen /studio to review, then publish.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
