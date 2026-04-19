import type { MetadataRoute } from "next";
import { getAllPosts, getAllSeries } from "@/lib/posts";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://canwefly-log.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const posts = getAllPosts();
  const series = getAllSeries();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, priority: 1.0 },
    { url: `${siteUrl}/posts`, lastModified: now, priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified: now, priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}${p.url}`,
    lastModified: p.date,
    priority: 0.8,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${siteUrl}/series/${s.id}`,
    lastModified: now,
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...seriesRoutes];
}
