import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getAllPosts, getSeriesPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { formatDate } from "@/lib/date";
import { JsonLd } from "@/components/json-ld";
import { buildBlogSchema } from "@/lib/jsonld-builders";

export default function Home() {
  const posts = getAllPosts();
  const series = getSeriesPosts("pi-lab-intensive");
  const seriesMeta = series[0]?.series;
  const latestDate = posts[0]?.date ?? new Date().toISOString();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-14 pb-8 sm:pt-20">
      <JsonLd id="ld-blog" data={buildBlogSchema(posts)} />
      {/* Masthead — 잡지 커버의 상단 크레딧 라인 */}
      <div className="running-folio mb-10 flex items-baseline justify-between">
        <span>canwefly-log</span>
        <span>Issue 04 — {formatDate(latestDate)}</span>
      </div>

      {/* Hero */}
      <section className="mb-20 sm:mb-24">
        <h1 className="font-serif text-[2.75rem] italic leading-[1.05] tracking-tight text-[color:var(--color-ink)] sm:text-[4.25rem] sm:leading-[1.02]">
          Writing on FE,
          <br />
          AI engineering,
          <br />
          <span className="not-italic font-sans font-light tracking-tighter">
            &amp;
          </span>{" "}
          the space between.
        </h1>

        <div className="mt-8 flex max-w-xl items-start gap-4">
          <span
            className="mt-2 h-px w-10 shrink-0 bg-[color:var(--color-accent)]"
            aria-hidden
          />
          <p className="leading-[1.8] text-[color:var(--color-muted)]">
            프론트엔드 6년차가 AI 시스템의 속을 들여다본 기록. 실패한 실험과,
            거기서 겨우 얻어낸 감각을 정리합니다.
          </p>
        </div>
      </section>

      {/* Featured series */}
      {seriesMeta && series.length > 0 && (
        <section className="mb-20">
          <div className="rule-dot mb-6">
            <span>Featured · N° 01</span>
          </div>
          <Link
            href={`/series/${seriesMeta.id}`}
            className="group block border-t border-[color:var(--color-hairline)] pt-6"
          >
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <p className="running-folio text-[color:var(--color-accent)]">
                  {seriesMeta.name}
                </p>
                <h2 className="mt-3 font-serif text-2xl italic leading-snug text-[color:var(--color-ink)] transition group-hover:text-[color:var(--color-accent)] sm:text-3xl">
                  PI Lab 8주 인텐시브,
                  <br />
                  내가 겪은 네 편의 이야기
                </h2>
                <p className="mt-4 max-w-xl leading-[1.8] text-[color:var(--color-muted)]">
                  &ldquo;왜 되는지도 알고 싶었다&rdquo;는 동기에서 시작해, 런타임
                  함정 4가지와 RAG 평가의 역설 5가지를 지나, 실무 구축 플레이북까지
                  이어지는 연재.
                </p>
              </div>
              <span className="hidden shrink-0 items-center gap-1 pt-2 font-mono text-xs uppercase tracking-widest text-[color:var(--color-muted)] transition group-hover:text-[color:var(--color-accent)] sm:inline-flex">
                전체 보기
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* All posts */}
      <section>
        <div className="rule-dot mb-10">
          <span>Contents · {posts.length} Pieces</span>
        </div>
        <ol className="list-none p-0">
          {posts.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} />
          ))}
        </ol>
      </section>
    </div>
  );
}
