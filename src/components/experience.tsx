import { Reveal, RevealGroup } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { riseIn } from "@/lib/motion";
import type { Role } from "@/lib/content";

export function Experience({ roles }: { roles: Role[] }) {
  return (
    <section
      id="experience"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24 md:px-10 md:py-32"
    >
      <SectionHeading count={roles.length}>Experience</SectionHeading>

      <RevealGroup className="space-y-12" gap={0.12}>
        {roles.map((role) => (
          <Reveal
            key={`${role.company}-${role.period}`}
            as="article"
            variants={riseIn}
            className="grid gap-4 border-t border-border pt-8 md:grid-cols-[13rem_1fr] md:gap-10"
          >
            <div className="md:sticky md:top-24 md:self-start">
              <p className="font-mono text-xs text-muted">{role.period}</p>
              {role.employment && (
                <p className="mt-2 inline-block rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted">
                  {role.employment}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-xl font-medium tracking-tight md:text-2xl">
                {role.title}
              </h3>
              <p className="mt-1 text-accent">{role.company}</p>

              <ul className="mt-5 space-y-2.5">
                {role.highlights.map((highlight, i) => (
                  <li
                    key={i}
                    className="relative pl-5 text-pretty leading-relaxed text-muted before:absolute before:left-0 before:top-[0.7em] before:size-1 before:rounded-full before:bg-border"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
