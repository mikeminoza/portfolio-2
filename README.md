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
    providers.tsx        ThemeProvider + Lenis, driven off GSAP's ticker
    hero.tsx             scroll-linked parallax hero (Motion)
    experience.tsx       roles with sticky date rail
    projects.tsx         work list: ScrollTrigger rail, spotlight, velocity skew
    skills.tsx           skill groups + education
    marquee.tsx          scroll-reactive tech strip
    scroll-progress.tsx  reading-progress rail
    magnetic.tsx         cursor-following wrapper for buttons
    section-heading.tsx  masked word reveal on scroll
    reveal.tsx           <Reveal> / <RevealGroup> scroll entrances
    split-text.tsx       word-by-word text reveal
    site-header.tsx      fixed nav, active-section pill
    site-footer.tsx      contact
    theme-toggle.tsx     light/dark switch
  lib/
    content.ts           ← content source of truth, the CMS swap point
    motion.ts            shared variants and easing
    utils.ts             cn()
    use-hydrated.ts      SSR-safe "has hydrated" hook
    use-active-section.ts  IntersectionObserver section tracking
```

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
| Work list rail + rows | GSAP ScrollTrigger | One scrub range for the whole section |
| Row spotlight | Motion `useMotionTemplate` | Radial gradient tracks the cursor |
| Velocity skew | Motion `useVelocity` | Max 2.2°, reads as weight |

Everything autonomous is disabled under `prefers-reduced-motion`; only the
scroll-linked progress rail stays, because it reports position rather than
decorating.

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
4. Restart the dev server and open `/studio`.

Until step 2 is done the site runs on the seed content in `src/lib/content.ts`
and `/studio` shows a setup notice instead of crashing.

### Content model

- **Profile** — singleton: name, role, intro paragraphs, email, location, socials.
- **Experience** — company, job title, period, employment type, highlights, sort order.
- **Project** — title, slug, summary, cover image, year, role, stack, URL, sort order.
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
