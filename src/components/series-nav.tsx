import Link from "next/link";
import { ArrowLeft, ArrowRight, List } from "lucide-react";

import type { Post } from "@/lib/posts";

export function SeriesNav({
  post,
  prev,
  next,
}: {
  post: Post;
  prev?: Post;
  next?: Post;
}) {
  if (!post.series) return null;

  return (
    <aside className="not-prose mt-20 border-t border-[color:var(--color-hairline)] pt-10">
      <div className="mb-8 flex items-baseline justify-between">
        <p className="running-folio">
          {post.series.name} · {post.series.order} / {post.series.total}
        </p>
        <Link
          href={`/series/${post.series.id}`}
          className="link-editorial inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
        >
          <List size={10} strokeWidth={1.5} />
          연재 전체
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
        {prev ? (
          <Link
            href={prev.url}
            className="group flex flex-col border-t border-[color:var(--color-hairline)] pt-4 transition hover:border-[color:var(--color-accent)]"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              <ArrowLeft size={10} strokeWidth={1.5} />
              이전 편
            </span>
            <span className="mt-3 font-serif text-xs italic text-[color:var(--color-faint)]">
              Part {prev.series?.order ?? "—"}
            </span>
            <span className="mt-1 text-[0.95rem] font-semibold leading-snug text-[color:var(--color-ink)] transition group-hover:text-[color:var(--color-accent)]">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={next.url}
            className="group flex flex-col border-t border-[color:var(--color-hairline)] pt-4 text-right transition hover:border-[color:var(--color-accent)] sm:items-end"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              다음 편
              <ArrowRight size={10} strokeWidth={1.5} />
            </span>
            <span className="mt-3 font-serif text-xs italic text-[color:var(--color-faint)]">
              Part {next.series?.order ?? "—"}
            </span>
            <span className="mt-1 text-[0.95rem] font-semibold leading-snug text-[color:var(--color-ink)] transition group-hover:text-[color:var(--color-accent)]">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </aside>
  );
}
