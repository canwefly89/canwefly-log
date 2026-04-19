import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";

const navItems = [
  { href: "/posts", label: "글" },
  { href: "/series/pi-lab-intensive", label: "연재" },
  { href: "/about", label: "소개" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--color-hairline)] bg-[color:var(--color-canvas)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-[color:var(--color-ink)] transition hover:text-[color:var(--color-accent)]"
          aria-label="canwefly-log 홈"
        >
          canwefly-log
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
