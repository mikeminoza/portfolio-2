import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import type { Profile } from "@/lib/content";

export function SiteFooter({ profile }: { profile: Profile }) {
  return (
    <footer
      id="contact"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:px-10 md:py-28"
    >
      <SectionHeading index={4} meta={profile.location}>
        Contact
      </SectionHeading>

      <Reveal>
        <h3 className="max-w-2xl text-balance text-[clamp(2rem,5.5vw,3.75rem)] font-semibold leading-[1.02]">
          Open to new opportunities.
        </h3>

        <a
          href={`mailto:${profile.email}`}
          className="group mt-10 inline-flex items-center gap-4 border-b border-border pb-2 text-lg text-muted transition-colors hover:border-accent hover:text-accent md:text-2xl"
        >
          {profile.email}
          <span
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </a>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-6">
          <p className="label text-muted/70">
            &copy; {new Date().getFullYear()} {profile.name}
          </p>
          <ul className="flex flex-wrap gap-6">
            {profile.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  className="label text-muted transition-colors hover:text-accent"
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </footer>
  );
}
