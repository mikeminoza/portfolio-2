import { defineField, defineType } from "sanity";

/** Singleton — the Studio structure exposes exactly one of these. */
export const education = defineType({
  name: "education",
  title: "Education",
  type: "document",
  fields: [
    defineField({
      name: "degree",
      type: "string",
      description: 'Write it out in full, e.g. "Bachelor of Science in Information Systems".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "school",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "period",
      type: "string",
      description: 'e.g. "2021 — 2025".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "honors",
      title: "Honours",
      type: "string",
      description: 'e.g. "Cum Laude". Leave empty to hide.',
    }),
  ],
  preview: {
    select: { title: "degree", subtitle: "school" },
  },
});
