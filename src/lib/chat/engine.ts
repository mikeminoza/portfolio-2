import type {
  Education,
  Profile,
  Project,
  Role,
  SkillGroup,
} from "@/lib/content";

/**
 * Scripted answer engine.
 *
 * Every answer is derived from the same content the page renders, so the
 * assistant can't drift from the CV — if a project is added in the CMS, it
 * starts answering about it with no code change.
 *
 * Kept as the fallback now that Gemini answers by default: it runs with no
 * key, no network and no cost, so the assistant still works when the API is
 * unavailable, unconfigured, or rate-limited.
 */

export type ChatContext = {
  profile: Profile;
  roles: Role[];
  projects: Project[];
  skills: SkillGroup[];
  education: Education;
};

export type ChatAnswer = {
  text: string;
  /** Follow-ups offered alongside the answer. */
  suggestions: string[];
};

/** Lowercase, strip punctuation, collapse whitespace. */
function normalize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\w\s+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Next.js" and "nextjs" and "next js" should all match each other. */
function slug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export const OPENING_SUGGESTIONS = [
  "What does he do?",
  "Where does he work?",
  "Show me his projects",
  "Does he know Laravel?",
  "How do I get in touch?",
];

/** Every technology mentioned anywhere, mapped slug -> canonical label. */
function techIndex(ctx: ChatContext) {
  const index = new Map<string, string>();
  for (const group of ctx.skills) {
    for (const item of group.items) index.set(slug(item), item);
  }
  for (const project of ctx.projects) {
    for (const item of project.stack) index.set(slug(item), item);
  }
  return index;
}

/** Where a given technology actually shows up. */
function techAnswer(ctx: ChatContext, label: string): ChatAnswer {
  const target = slug(label);

  const group = ctx.skills.find((g) =>
    g.items.some((item) => slug(item) === target),
  );
  const projects = ctx.projects.filter((p) =>
    p.stack.some((item) => slug(item) === target),
  );
  const roles = ctx.roles.filter(
    (r) =>
      slug(r.highlights.join(" ")).includes(target) ||
      slug(r.title).includes(target),
  );

  const parts: string[] = [];

  if (group) {
    parts.push(`Yes — ${label} is part of his ${group.title.toLowerCase()}.`);
  } else {
    parts.push(`${label} shows up in his work.`);
  }

  if (roles.length) {
    parts.push(
      `He uses it professionally at ${list(roles.map((r) => r.company))}.`,
    );
  }

  if (projects.length) {
    parts.push(
      `It's also in ${list(projects.map((p) => p.title))}.`,
    );
  }

  return {
    text: parts.join(" "),
    suggestions: projects.length
      ? [`Tell me about ${projects[0].title}`, "What else does he use?"]
      : ["Show me his projects", "What's his stack?"],
  };
}

/** A named project, if the query mentions one. */
function projectAnswer(ctx: ChatContext, project: Project): ChatAnswer {
  const links = [
    project.demo ? `Live: ${project.demo}` : null,
    project.repo ? `Code: ${project.repo}` : null,
  ].filter(Boolean);

  return {
    text: [
      `${project.title} — ${project.kind === "professional" ? "professional work" : "a personal project"} (${project.year}, ${project.role}).`,
      project.summary,
      `Built with ${list(project.stack)}.`,
      links.join("  ·  "),
    ]
      .filter(Boolean)
      .join("\n\n"),
    suggestions: ctx.projects
      .filter((p) => p.slug !== project.slug)
      .slice(0, 2)
      .map((p) => `Tell me about ${p.title}`)
      .concat("How do I get in touch?"),
  };
}

type Intent = {
  id: string;
  keywords: string[];
  build: (ctx: ChatContext) => ChatAnswer;
};

const INTENTS: Intent[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "yo", "good morning", "good evening"],
    build: (ctx) => ({
      text: `Hi — I answer questions about ${ctx.profile.name}. Ask about his experience, projects, stack or how to reach him.`,
      suggestions: OPENING_SUGGESTIONS.slice(0, 3),
    }),
  },
  {
    id: "identity",
    keywords: [
      "who",
      "about",
      "what does he do",
      "summary",
      "introduce",
      "tell me about him",
      "bio",
    ],
    build: (ctx) => ({
      // The intro is authored in the first person for the hero, so quote it
      // rather than splicing it into this third-person sentence.
      text: `${ctx.profile.name} is a ${ctx.profile.title.toLowerCase()} based in ${ctx.profile.location}.\n\nIn his words:\n\n${ctx.profile.intro
        .map((line) => `“${line}”`)
        .join("\n\n")}`,
      suggestions: ["Where does he work?", "What's his stack?", "Show me his projects"],
    }),
  },
  {
    id: "experience",
    keywords: [
      "experience",
      "work",
      "job",
      "role",
      "company",
      "employer",
      "career",
      "currently",
      "where does he work",
      "glophics",
      "intern",
      "internship",
    ],
    build: (ctx) => {
      const [current, ...past] = ctx.roles;
      if (!current) {
        return { text: "No experience listed yet.", suggestions: OPENING_SUGGESTIONS.slice(0, 3) };
      }

      const lines = [
        `Currently ${current.title} at ${current.company} (${current.period}, ${current.employment.toLowerCase()}).`,
        current.highlights[0],
      ];

      if (past.length) {
        lines.push(
          `Before that: ${list(past.map((r) => `${r.title} at ${r.company} (${r.period})`))}.`,
        );
      }

      return {
        text: lines.filter(Boolean).join("\n\n"),
        suggestions: ["What does he do at Glophics?", "Show me his projects", "What's his stack?"],
      };
    },
  },
  {
    id: "current-detail",
    keywords: ["what does he do at", "day to day", "responsibilities", "musticker"],
    build: (ctx) => {
      const current = ctx.roles[0];
      if (!current) {
        return { text: "No current role listed.", suggestions: OPENING_SUGGESTIONS.slice(0, 3) };
      }
      return {
        text: `At ${current.company} he:\n\n${current.highlights.map((h) => `— ${h}`).join("\n")}`,
        suggestions: ["What's his stack?", "Show me his projects", "How do I get in touch?"],
      };
    },
  },
  {
    id: "projects",
    keywords: [
      "project",
      "projects",
      "portfolio",
      "built",
      "build",
      "made",
      "side project",
      "show me",
    ],
    build: (ctx) => ({
      text: `He has ${ctx.projects.length} projects listed:\n\n${ctx.projects
        .map((p) => `— ${p.title} (${p.year}): ${p.summary}`)
        .join("\n\n")}`,
      suggestions: ctx.projects.slice(0, 2).map((p) => `Tell me about ${p.title}`).concat("What's his stack?"),
    }),
  },
  {
    id: "skills",
    keywords: [
      "stack",
      "skill",
      "skills",
      "tech",
      "technology",
      "technologies",
      "language",
      "languages",
      "framework",
      "frameworks",
      "tools",
      "know",
    ],
    build: (ctx) => ({
      text: ctx.skills
        .map((group) => `${group.title}: ${group.items.join(", ")}`)
        .join("\n\n"),
      suggestions: ["Does he know Laravel?", "Show me his projects", "Where does he work?"],
    }),
  },
  {
    id: "education",
    keywords: [
      "education",
      "school",
      "university",
      "degree",
      "study",
      "studied",
      "graduate",
      "college",
      "cum laude",
    ],
    build: (ctx) => ({
      text: `${ctx.education.degree}${ctx.education.honors ? `, ${ctx.education.honors}` : ""} — ${ctx.education.school}, ${ctx.education.period}.`,
      suggestions: ["What's his stack?", "Where does he work?", "How do I get in touch?"],
    }),
  },
  {
    id: "contact",
    keywords: [
      "contact",
      "email",
      "reach",
      "hire",
      "hiring",
      "available",
      "availability",
      "get in touch",
      "linkedin",
      "github",
      "resume",
      "cv",
      "freelance",
    ],
    build: (ctx) => ({
      text: `Email is the best route: ${ctx.profile.email}\n\n${ctx.profile.socials
        .filter((s) => !s.href.startsWith("mailto:"))
        .map((s) => `${s.label}: ${s.href}`)
        .join("\n")}\n\nHe's based in ${ctx.profile.location} and open to new opportunities.`,
      suggestions: ["What does he do?", "Show me his projects"],
    }),
  },
  {
    id: "location",
    keywords: ["where", "location", "based", "remote", "timezone", "country", "city"],
    build: (ctx) => ({
      text: `He's based in ${ctx.profile.location}, and works with teams anywhere.`,
      suggestions: ["Where does he work?", "How do I get in touch?"],
    }),
  },
];

function scoreIntent(intent: Intent, query: string) {
  let score = 0;
  for (const keyword of intent.keywords) {
    if (!keyword) continue;
    // Multi-word keywords are strong signals; single words are weak ones.
    if (keyword.includes(" ")) {
      if (query.includes(keyword)) score += 3;
    } else if (new RegExp(`\\b${keyword}\\b`).test(query)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Resolve a question to an answer.
 *
 * Order matters: a named project or technology beats a generic intent, since
 * "tell me about Trackle" also contains the word "about".
 */
export function answer(query: string, ctx: ChatContext): ChatAnswer {
  const q = normalize(query);

  if (!q) {
    return {
      text: "Ask me something about his experience, projects or stack.",
      suggestions: OPENING_SUGGESTIONS.slice(0, 3),
    };
  }

  // 1. A project named outright.
  const named = ctx.projects.find((p) => q.includes(normalize(p.title)));
  if (named) return projectAnswer(ctx, named);

  // 2. A technology named outright.
  const tech = techIndex(ctx);
  for (const [key, label] of tech) {
    // Guard against very short slugs ("c", "go") matching inside other words.
    const pattern =
      key.length <= 2
        ? new RegExp(`\\b${key}\\b`)
        : new RegExp(key.replace(/[.+#]/g, "\\$&"));
    if (pattern.test(slug(q)) || pattern.test(q)) {
      return techAnswer(ctx, label);
    }
  }

  // 3. Otherwise, the best-scoring intent.
  const ranked = INTENTS.map((intent) => ({
    intent,
    score: scoreIntent(intent, q),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked[0]) return ranked[0].intent.build(ctx);

  // 4. No intent matched — search the content before giving up. "Has he led a
  //    team?" has no intent, but the Applus highlight literally says he did.
  const found = search(q, ctx);
  if (found) return found;

  return {
    text: "I only know what's on this page — his experience, projects, stack, education and contact details. Try one of these:",
    suggestions: OPENING_SUGGESTIONS.slice(0, 4),
  };
}

/** Words too common to tell anything apart. */
const STOPWORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "been", "can", "did", "do",
  "does", "ever", "for", "from", "had", "has", "have", "he", "her", "high",
  "him", "his", "how", "in", "is", "it", "its", "kind", "know", "like", "many",
  "me", "much", "of", "on", "or", "she", "some", "tell", "that", "the", "their",
  "them", "there", "they", "this", "to", "use", "used", "uses", "was", "what",
  "when", "where", "which", "who", "why", "with", "work", "worked", "you",
  "your",
]);

/** Everything a free-text question could reasonably be about. */
function corpus(ctx: ChatContext) {
  const entries: { text: string; source: string }[] = [];

  for (const role of ctx.roles) {
    for (const highlight of role.highlights) {
      entries.push({ text: highlight, source: `${role.company}` });
    }
  }
  for (const project of ctx.projects) {
    entries.push({
      text: `${project.summary} Built with ${project.stack.join(", ")}.`,
      source: project.title,
    });
  }
  for (const group of ctx.skills) {
    entries.push({ text: group.items.join(", "), source: group.title });
  }
  entries.push({
    text: `${ctx.education.degree}${ctx.education.honors ? `, ${ctx.education.honors}` : ""} at ${ctx.education.school}, ${ctx.education.period}.`,
    source: "Education",
  });

  return entries;
}

/**
 * Keyword search over the content, used when no intent matches.
 *
 * Crude on purpose — it only has to beat "I don't know", which is a dead end
 * for the visitor. Requiring two matching terms keeps single common words
 * from dragging in something irrelevant.
 */
function search(query: string, ctx: ChatContext): ChatAnswer | null {
  const terms = query
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  if (!terms.length) return null;

  const hits = corpus(ctx)
    .map((entry) => {
      const haystack = entry.text.toLowerCase();
      const score = terms.filter((term) => haystack.includes(term)).length;
      return { entry, score };
    })
    .filter((hit) => hit.score >= Math.min(2, terms.length))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (!hits.length) return null;

  return {
    text: hits
      .map(({ entry }) => `${entry.source}: ${entry.text}`)
      .join("\n\n"),
    suggestions: ["What does he do?", "Show me his projects", "What's his stack?"],
  };
}
