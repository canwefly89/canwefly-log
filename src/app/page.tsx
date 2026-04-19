import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getAllPosts, getSeriesPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { JsonLd } from "@/components/json-ld";
import { buildBlogSchema } from "@/lib/jsonld-builders";

export default function Home() {
  const posts = getAllPosts();
  const series = getSeriesPosts("pi-lab-intensive");
  const seriesMeta = series[0]?.series;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-14 pb-8 sm:pt-24">
      <JsonLd id="ld-blog" data={buildBlogSchema(posts)} />

      {/* Hero */}
      <section className="mb-20 sm:mb-28">
        <h1 className="text-[2.25rem] font-bold leading-[1.2] tracking-[-0.02em] text-[color:var(--color-ink)] sm:text-[3rem] sm:leading-[1.15]">
          Writing on FE, AI engineering,
          <br />
          and the space between.
        </h1>
        <p className="mt-6 max-w-xl leading-[1.85] text-[color:var(--color-muted)]">
          프론트엔드 개발자가 AI 엔지니어링을 공부하며 남기는 기록입니다.
        </p>
      </section>

      {/* Featured series */}
      {seriesMeta && series.length > 0 && (
        <section className="mb-20">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Featured series
          </p>
          <Link
            href={`/series/${seriesMeta.id}`}
            className="group block border-t border-[color:var(--color-hairline)] pt-6"
          >
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  {seriesMeta.name}
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight text-[color:var(--color-ink)] transition group-hover:text-[color:var(--color-accent)] sm:text-3xl">
                  PI Lab 8주 과정 정리, 6편
                </h2>
                <p className="mt-4 max-w-xl leading-[1.85] text-[color:var(--color-muted)]">
                  부트캠프 시작 동기, RAG·멀티모달 구축 사이클, 평가의 역설,
                  배포 인프라 함정, 실무 구축 순서까지 다룬 연재입니다.
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 pt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] transition group-hover:text-[color:var(--color-ink)] sm:inline-flex">
                전체 보기
                <ArrowUpRight size={12} strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* All posts */}
      <section>
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          All posts
        </p>
        <ol className="list-none p-0">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </ol>
      </section>
    </div>
  );
}
