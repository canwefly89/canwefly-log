import { posts as allPostsData } from "#site/content";

export type Post = (typeof allPostsData)[number];
export type Series = NonNullable<Post["series"]>;

const published = [...allPostsData]
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getAllPosts(): Post[] {
  return published;
}

export function getPostBySlug(slug: string): Post | undefined {
  return published.find((p) => p.slug === slug);
}

export function getSeriesPosts(seriesId: string): Post[] {
  return published
    .filter((p) => p.series?.id === seriesId)
    .sort((a, b) => (a.series?.order ?? 0) - (b.series?.order ?? 0));
}

export function getSeriesBySlug(seriesId: string): Series | undefined {
  const post = published.find((p) => p.series?.id === seriesId);
  return post?.series;
}

export function getAllSeries(): Series[] {
  const map = new Map<string, Series>();
  for (const p of published) {
    if (p.series && !map.has(p.series.id)) {
      map.set(p.series.id, p.series);
    }
  }
  return Array.from(map.values());
}

export function getAdjacentInSeries(post: Post): {
  prev?: Post;
  next?: Post;
} {
  if (!post.series) return {};
  const siblings = getSeriesPosts(post.series.id);
  const idx = siblings.findIndex((p) => p.slug === post.slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? siblings[idx - 1] : undefined,
    next: idx < siblings.length - 1 ? siblings[idx + 1] : undefined,
  };
}

export function getAllTags(): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const p of published) {
    for (const t of p.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
