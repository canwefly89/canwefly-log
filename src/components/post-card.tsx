import Link from "next/link";
import type { Post } from "@/lib/posts";
import { formatDate } from "@/lib/date";

export function PostCard({
  post,
  index,
}: {
  post: Post;
  index?: number;
}) {
  const ordinal =
    typeof index === "number" ? String(index + 1).padStart(2, "0") : null;

  return (
    <li className="group border-b border-[color:var(--color-hairline)] first:border-t">
      <Link href={post.url} className="block py-8 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-8">
          <div className="flex w-24 shrink-0 items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-muted)] sm:flex-col sm:gap-1.5">
            {ordinal && <span className="text-[color:var(--color-faint)]">{ordinal}</span>}
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>

          <div className="flex-1 space-y-2.5">
            {post.series && (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                {post.series.name} · {post.series.order} / {post.series.total}
              </p>
            )}
            <h3 className="text-lg font-bold leading-snug tracking-tight text-[color:var(--color-ink)] transition-colors duration-150 group-hover:text-[color:var(--color-accent)] sm:text-xl">
              {post.series && (
                <span className="mr-2 font-mono text-[color:var(--color-faint)]">
                  #{post.series.order}
                </span>
              )}
              {post.title}
            </h3>
            <p className="max-w-2xl text-[0.95rem] leading-[1.75] text-[color:var(--color-muted)]">
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-mono text-[11px] text-[color:var(--color-faint)]">
              <span>{post.readingTime}분 읽기</span>
              {post.tags?.length ? (
                <>
                  <span>·</span>
                  <span>{post.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
