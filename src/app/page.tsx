import { FloatingDock } from "@/components/dock/floating-dock";
import { Hero } from "@/components/sections/hero";
import { Experience } from "@/components/sections/experience";
import { Marquee } from "@/components/motion/marquee";
import { ProjectsSection } from "@/components/projects/projects-section";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { Skills } from "@/components/sections/skills";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  getEducation,
  getExperience,
  getProfile,
  getProjects,
  getSkills,
} from "@/lib/content";
import { buildStructuredData, metaDescription } from "@/lib/seo";

/** Groups worth putting on the banner — tools and practices read as filler. */
const MARQUEE_GROUPS = ["Languages", "Frameworks & libraries", "Database & backend"];

export default async function Home() {
  const [profile, experience, projects, skills, education] = await Promise.all([
    getProfile(),
    getExperience(),
    getProjects(),
    getSkills(),
    getEducation(),
  ]);

  const marqueeItems = [
    ...new Set(
      skills
        .filter((group) => MARQUEE_GROUPS.includes(group.title))
        .flatMap((group) => group.items),
    ),
  ];

  const structuredData = buildStructuredData({
    profile,
    roles: experience,
    projects,
    skills,
    education,
    description: metaDescription(profile),
  });

  return (
    <>
      {/*
        Rendered server-side so crawlers see it in the initial HTML. The JSON
        is machine-read only, so `dangerouslySetInnerHTML` is the documented
        way to emit it — React would otherwise escape the quotes.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ScrollProgress />
      <SiteHeader name={profile.name} />
      <main>
        <Hero profile={profile} />
        {marqueeItems.length > 0 && <Marquee items={marqueeItems} />}
        <Experience roles={experience} />
        <ProjectsSection projects={projects} />
        <Skills groups={skills} education={education} />
      </main>
      <SiteFooter profile={profile} />
      <FloatingDock
        context={{ profile, roles: experience, projects, skills, education }}
      />
    </>
  );
}
