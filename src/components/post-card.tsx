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
    typeof index === "number"
      ? `N° ${String(index + 1).padStart(2, "0")}`
      : null;

  return (
    <li className="group relative border-b border-[color:var(--color-hairline)] first:border-t">
      <Link href={post.url} className="block py-8 pr-4 sm:py-10 sm:pl-12">
        {/* Ordinal marker — 좌측 여백에 장식 숫자 */}
        {ordinal && (
          <span
            aria-hidden
            className="absolute left-0 top-10 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-faint)] transition group-hover:text-[color:var(--color-accent)] sm:block"
          >
            {ordinal}
          </span>
        )}

        {/* Accent ruler — 호버 시 좌측에서 가늘게 등장 */}
        <span
          aria-hidden
          className="absolute left-6 top-0 bottom-0 hidden w-px origin-top scale-y-0 bg-[color:var(--color-accent)] transition-transform duration-300 ease-out group-hover:scale-y-100 sm:block"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
          <time
            dateTime={post.date}
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-muted)] sm:w-20 sm:shrink-0"
          >
            {formatDate(post.date)}
          </time>

          <div className="flex-1 space-y-2.5">
            {post.series && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                {post.series.name} · {post.series.order} / {post.series.total}
              </p>
            )}
            <h3 className="text-lg font-bold leading-snug tracking-tight text-[color:var(--color-ink)] transition duration-200 group-hover:translate-x-[2px] group-hover:text-[color:var(--color-accent)] sm:text-xl">
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
                  <span>
                    {post.tags
                      .slice(0, 4)
                      .map((t) => `#${t}`)
                      .join(" ")}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
