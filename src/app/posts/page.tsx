import type { Metadata } from "next";

import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
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

  return (
    <div className="mx-auto max-w-3xl px-6 pt-14 pb-8 sm:pt-24">
      <header className="mb-12 border-b border-[color:var(--color-hairline)] pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          All posts
        </p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[1.2] tracking-tight text-[color:var(--color-ink)] sm:text-[2.5rem]">
          모든 글
        </h1>
        <p className="mt-4 max-w-xl leading-[1.85] text-[color:var(--color-muted)]">
          총 {posts.length}편. 가장 최근 글부터 순서대로 정렬됩니다.
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
