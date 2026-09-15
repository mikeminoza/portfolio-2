import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { riseIn } from "@/lib/motion";
import type { Role } from "@/lib/content";

export function Experience({ roles }: { roles: Role[] }) {
  return (
    <section
      id="experience"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:px-10 md:py-28"
    >
      <SectionHeading
        index={1}
        meta={`${String(roles.length).padStart(2, "0")} entries`}
      >
        Experience
      </SectionHeading>

      <RevealGroup gap={0.12}>
        {roles.map((role) => (
          <Reveal
            key={`${role.company}-${role.period}`}
            as="article"
            variants={riseIn}
            className="grid gap-x-10 gap-y-4 border-t border-border py-8 md:grid-cols-[12rem_1fr]"
          >
            <div className="md:sticky md:top-24 md:self-start">
              <p className="label text-muted">{role.period}</p>
              {role.employment && (
                <p className="label mt-2 text-muted/70">{role.employment}</p>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-medium md:text-3xl">{role.title}</h3>
              <p className="label mt-2 text-accent">{role.company}</p>

              <ul className="mt-6 space-y-3">
                {role.highlights.map((highlight, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2.5rem_1fr] items-baseline gap-2 text-pretty leading-relaxed text-muted"
                  >
                    <span className="label text-muted/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
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
