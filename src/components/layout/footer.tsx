import Link from "next/link";

const navLinks = [
  { href: "/posts", label: "글" },
  { href: "/series/pi-lab-intensive", label: "연재" },
  { href: "/about", label: "소개" },
];

const externalLinks = [
  { href: "/rss.xml", label: "RSS", external: false },
  { href: "https://github.com/canwefly89", label: "GitHub", external: true },
  { href: "mailto:canwefly@kakao.com", label: "Email", external: true },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[color:var(--color-hairline)]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-[color:var(--color-ink)]"
            >
              canwefly-log
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-[1.7] text-[color:var(--color-muted)]">
              프론트엔드 개발자가 AI 엔지니어링을 공부하며 남기는 기록.
            </p>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Index
            </p>
            <ul className="space-y-2 text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              Elsewhere
            </p>
            <ul className="space-y-2 text-sm">
              {externalLinks.map((l) =>
                l.external ? (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
                    >
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[color:var(--color-hairline)] pt-5">
          <p className="font-mono text-[11px] text-[color:var(--color-faint)]">
            © {year === 2026 ? year : `2026–${year}`} canwefly-log
          </p>
        </div>
      </div>
    </footer>
  );
}
