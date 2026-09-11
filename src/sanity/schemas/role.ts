import { defineField, defineType } from "sanity";

export const role = defineType({
  name: "role",
  title: "Experience",
  type: "document",
  fields: [
    defineField({
      name: "company",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Job title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "period",
      type: "string",
      description: 'e.g. "Nov 2025 — Present".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "employment",
      type: "string",
      options: { list: ["Full time", "Part time", "Contract", "Internship"] },
    }),
    defineField({
      name: "highlights",
      type: "array",
      of: [{ type: "text", rows: 2 }],
      description: "One entry per bullet. Lead with the verb.",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first. Most recent role first.",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Sort order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "company", subtitle: "period" },
  },
});
