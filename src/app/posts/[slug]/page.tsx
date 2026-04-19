import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  getAllPosts,
  getAdjacentInSeries,
  getPostBySlug,
} from "@/lib/posts";
import { formatDateLong } from "@/lib/date";
import { MdxContent } from "@/components/mdx-content";
import { SeriesNav } from "@/components/series-nav";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const ogUrl = `/api/og?slug=${encodeURIComponent(slug)}`;
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: post.url,
      publishedTime: post.date,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogUrl],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentInSeries(post);
  const seriesOrdinal = post.series
    ? `N° ${String(post.series.order).padStart(2, "0")} / ${String(
        post.series.total,
      ).padStart(2, "0")}`
    : null;

  return (
    <article className="mx-auto max-w-[46rem] px-6 pt-10 pb-4 sm:pt-16">
      {/* 러닝 폴리오 — 기사 상단의 편집 지시선 */}
      <div className="mb-10 flex items-center justify-between running-folio">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 transition hover:text-[color:var(--color-ink)]"
        >
          <ArrowLeft size={10} strokeWidth={1.5} />
          Index
        </Link>
        {seriesOrdinal && post.series && (
          <Link
            href={`/series/${post.series.id}`}
            className="transition hover:text-[color:var(--color-ink)]"
          >
            {post.series.name} · {seriesOrdinal}
          </Link>
        )}
      </div>

      <header className="mb-12 space-y-5 border-b border-[color:var(--color-hairline)] pb-10">
        {/* 카테고리/연재 */}
        {post.series && (
          <p className="running-folio text-[color:var(--color-accent)]">
            {post.series.name}
            <span className="ml-3 text-[color:var(--color-faint)]">
              {post.series.order} / {post.series.total}
            </span>
          </p>
        )}

        {/* 제목 */}
        <h1 className="text-[2rem] font-bold leading-[1.2] tracking-tight text-[color:var(--color-ink)] sm:text-[2.5rem] sm:leading-[1.15]">
          {post.title}
        </h1>

        {/* Dek (부제/요약) — 서체 대비 */}
        <p className="font-serif text-lg italic leading-[1.55] text-[color:var(--color-muted)] sm:text-xl">
          {post.description}
        </p>

        {/* 메타 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-faint)]">
          <time dateTime={post.date}>{formatDateLong(post.date)}</time>
          <span>·</span>
          <span>{post.readingTime}분 읽기</span>
          {post.tags?.length ? (
            <>
              <span>·</span>
              <span className="normal-case tracking-wide">
                {post.tags.map((t) => `#${t}`).join(" ")}
              </span>
            </>
          ) : null}
        </div>
      </header>

      <MdxContent html={post.content} />

      <SeriesNav post={post} prev={prev} next={next} />
    </article>
  );
}
