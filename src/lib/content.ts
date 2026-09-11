import type { SanityImageSource } from "@sanity/image-url";
import { getClient } from "@/sanity/client";
import { isSanityConfigured } from "@/sanity/env";
import {
  educationQuery,
  experienceQuery,
  profileQuery,
  projectsQuery,
  skillsQuery,
} from "@/sanity/queries";

export type Cover = SanityImageSource & { alt?: string };

export type Profile = {
  name: string;
  title: string;
  intro: string[];
  email: string;
  location: string;
  socials: { label: string; href: string }[];
};

export type Role = {
  company: string;
  title: string;
  period: string;
  employment: string;
  highlights: string[];
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: string;
  role: string;
  stack: string[];
  repo?: string;
  demo?: string;
  cover?: Cover | null;
};

export type SkillGroup = {
  title: string;
  items: string[];
};

export type Education = {
  degree: string;
  school: string;
  period: string;
  honors?: string;
};

/**
 * Seed content, taken from the CV. Used until a Sanity project is configured,
 * and as a fallback if the dataset is reachable but empty — so the site never
 * renders blank.
 */
const fallbackProfile: Profile = {
  name: "Mike Arthur Miñoza",
  title: "Backend Web Developer",
  intro: [
    "I build and maintain PHP and Laravel applications on MySQL, and wire their APIs into React, Vue and Next.js frontends.",
    "Currently at Glophics, working on Musticker — a Korea-based custom sticker platform preparing for global expansion.",
  ],
  email: "mikearthurminoza@gmail.com",
  location: "Cebu City, Philippines",
  socials: [
    { label: "GitHub", href: "https://github.com/mikeminoza" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/mike-arthur-mi%C3%B1oza",
    },
    { label: "Email", href: "mailto:mikearthurminoza@gmail.com" },
  ],
};

const fallbackExperience: Role[] = [
  {
    company: "Glophics",
    title: "Backend Web Developer",
    period: "Nov 2025 — Present",
    employment: "Full time",
    highlights: [
      "Develops and maintains backend services in PHP, Laravel and Nuxt.js, applying MVC and OOP principles.",
      "Contributes to Musticker, a Korea-based e-commerce platform for custom stickers with plans for global expansion.",
      "Designs and enhances backend features, APIs and database interactions to improve reliability, scalability and performance.",
      "Integrates API features with the frontend and works with frontend developers to resolve technical issues.",
      "Handles debugging, troubleshooting and performance optimisation, and writes the technical documentation that goes with it.",
      "Uses Claude Code for AI-assisted development and Jira for sprint planning.",
    ],
  },
  {
    company: "Applus Velosi Philippines",
    title: "Full Stack Developer",
    period: "Feb 2025 — May 2025",
    employment: "Internship",
    highlights: [
      "Built the core job posting features and REST APIs in Laravel.",
      "Tested and documented REST APIs with Postman, validating request and response accuracy.",
      "Led a team of interns as Project Manager for the Job Posting System.",
      "Designed a responsive frontend in Next.js, and reviewed code alongside usability and performance testing.",
    ],
  },
];

const fallbackProjects: Project[] = [
  {
    slug: "trackle",
    title: "Trackle",
    summary:
      "A financial tracking app with automated insights and an integrated assistant, built to make personal spending legible rather than just logged.",
    year: "2025",
    role: "Full-stack",
    stack: ["Next.js", "TypeScript", "Supabase", "Gemini AI"],
    repo: "https://github.com/mikeminoza/Trackle",
    demo: "https://trackle-web.vercel.app",
  },
  {
    slug: "sparkquiz",
    title: "SparkQuiz",
    summary:
      "A multiple-choice quiz generator that turns source material into a reviewable question set, with management for the quizzes it creates.",
    year: "2025",
    role: "Full-stack",
    stack: ["Next.js", "React", "Supabase", "Gemini AI"],
    repo: "https://github.com/mikeminoza/SparkQuiz",
    demo: "https://spark-quiz-phi.vercel.app",
  },
  {
    slug: "mednexus",
    title: "MedNexus",
    summary:
      "A school clinic management system handling appointments and medical documents for students and employees.",
    year: "2024",
    role: "Full-stack",
    stack: ["Laravel", "PHP", "MySQL", "Bootstrap"],
    repo: "https://github.com/mikeminoza/MedNexus",
  },
];

const fallbackSkills: SkillGroup[] = [
  {
    title: "Languages",
    items: ["PHP", "JavaScript", "TypeScript", "Python", "Java", "C", "HTML", "CSS"],
  },
  {
    title: "Frameworks & libraries",
    items: [
      "Laravel",
      "React",
      "Next.js",
      "Vue.js",
      "Nuxt.js",
      "Tailwind CSS",
      "Bootstrap",
    ],
  },
  {
    title: "Database & backend",
    items: [
      "MySQL",
      "PostgreSQL",
      "Supabase",
      "RESTful APIs",
      "Eloquent ORM",
      "Microservices",
    ],
  },
  {
    title: "Tools",
    items: [
      "Git",
      "GitHub",
      "Docker",
      "Postman",
      "Composer",
      "Vite",
      "Figma",
      "Claude Code",
      "Jira",
    ],
  },
  {
    title: "Practices",
    items: ["MVC architecture", "OOP", "Agile", "API design", "CRUD"],
  },
];

const fallbackEducation: Education = {
  degree: "Bachelor of Science in Information Systems",
  school: "Cebu Technological University — Main Campus",
  period: "2021 — 2025",
  honors: "Cum Laude",
};

/** Revalidate published content every minute. */
const fetchOptions = { next: { revalidate: 60 } } as const;

/**
 * Shape of the raw GROQ results. Everything is optional because a Studio
 * document can be saved half-filled.
 *
 * Once a Sanity project exists, `pnpm typegen` replaces these with types
 * generated from the real schema.
 */
type ProfileResult = {
  name?: string;
  title?: string;
  intro?: (string | null)[] | null;
  email?: string;
  location?: string;
  socials?: ({ label?: string; href?: string } | null)[] | null;
} | null;

type RoleResult = {
  company?: string;
  title?: string;
  period?: string;
  employment?: string;
  highlights?: (string | null)[] | null;
};

type ProjectResult = {
  slug?: string;
  title?: string;
  summary?: string;
  year?: string;
  role?: string;
  stack?: (string | null)[] | null;
  repo?: string | null;
  demo?: string | null;
  cover?: Cover | null;
};

type SkillGroupResult = {
  title?: string;
  items?: (string | null)[] | null;
};

type EducationResult = {
  degree?: string;
  school?: string;
  period?: string;
  honors?: string | null;
} | null;

const strings = (value: (string | null)[] | null | undefined): string[] =>
  (value ?? []).filter((item): item is string => typeof item === "string");

export async function getProfile(): Promise<Profile> {
  if (!isSanityConfigured) return fallbackProfile;

  const profile = await getClient().fetch<ProfileResult>(
    profileQuery,
    {},
    fetchOptions,
  );
  if (!profile?.name) return fallbackProfile;

  const intro = strings(profile.intro);

  return {
    name: profile.name,
    title: profile.title ?? fallbackProfile.title,
    intro: intro.length ? intro : fallbackProfile.intro,
    email: profile.email ?? fallbackProfile.email,
    location: profile.location ?? fallbackProfile.location,
    socials: (profile.socials ?? [])
      .filter((s): s is { label: string; href: string } =>
        Boolean(s?.label && s?.href),
      )
      .map(({ label, href }) => ({ label, href })),
  };
}

export async function getExperience(): Promise<Role[]> {
  if (!isSanityConfigured) return fallbackExperience;

  const roles = await getClient().fetch<RoleResult[]>(
    experienceQuery,
    {},
    fetchOptions,
  );
  if (!roles?.length) return fallbackExperience;

  return roles.map((r) => ({
    company: r.company ?? "",
    title: r.title ?? "",
    period: r.period ?? "",
    employment: r.employment ?? "",
    highlights: strings(r.highlights),
  }));
}

export async function getProjects(): Promise<Project[]> {
  if (!isSanityConfigured) return fallbackProjects;

  const projects = await getClient().fetch<ProjectResult[]>(
    projectsQuery,
    {},
    fetchOptions,
  );
  if (!projects?.length) return fallbackProjects;

  return projects.map((p) => ({
    slug: p.slug ?? "",
    title: p.title ?? "Untitled",
    summary: p.summary ?? "",
    year: p.year ?? "",
    role: p.role ?? "",
    stack: strings(p.stack),
    repo: p.repo ?? undefined,
    demo: p.demo ?? undefined,
    cover: p.cover ?? null,
  }));
}

export async function getSkills(): Promise<SkillGroup[]> {
  if (!isSanityConfigured) return fallbackSkills;

  const groups = await getClient().fetch<SkillGroupResult[]>(
    skillsQuery,
    {},
    fetchOptions,
  );
  if (!groups?.length) return fallbackSkills;

  return groups.map((g) => ({
    title: g.title ?? "",
    items: strings(g.items),
  }));
}

export async function getEducation(): Promise<Education> {
  if (!isSanityConfigured) return fallbackEducation;

  const education = await getClient().fetch<EducationResult>(
    educationQuery,
    {},
    fetchOptions,
  );
  if (!education?.degree) return fallbackEducation;

  return {
    degree: education.degree,
    school: education.school ?? fallbackEducation.school,
    period: education.period ?? fallbackEducation.period,
    honors: education.honors ?? undefined,
  };
}
