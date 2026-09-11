import { defineField, defineType } from "sanity";

/** Singleton — the Studio structure exposes exactly one of these. */
export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Role",
      type: "string",
      description: 'Shown above the headline, e.g. "Backend Web Developer".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "array",
      of: [{ type: "text", rows: 3 }],
      description: "One entry per paragraph. Two is usually plenty.",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "email",
      type: "string",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "location",
      type: "string",
      description: 'e.g. "Cebu City, Philippines".',
    }),
    defineField({
      name: "socials",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "href",
              type: "url",
              validation: (rule) =>
                rule.required().uri({ scheme: ["http", "https", "mailto"] }),
            }),
          ],
          preview: { select: { title: "label", subtitle: "href" } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "title" },
  },
});
