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
