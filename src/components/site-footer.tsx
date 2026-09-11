import { Reveal } from "@/components/reveal";
import type { Profile } from "@/lib/content";

export function SiteFooter({ profile }: { profile: Profile }) {
  return (
    <footer
      id="contact"
      className="mx-auto max-w-5xl scroll-mt-24 border-t border-border px-6 py-24 md:px-10 md:py-32"
    >
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Contact
        </p>
        <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Open to new opportunities.
        </h2>
        <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted">
          Based in {profile.location}, and happy to work with teams anywhere.
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="mt-8 inline-block text-lg text-muted underline decoration-border underline-offset-8 transition-colors hover:text-accent hover:decoration-accent"
        >
          {profile.email}
        </a>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
          <p className="font-mono text-xs text-muted">
            &copy; {new Date().getFullYear()} {profile.name}
          </p>
          <ul className="flex flex-wrap gap-6">
            {profile.socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  className="text-sm text-muted transition-colors hover:text-foreground"
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
