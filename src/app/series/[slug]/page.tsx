import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesPosts,
} from "@/lib/posts";
import { formatDate } from "@/lib/date";
import { absUrl } from "@/lib/seo";

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
  const url = absUrl(`/series/${series.id}`);
  const description = `${series.name} — ${series.total}편의 연재.`;
  return {
    title: series.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${series.name} · canwefly-log`,
      description,
      url,
      type: "website",
    },
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
    <div className="mx-auto max-w-3xl px-6 pt-14 pb-8 sm:pt-24">
      <header className="mb-12 space-y-3 border-b border-[color:var(--color-hairline)] pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Series · {series.total}편
        </p>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-[color:var(--color-ink)] sm:text-[2.5rem]">
          {series.name}
        </h1>
        <p className="max-w-xl leading-[1.85] text-[color:var(--color-muted)]">
          총 {series.total}편의 기록. 첫 편부터 순서대로 읽도록 구성했습니다.
        </p>
      </header>

      <ol className="list-none p-0">
        {posts.map((post, idx) => {
          const order = post.series?.order ?? idx + 1;
          return (
            <li
              key={post.slug}
              className="group border-b border-[color:var(--color-hairline)] first:border-t"
            >
              <Link href={post.url} className="block py-8 sm:py-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-8">
                  <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-muted)] sm:w-24 sm:shrink-0">
                    Part {order} / {series.total}
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <h2 className="text-lg font-bold leading-snug tracking-tight text-[color:var(--color-ink)] transition-colors duration-150 group-hover:text-[color:var(--color-accent)] sm:text-xl">
                      <span className="mr-2 font-mono text-[color:var(--color-faint)]">
                        #{order}
                      </span>
                      {post.title}
                    </h2>
                    <p className="text-[0.95rem] leading-[1.75] text-[color:var(--color-muted)]">
                      {post.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-mono text-[11px] text-[color:var(--color-faint)]">
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span>·</span>
                      <span>{post.readingTime}분 읽기</span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
