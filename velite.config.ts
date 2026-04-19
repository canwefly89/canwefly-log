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
        // velite의 내장 gfm 옵션을 끄고, remark-gfm을 직접 옵션과 함께 추가.
        // singleTilde: false → 한국어 "0.3~0.4" 범위 표기가 strikethrough로 잡히지 않도록
        gfm: false,
        remarkPlugins: [[remarkGfm, { singleTilde: false }]],
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
