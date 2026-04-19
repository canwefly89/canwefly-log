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
      <div className="mx-auto max-w-5xl px-6 py-14">
        {/* 상단 — 4칼럼 그리드 */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-baseline gap-2 text-[color:var(--color-ink)]"
            >
              <span className="font-serif text-2xl italic leading-none tracking-tight">
                canwefly
              </span>
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-muted)]">
                —log
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-[1.7] text-[color:var(--color-muted)]">
              프론트엔드 6년차가 AI 시스템의 속을 들여다본 기록.
              <br />
              실패한 실험과, 거기서 겨우 얻어낸 감각을 정리합니다.
            </p>
          </div>

          <div>
            <p className="running-folio mb-4">Index</p>
            <ul className="space-y-2 text-sm">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="link-editorial text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="running-folio mb-4">Elsewhere</p>
            <ul className="space-y-2 text-sm">
              {externalLinks.map((l) =>
                l.external ? (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="link-editorial text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
                    >
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="link-editorial text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Colophon */}
        <div className="mt-14 border-t border-[color:var(--color-hairline)] pt-6">
          <div className="flex flex-col items-start justify-between gap-3 text-[11px] text-[color:var(--color-faint)] sm:flex-row sm:items-center">
            <p className="font-mono tracking-wider">
              © {year === 2026 ? year : `2026–${year}`} canwefly-log ·{" "}
              <span className="italic font-serif tracking-normal text-[color:var(--color-muted)]">
                Progress, not Perfection.
              </span>
            </p>
            <p className="font-mono leading-relaxed tracking-wider">
              Set in{" "}
              <span className="text-[color:var(--color-muted)]">Pretendard</span>,{" "}
              <span className="italic font-serif tracking-normal text-[color:var(--color-muted)]">
                Instrument Serif
              </span>{" "}
              &amp;{" "}
              <span className="text-[color:var(--color-muted)]">Geist Mono</span>.
              Built with Next.js on Vercel.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
