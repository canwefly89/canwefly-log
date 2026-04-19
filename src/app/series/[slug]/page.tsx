import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesPosts,
} from "@/lib/posts";
import { formatDate } from "@/lib/date";

export async function generateStaticParams() {
  return getAllSeries().map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return {};
  return {
    title: series.name,
    description: `${series.name} — ${series.total}편의 연재.`,
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  const posts = getSeriesPosts(slug);

  if (!series || posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-14 pb-8 sm:pt-20">
      {/* 상단 크레딧 */}
      <div className="running-folio mb-10 flex items-baseline justify-between">
        <span>Series</span>
        <span>
          {series.total} Pieces · {formatDate(posts[0].date)}
        </span>
      </div>

      <header className="mb-14 space-y-4 border-b border-[color:var(--color-hairline)] pb-10">
        <p className="running-folio text-[color:var(--color-accent)]">
          A Four-Part Collection
        </p>
        <h1 className="font-serif text-[2.5rem] italic leading-[1.08] tracking-tight text-[color:var(--color-ink)] sm:text-[3.5rem]">
          {series.name}
        </h1>
        <p className="max-w-xl leading-[1.8] text-[color:var(--color-muted)]">
          총 {series.total}편의 기록. 첫 편부터 순서대로 읽도록 구성했습니다.
        </p>
      </header>

      <ol className="list-none p-0">
        {posts.map((post, idx) => {
          const order = post.series?.order ?? idx + 1;
          return (
            <li
              key={post.slug}
              className="group relative border-b border-[color:var(--color-hairline)] first:border-t"
            >
              <Link
                href={post.url}
                className="grid items-baseline gap-6 py-10 sm:grid-cols-[auto_1fr_auto] sm:gap-10"
              >
                <span
                  aria-hidden
                  className="font-serif text-[3.5rem] italic leading-none text-[color:var(--color-hairline)] transition-colors duration-300 group-hover:text-[color:var(--color-accent)] sm:text-[4.5rem]"
                >
                  {String(order).padStart(2, "0")}
                </span>

                <div className="space-y-3">
                  <p className="running-folio">
                    Part {order} of {series.total}
                  </p>
                  <h2 className="text-xl font-bold leading-snug tracking-tight text-[color:var(--color-ink)] transition group-hover:text-[color:var(--color-accent)] sm:text-[1.6rem]">
                    {post.title}
                  </h2>
                  <p className="font-serif text-base italic leading-[1.55] text-[color:var(--color-muted)] sm:text-lg">
                    {post.description}
                  </p>
                </div>

                <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-faint)] sm:text-right">
                  <time dateTime={post.date} className="block">
                    {formatDate(post.date)}
                  </time>
                  <span className="mt-1 block">{post.readingTime}분</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
