import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/layout/section-heading";
import { Tag } from "@/components/ui/tag";
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
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:px-10 md:py-28"
    >
      <SectionHeading index={3}>Stack</SectionHeading>

      <RevealGroup gap={0.07}>
        {groups.map((group) => (
          <Reveal
            key={group.title}
            variants={riseIn}
            className="grid gap-x-10 gap-y-3 border-t border-border py-6 md:grid-cols-[12rem_1fr]"
          >
            <h3 className="label text-muted">{group.title}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item}>
                  <Tag interactive>{item}</Tag>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </RevealGroup>

      <Reveal className="grid gap-x-10 gap-y-3 border-y border-border py-6 md:grid-cols-[12rem_1fr]">
        <h3 className="label text-muted">Education</h3>
        <div>
          {/* Flex rather than an inline pill: the degree name is long enough
              to wrap, and an inline badge strands itself on the last line. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-lg font-medium">{education.degree}</p>
            {education.honors && (
              <Tag size="sm" treatment="label" tone="accent">
                {education.honors}
              </Tag>
            )}
          </div>
          <p className="mt-2 text-muted">{education.school}</p>
          <p className="label mt-2 text-muted/70">{education.period}</p>
        </div>
      </Reveal>
    </section>
  );
}
