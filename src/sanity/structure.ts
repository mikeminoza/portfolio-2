import type { StructureResolver } from "sanity/structure";

/** Profile and Education are singletons; everything else lists normally. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Profile")
        .id("profile")
        .child(S.document().schemaType("profile").documentId("profile")),
      S.divider(),
      S.documentTypeListItem("role").title("Experience"),
      S.documentTypeListItem("project").title("Projects"),
      S.documentTypeListItem("skillGroup").title("Skills"),
      S.divider(),
      S.listItem()
        .title("Education")
        .id("education")
        .child(S.document().schemaType("education").documentId("education")),
    ]);
