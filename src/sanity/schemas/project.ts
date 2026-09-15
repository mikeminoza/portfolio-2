import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 3,
      description: "Two sentences. What it is and what was hard about it.",
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: "cover",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "year",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      type: "string",
      options: {
        list: ["Full-stack", "Frontend", "Backend", "Design + build"],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Project kind",
      type: "string",
      description: "Shipped for an employer or client, or built on his own time.",
      options: {
        list: [
          { title: "Professional", value: "professional" },
          { title: "Personal", value: "personal" },
        ],
        layout: "radio",
      },
      initialValue: "personal",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "stack",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "repo",
      title: "Repository URL",
      type: "url",
    }),
    defineField({
      name: "demo",
      title: "Live demo URL",
      type: "url",
      description: "Leave empty if there is nothing deployed to link to.",
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first.",
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
    select: { title: "title", subtitle: "year", media: "cover" },
  },
});
