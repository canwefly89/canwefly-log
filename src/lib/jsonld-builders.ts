import { siteConfig, absUrl } from "@/lib/seo";
import type { Post } from "@/lib/posts";

export function buildPersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author.name,
    alternateName: siteConfig.author.handle,
    url: siteConfig.author.url,
    sameAs: [siteConfig.author.url],
  } as const;
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  } as const;
}

export function buildBlogPostingSchema(post: Post) {
  const url = absUrl(post.url);
  const ogImage = absUrl(`/api/og?slug=${encodeURIComponent(post.slug)}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.description,
    image: [ogImage],
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    inLanguage: siteConfig.language,
    keywords: post.tags?.join(", ") ?? "",
    wordCount: post.wordCount,
    timeRequired: `PT${post.readingTime}M`,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.url,
    },
    isPartOf: post.series
      ? {
          "@type": "CreativeWorkSeries",
          name: post.series.name,
          position: post.series.order,
        }
      : undefined,
  } as const;
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.url),
    })),
  } as const;
}

export function buildBlogSchema(posts: Post[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    inLanguage: siteConfig.language,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: absUrl(p.url),
      datePublished: new Date(p.date).toISOString(),
    })),
  } as const;
}
