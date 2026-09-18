import type {
  Education,
  Profile,
  Project,
  Role,
  SkillGroup,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

/**
 * Everything search engines read that isn't already on the page: the meta
 * description and the JSON-LD graph. Both are derived from the same CMS
 * content the page renders, so they cannot drift from the CV.
 */

/**
 * Search engines cut descriptions around here. Clamping on a word boundary
 * keeps a long CMS intro from being sliced mid-word.
 */
const DESCRIPTION_LIMIT = 160;

/**
 * The meta description, derived from the CMS.
 *
 * The name and role already carry the title tag, so this is the intro alone —
 * a complete sentence rather than a truncated restatement of the title.
 * Shared with the JSON-LD so the two can never disagree.
 */
export function metaDescription(profile: Profile): string {
  const text = profile.intro[0] ?? "";
  if (text.length <= DESCRIPTION_LIMIT) return text;

  const cut = text.slice(0, DESCRIPTION_LIMIT);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

const PERSON_ID = absoluteUrl("/#person");
const WEBSITE_ID = absoluteUrl("/#website");
const PAGE_ID = absoluteUrl("/#webpage");

/** Next serves the generated card here; `primaryImageOfPage` wants it absolute. */
const OG_IMAGE = absoluteUrl("/opengraph-image");

/**
 * "Cebu City, Philippines" -> a PostalAddress. Anything that doesn't split
 * into two parts is left as the locality alone rather than guessed at.
 */
function toAddress(location: string) {
  const [addressLocality, addressCountry] = location
    .split(",")
    .map((part) => part.trim());

  return {
    "@type": "PostalAddress",
    addressLocality,
    ...(addressCountry ? { addressCountry } : {}),
  };
}

/**
 * Profile links that identify the same person elsewhere. `mailto:` is an
 * email, not a profile, so it's filtered out — `sameAs` is specifically for
 * resolvable identity URLs.
 */
function toSameAs(socials: Profile["socials"]): string[] {
  return socials
    .map((social) => social.href)
    .filter((href) => href.startsWith("http"));
}

/**
 * The employer to publish, or none.
 *
 * Only a role that says it is ongoing counts — listing a past employer as
 * current would be a factual claim the CV doesn't make.
 */
function toCurrentEmployer(roles: Role[]) {
  const current = roles.find((role) => /present/i.test(role.period));
  if (!current) return {};

  return {
    worksFor: { "@type": "Organization", name: current.company },
  };
}

function toAlumniOf(education: Education) {
  return {
    alumniOf: {
      "@type": "EducationalOrganization",
      name: education.school,
    },
  };
}

/**
 * `year` is display copy — "2024", but also "2025 — Present". schema.org wants
 * ISO 8601, and a bare year qualifies, so pull the first one out and emit
 * nothing when there isn't one rather than publishing an unparseable date.
 */
function toDateCreated(year: string) {
  const match = year.match(/\d{4}/);
  return match ? { dateCreated: match[0] } : {};
}

/**
 * Each shipped project, credited to the person who built it.
 *
 * Typed as `SoftwareSourceCode` when there's a repo to point at — that's the
 * type that actually has `codeRepository` — and plain `CreativeWork` when the
 * work is only a deployed product.
 */
function toProjects(projects: Project[]) {
  return projects.map((project) => ({
    "@type": project.repo ? "SoftwareSourceCode" : "CreativeWork",
    "@id": absoluteUrl(`/#project-${project.slug}`),
    name: project.title,
    description: project.summary,
    creator: { "@id": PERSON_ID },
    keywords: project.stack.join(", "),
    ...toDateCreated(project.year),
    ...(project.demo ? { url: project.demo } : {}),
    ...(project.repo
      ? { codeRepository: project.repo, programmingLanguage: project.stack }
      : {}),
  }));
}

/**
 * JSON-LD for the home page.
 *
 * A portfolio's real search surface isn't keywords — it's whether Google can
 * tell that the page *is a person*, what they do, and which accounts are the
 * same person. That is what a `Person` node with `sameAs` buys, and it is what
 * feeds knowledge panels and the "people also search for" rail.
 *
 * Emitted as one `@graph` with stable `@id`s so the nodes reference each
 * other instead of repeating themselves.
 */
export function buildStructuredData({
  profile,
  roles,
  projects,
  skills,
  education,
  description,
}: {
  profile: Profile;
  roles: Role[];
  projects: Project[];
  skills: SkillGroup[];
  education: Education;
  description: string;
}) {
  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    url: absoluteUrl("/"),
    jobTitle: profile.title,
    description,
    email: profile.email,
    address: toAddress(profile.location),
    sameAs: toSameAs(profile.socials),
    knowsAbout: skills.flatMap((group) => group.items),
    hasOccupation: {
      "@type": "Occupation",
      name: profile.title,
    },
    ...toCurrentEmployer(roles),
    ...toAlumniOf(education),
  };

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: `${profile.name} — ${profile.title}`,
    description,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
  };

  // ProfilePage rather than WebPage: this page is *about* a person, which is
  // the distinction Google uses to attach the Person node to the result.
  const page = {
    "@type": "ProfilePage",
    "@id": PAGE_ID,
    url: absoluteUrl("/"),
    name: `${profile.name} — ${profile.title}`,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    primaryImageOfPage: OG_IMAGE,
    inLanguage: "en",
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      website,
      page,
      ...toProjects(projects),
    ],
  };
}
