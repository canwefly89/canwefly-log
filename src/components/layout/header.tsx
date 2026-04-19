import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";

const navItems = [
  { href: "/posts", label: "글" },
  { href: "/series/pi-lab-intensive", label: "연재" },
  { href: "/about", label: "소개" },
];

export function Header() {
  return (
    <div className="sticky top-0 z-40 bg-[color:var(--color-canvas)]/85 backdrop-blur-md">
      {/* Running folio — 잡지의 상단 띠 */}
      <div className="border-b border-[color:var(--color-hairline)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-1.5 running-folio">
          <span>Vol. 01 · MMXXVI</span>
          <span className="hidden sm:inline">
            FE &nbsp;·&nbsp; AI engineering &nbsp;·&nbsp; 그 사이의 기록
          </span>
          <span className="sm:hidden">기록</span>
        </div>
      </div>

      {/* 헤더 본체 */}
      <header className="border-b border-[color:var(--color-hairline)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="group flex items-baseline gap-2 text-[color:var(--color-ink)]"
            aria-label="canwefly-log 홈"
          >
            <span className="font-serif text-xl italic leading-none tracking-tight transition group-hover:text-[color:var(--color-accent)]">
              canwefly
            </span>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[color:var(--color-muted)]">
              —log
            </span>
          </Link>

          <nav className="flex items-center gap-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="link-editorial text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>
    </div>
  );
}
