import { defineConfig, defineCollection, s } from "velite";
import readingTime from "reading-time";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

const prettyCodeOptions: PrettyCodeOptions = {
  theme: {
    dark: "github-dark-dimmed",
    light: "github-light",
  },
  keepBackground: false,
  defaultLang: "plaintext",
};

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.md",
  schema: s
    .object({
      title: s.string().max(120),
      description: s.string().max(200),
      date: s.isodate(),
      slug: s.slug("global", ["admin"]),
      series: s
        .object({
          id: s.string(),
          name: s.string(),
          order: s.number().int().positive(),
          total: s.number().int().positive(),
        })
        .optional(),
      tags: s.array(s.string()).default([]),
      cover: s.string().nullable().optional(),
      draft: s.boolean().default(false),
      content: s.markdown({
        gfm: true,
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, prettyCodeOptions],
        ],
      }),
      metadata: s.metadata(),
      raw: s.raw(),
    })
    .transform((data) => {
      const stats = readingTime(data.raw ?? "");
      return {
        ...data,
        readingTime: Math.max(1, Math.round(stats.minutes)),
        wordCount: stats.words,
        url: `/posts/${data.slug}`,
      };
    }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
});
