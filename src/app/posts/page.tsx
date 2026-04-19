import type { Metadata } from "next";

import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { formatDate } from "@/lib/date";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "글",
  description: "canwefly-log의 모든 글 목록.",
  alternates: { canonical: absUrl("/posts") },
  openGraph: {
    title: "글 · canwefly-log",
    description: "canwefly-log의 모든 글 목록.",
    url: absUrl("/posts"),
    type: "website",
  },
};

export default function PostsIndex() {
  const posts = getAllPosts();
  const latestDate = posts[0]?.date ?? new Date().toISOString();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-14 pb-8 sm:pt-20">
      <div className="running-folio mb-10 flex items-baseline justify-between">
        <span>Index</span>
        <span>
          {posts.length} Pieces · Updated {formatDate(latestDate)}
        </span>
      </div>

      <header className="mb-12 border-b border-[color:var(--color-hairline)] pb-10">
        <p className="running-folio text-[color:var(--color-accent)]">
          All Writings
        </p>
        <h1 className="mt-3 font-serif text-[2.5rem] italic leading-[1.08] tracking-tight text-[color:var(--color-ink)] sm:text-[3rem]">
          모든 글
        </h1>
        <p className="mt-4 max-w-xl leading-[1.8] text-[color:var(--color-muted)]">
          가장 최근 글부터 순서대로. 연재는{" "}
          <span className="text-[color:var(--color-accent)]">
            테라코타 라벨
          </span>
          로 표시됩니다.
        </p>
      </header>

      <ol className="list-none p-0">
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </ol>
    </div>
  );
}
