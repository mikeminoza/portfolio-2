import { Reveal, RevealGroup } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { riseIn } from "@/lib/motion";
import type { Education, SkillGroup } from "@/lib/content";

export function Skills({
  groups,
  education,
}: {
  groups: SkillGroup[];
  education: Education;
}) {
  return (
    <section
      id="skills"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24 md:px-10 md:py-32"
    >
      <SectionHeading>Skills &amp; tools</SectionHeading>

      <RevealGroup className="space-y-8" gap={0.07}>
        {groups.map((group) => (
          <Reveal
            key={group.title}
            variants={riseIn}
            className="grid gap-3 border-t border-border pt-6 md:grid-cols-[13rem_1fr] md:gap-10"
          >
            <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
              {group.title}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </RevealGroup>

      <Reveal className="mt-16 border-t border-border pt-8">
        <div className="grid gap-3 md:grid-cols-[13rem_1fr] md:gap-10">
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            Education
          </h3>
          <div>
            <p className="text-lg font-medium tracking-tight">
              {education.degree}
              {education.honors && (
                <span className="ml-3 rounded-full border border-accent px-2.5 py-0.5 align-middle font-mono text-[11px] font-normal text-accent">
                  {education.honors}
                </span>
              )}
            </p>
            <p className="mt-1 text-muted">{education.school}</p>
            <p className="mt-1 font-mono text-xs text-muted">{education.period}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
