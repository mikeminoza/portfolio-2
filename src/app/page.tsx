import { Hero } from "@/components/hero";
import { Experience } from "@/components/experience";
import { Marquee } from "@/components/marquee";
import { Projects } from "@/components/projects";
import { ScrollProgress } from "@/components/scroll-progress";
import { Skills } from "@/components/skills";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getEducation,
  getExperience,
  getProfile,
  getProjects,
  getSkills,
} from "@/lib/content";

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

  return (
    <>
      <ScrollProgress />
      <SiteHeader name={profile.name} />
      <main>
        <Hero profile={profile} />
        {marqueeItems.length > 0 && <Marquee items={marqueeItems} />}
        <Experience roles={experience} />
        <Projects projects={projects} />
        <Skills groups={skills} education={education} />
      </main>
      <SiteFooter profile={profile} />
    </>
  );
}
