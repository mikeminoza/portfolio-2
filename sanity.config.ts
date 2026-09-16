"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { schemaTypes } from "@/sanity/schemas";
import { structure } from "@/sanity/structure";

/**
 * Types the site reads with `[0]` — exactly one document each.
 *
 * The desk structure points at a fixed document id for these, but that alone
 * only controls navigation: without the two filters below an editor can still
 * create a second Profile from the global "create" menu, and the site would
 * then silently render whichever one the query happened to return first.
 */
const SINGLETONS = new Set(["profile", "education"]);

/** Actions that still make sense on a document that can't be duplicated. */
const SINGLETON_ACTIONS = new Set([
  "publish",
  "discardChanges",
  "restore",
  "unpublish",
]);

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
    // Keeps singletons out of "create new".
    templates: (templates) =>
      templates.filter(({ schemaType }) => !SINGLETONS.has(schemaType)),
  },
  document: {
    // Removes duplicate and delete from the singletons themselves.
    actions: (actions, context) =>
      SINGLETONS.has(context.schemaType)
        ? actions.filter(
            ({ action }) => action && SINGLETON_ACTIONS.has(action),
          )
        : actions,
  },
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
