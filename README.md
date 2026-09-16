# Portfolio

Next.js 16 · React 19 · Tailwind 4 · Motion · GSAP · Lenis

## Running

```
pnpm dev      # http://localhost:3000
pnpm build
pnpm lint
```

## Structure

```
src/
  app/
    layout.tsx        root layout, fonts, metadata
    page.tsx          composes the sections, reads from lib/content
    globals.css       theme tokens (light + .dark), Lenis styles, reduced-motion reset
  components/
    ui/          primitives: Tag, ActionLink/ActionButton, InlineLink
    motion/      Reveal, SplitText, Magnetic, Marquee, ScrollProgress
    layout/      SiteHeader, SiteFooter, SectionHeading, ThemeToggle, Providers
    sections/    Hero, Experience, Skills
    projects/    ProjectsSection, ProjectRow, ProjectModal, ProjectImage, ProjectBadge
    chat/        ChatPanel, ChatBubble
    challenge/   ChallengeModal, CodeEditor, TestResults
    dock/        FloatingDock, DockButton
  hooks/
    use-escape-key.ts      dismiss-on-Escape for overlays
    use-focus-trap.ts      Tab containment + initial focus
    use-scroll-lock.ts     Lenis stop + overflow lock
    use-motion-safe.ts     safe() wrapper for reduced motion
    use-active-section.ts  IntersectionObserver section tracking
    use-hydrated.ts        SSR-safe "has hydrated"
  lib/
    content.ts           ← content source of truth, the CMS swap point
    motion.ts            shared variants and easing
    utils.ts             cn()
    use-hydrated.ts      SSR-safe "has hydrated" hook
    use-active-section.ts  IntersectionObserver section tracking
```

## Component conventions

Components are grouped by role, not dumped in one folder: `ui/` holds
styling primitives, `motion/` the animation wrappers, `layout/` the page
chrome, and `sections/`, `projects/` and `chat/` the features.

Three rules keep it from drifting back:

- **Don't hand-roll a chip or a button.** `Tag`, `ActionLink`/`ActionButton`
  and `InlineLink` exist because the same class strings had been copied into
  six files with slightly different padding each time.
- **Stacking order lives in `lib/z-layers.ts`**, not as bare `z-[70]`
  literals. The file lists the layers bottom to top.
- **Reduced motion goes through `useMotionSafe()`.** `safe(props)` returns
  `undefined` when the visitor asked for less motion, which is what Motion
  needs to skip an animation rather than run it at zero duration.

Overlay behaviour (Escape, focus trapping, scroll locking) is in hooks, so
the modal and the assistant cannot drift apart.

### The floating dock

Both launchers live in `dock/floating-dock.tsx` rather than inside their own
features. A trigger positioned from inside each panel would have to guess the
other's width to sit beside it; one container owns the row instead.

The dock also owns which panel is open, so opening one closes the other. The
challenge is a full modal, and leaving the chat panel open behind it would
trap focus in two places at once.

## Design system

Technical-editorial: it should read like a well-made technical spec, not a
portfolio template. Structure is carried by hairline rules, numbered sections
and monospace labels rather than by cards, shadows and rounded corners.

### Palette

Cool near-neutral greys, near-black ink, one teal signal colour —
instrumentation rather than marketing. Tokens live in `globals.css`; every
component reads them, so retheming is one file.

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#f7f8f8` | `#0b0f10` |
| `--foreground` | `#0e1214` | `#e8edee` |
| `--muted` | `#5c666b` | `#8a959a` |
| `--border` | `#dde2e3` | `#212829` |
| `--accent` | `#0b6e7f` | `#22d3ee` |
| `--surface` | `#eff2f2` | `#131819` |

Dark is the default: `defaultTheme="dark"` with `enableSystem={false}` in
`providers.tsx`. `enableSystem` has to be off for that to hold — left on, the
OS preference wins and `defaultTheme` only applies when none can be read. The
toggle still switches and persists per visitor in `localStorage`.

Contrast is checked, not assumed. Accent lands on 11px text (section numbers,
company names, project links), so it is measured against the surface as well
as the ground — a value that passes on one can fail on the other.

| Pair | Light | Dark |
| --- | --- | --- |
| ink / ground | 17.7 | 16.3 |
| muted / ground | 5.5 | 6.3 |
| accent / ground | 5.6 | 10.7 |
| accent / surface | 5.3 | 9.9 |

All clear WCAG AA for normal text in both themes.

### Type

Two families, with a deliberate contrast between them:

- **Archivo** — display and prose, set tight (`-0.02em` on headings).
- **IBM Plex Mono** — every piece of structure: section numbers, dates,
  labels, metadata, stack lists. Set loose (`0.15em`, uppercase, 11px).

Tight headings against loose structure is the whole idea, so it lives in
`globals.css` as the `label` utility rather than being repeated per component.

### Conventions

- Sections are numbered (`01 / EXPERIENCE`) and introduced by an accent rule
  that draws itself on scroll.
- No rounded corners, no shadows. Borders are 1px and do the work.
- The hero sits on a faint 72px engineering grid, masked to a soft pool,
  instead of the usual blurred colour blob.

### Project images

Screenshots of the live deployments live in `public/projects/`, captured at
1440x900 and encoded as JPEG (~120KB each). `project-image.tsx` resolves the
source: a Sanity `cover` wins when set (hotspot-aware crops via the CDN),
otherwise the checked-in screenshot is used, and nothing renders when neither
exists — so no empty bordered frames.

MedNexus has no image: it is a capstone with no public deployment to shoot.
Drop a file at `public/projects/mednexus.jpg` and add a `staticCover` entry to
give it one.

To re-shoot after a redesign, drive a local browser with `playwright-core`
(no Chromium download needed — it attaches to installed Edge or Chrome).

### Projects: overview vs. modal

The page carries an overview only, capped at `OVERVIEW_LIMIT` (3) projects —
number, title, kind badge, year, role and stack. The full list, with summaries,
cover art and links, lives in `project-modal.tsx`, which opens either on a
specific project (clicking a row scrolls to it) or on the whole set.

The button counts the full set ("View all 4 projects") whenever some are
hidden, so the page never quietly truncates without saying so.

The modal stops Lenis on open rather than relying on `overflow: hidden` alone —
Lenis drives the scroll itself and ignores the overflow lock. Both are applied,
because under reduced motion Lenis is never mounted and the overflow lock is
the one doing the work.

Any scroll container nested inside the page needs `data-lenis-prevent`. Lenis
cancels wheel events at the root — including while stopped — so without it a
nested `overflow-y: auto` list silently refuses to scroll. Both the project
modal and the assistant's message log carry it.

## Code challenge

A LeetCode-style editor in a modal, launched from the floating dock beside
the assistant: pick a language and difficulty, solve the problem, run it
against test cases. It is not a page section — it stays out of the reading
order and costs nothing until someone opens it.

### Where the code runs

In the visitor's own browser, in a Web Worker. Nothing is uploaded, there is
no execution server, and an infinite loop costs a terminated worker rather
than a deploy. That property is what makes it safe to put on a public page.

- **JavaScript** — `public/workers/js-runner.js`, a classic worker.
- **Python** — `public/workers/python-runner.js`, a **module** worker that
  dynamically imports Pyodide (CPython on WebAssembly) from the CDN.

The module part is not a style choice. Pyodide 314 refuses to initialise in a
classic worker (`Classic web workers are not supported`), so `importScripts`
of `pyodide.js` cannot work at all — the ESM build behind a dynamic `import()`
is the supported path. The runtime is several megabytes, so it loads on first
use and the worker is kept alive between runs; the UI says it is warming up.

Both workers are real files rather than blob URLs, since a module worker needs
a proper origin.

### Where the problems come from

`GET /api/challenge?difficulty=…` generates one with Claude and falls back to
the nine bundled problems in `lib/challenge/problems.ts` whenever it can't.

**A generated problem is proved before it is served.** A model will sometimes
produce a problem whose expected values are wrong, and shipping that means a
visitor writes a correct solution and is told it failed — worse than having no
AI at all. So the model also returns a reference solution, which is executed
against its own test cases in `node:vm`; anything that can't pass its own
tests is discarded for a curated one.

Cost is bounded by construction. Generated problems are pooled three-per-
difficulty for 30 minutes, and concurrent requests share one in-flight call, so
traffic does not multiply spend — at most three calls per difficulty per
window however many people visit. Three is also the smallest pool that makes
Shuffle feel random; a single cached problem would return the same thing for
the whole window. Set `ANTHROPIC_API_KEY` to enable it — without the key the
endpoint quietly serves bundled problems and the feature works unchanged.

The caller passes the slug it already has as `exclude`, so Shuffle moves on
rather than handing back the problem already on screen.

### Hydration

The first render must be deterministic: `firstProblem()` is used for initial
state, never `randomProblem()`. Rolling at random during render has the server
and the client pick different problems and hydration fails. Randomisation
happens on interaction, which also means a page view never bills a
generation.

Every bundled problem returns a scalar or a fully ordered array so the harness
can compare with plain deep equality, and comparison is numerically tolerant
so Python's `2.0` matches JavaScript's `2`.

## Assistant

A floating widget (bottom right) that answers questions about the CV.

**It is scripted, not a language model** — and the panel header says so, because
letting a visitor assume otherwise would be the wrong kind of surprise. There is
no API key, no per-message cost and no public abuse surface.

`src/lib/chat.ts` holds the whole engine as one pure function:

```
answer(query, context) -> { text, suggestions }
```

It resolves in three passes — a project named outright, then a technology named
outright, then a keyword-scored intent (experience, projects, stack, education,
contact, location), with an honest fallback that says what it does and does not
know. Every answer is built from the same `content.ts` the page renders, so the
assistant cannot contradict the CV: add a project in the CMS and it starts
answering about it with no code change.

To make it live later, replace the body of `answer()` with a call to a route
handler. The widget, the types and the call site do not change.

## Animation notes

Two libraries, deliberately split:

- **Motion** for component-level entrances, layout transitions and
  scroll-linked values (`useScroll` / `useTransform`).
- **GSAP + ScrollTrigger** for anything that needs several elements
  choreographed against one scroll range (the work list and its rail).

Lenis runs with `autoRaf: false` and is ticked by GSAP, so smooth scroll and
ScrollTrigger share one clock instead of fighting over frames.

Only `transform` and `opacity` are animated, so work stays on the compositor.

### What moves, and why

| Effect | Driven by | Notes |
| --- | --- | --- |
| Hero headline reveal | Motion | Words rise out of overflow-hidden boxes |
| Hero parallax | Motion `useScroll` | Drifts and dims on exit |
| Reading progress rail | Motion `useSpring` | Scroll-linked, stays on under reduced motion |
| Tech marquee | `useAnimationFrame` + `useVelocity` | Speeds up and reverses with scroll |
| Nav active pill | Motion `layoutId` | Slides between links as sections change |
| Magnetic buttons | Motion springs | Capped at 14px; mouse pointers only |
| Section headings | Motion | Same masked rise as the hero, on scroll |
| Work list rail | GSAP ScrollTrigger | One scrub range for the whole section |
| Work row reveal | GSAP timeline | Blur-to-sharp lift; rule draws and thumbnail settles alongside |
| Thumbnail parallax | Motion `useScroll` | Image drifts ±8% against the row |
| Row spotlight | Motion `useMotionTemplate` | Radial gradient tracks the cursor |
| Velocity skew | Motion `useVelocity` | Max 2.2°, reads as weight |

Everything autonomous is disabled under `prefers-reduced-motion`; only the
scroll-linked progress rail stays, because it reports position rather than
decorating.

The work rows use a blur-to-sharp lift: the row resolves from
`blur(10px)` with a small rise while the separator rule draws and the
thumbnail settles down from a slight overshoot. Everything lands together —
a single short gesture reads faster than parts arriving one after another,
which is what an internal stagger produces.

The `js-` classes in `project-row.tsx` are GSAP's handles and carry no
styling, so the row can be restyled without touching the choreography.

Two details worth keeping:

- `clearProps: "filter"` — a filter left on the element keeps a compositing
  layer alive for the life of the page, so it is dropped once the tween lands.
- `gsap.from()` rather than `gsap.to()` — if the script never runs, elements
  stay in their natural visible state instead of stranding hidden content.
  ScrollTrigger is refreshed once the thumbnails decode, since they change row
  heights and stale offsets would leave rows revealing at the wrong point.

### Reduced motion

`prefers-reduced-motion` is handled in three places, and all three matter:

1. `globals.css` collapses CSS animations and transitions.
2. `useReducedMotion()` makes each animated component render its plain
   equivalent rather than a zero-duration animation.
3. `providers.tsx` skips Lenis entirely, so scrolling stays native.

## CMS — Sanity

Studio is embedded at `/studio`; there is no second app to deploy.

### One-time setup

1. Create a project at https://sanity.io/manage (free plan is fine).
2. `cp .env.local.example .env.local` and fill in the project ID.
3. Add `http://localhost:3000` and your production URL under
   **API → CORS origins**, both with credentials allowed.
4. Create an Editor token under **API → Tokens** and put it in
   `SANITY_API_WRITE_TOKEN`. It is a write credential — never `NEXT_PUBLIC_`.
5. `pnpm seed` to populate the dataset from the bundled content.
6. Restart the dev server and open `/studio`.

### Seeding

`pnpm seed` reads `SEED` from `lib/content.ts` — the same data the site
renders before the CMS is connected — and writes it to Sanity, uploading the
project screenshots as real image assets along the way.

Every document has a stable id and is written with `createOrReplace`, so the
script is idempotent. That also means it **overwrites** Studio edits to those
documents: it is a seed, not a sync. It refuses to run against a dataset that
already has content unless you pass `--force`:

```
pnpm seed -- --force
```

### Singletons

`profile` and `education` are read with `[0]`, so exactly one of each must
exist. `sanity.config.ts` enforces that in two places, and both are needed:

- `schema.templates` removes them from the global "create new" menu.
- `document.actions` removes duplicate and delete from the documents.

The desk structure alone is not enough — it only controls navigation. Without
these filters an editor can create a second Profile, and the site would
silently render whichever one the query returned first.

Until step 2 is done the site runs on the seed content in `src/lib/content.ts`
and `/studio` shows a setup notice instead of crashing.

### Content model

- **Profile** — singleton: name, role, intro paragraphs, email, location, socials.
- **Experience** — company, job title, period, employment type, highlights, sort order.
- **Project** — title, slug, summary, cover image, year, role, kind, stack,
  repo + demo URLs, sort order. `kind` is `professional` or `personal` and
  drives the badge; it defaults to `personal`, since claiming employer work
  that isn't his is the worse failure.
- **Skill group** — title, items, sort order.
- **Education** — singleton: degree, school, period, honours.

Cover images go through Sanity's CDN via `urlFor()` in `src/sanity/client.ts`,
which applies the hotspot set in the Studio, so crops stay sensible at any
aspect ratio.

### Typed queries

Query results in `src/lib/content.ts` are typed by hand for now. Once the
project exists, generate them from the real schema instead:

```
pnpm typegen
```

### Where content comes from

`src/lib/content.ts` is the only file that knows about Sanity — every
component takes its data as props. Published content revalidates every 60s.

The seed content in that file mirrors the CV, so the site is fully populated
before the CMS is connected. Once Sanity has content, the seed data is only
used if a query comes back empty.
