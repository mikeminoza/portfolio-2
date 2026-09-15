import { ChatWidget } from "@/components/chat/chat-widget";
import { Hero } from "@/components/sections/hero";
import { ChallengeSection } from "@/components/challenge/challenge-section";
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
        <ProjectsSection projects={projects} />
        <Skills groups={skills} education={education} />
        <ChallengeSection />
      </main>
      <SiteFooter profile={profile} />
      <ChatWidget
        context={{ profile, roles: experience, projects, skills, education }}
      />
    </>
  );
}
