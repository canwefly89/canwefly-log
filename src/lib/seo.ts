/**
 * 사이트 전역 SEO 설정. metadata / JSON-LD / sitemap 어디서든 같은 단일 진실을
 * 참조하도록 모은다.
 */
export const siteConfig = {
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://canwefly-log.vercel.app",
  name: "canwefly-log",
  alternateName: "canwefly log",
  description:
    "Writing on FE, AI engineering, and the space between. 프론트엔드 6년차의 AI 탐험 기록.",
  locale: "ko_KR",
  language: "ko",
  author: {
    name: "canwefly",
    handle: "canwefly89",
    url: "https://github.com/canwefly89",
    email: "canwefly@kakao.com",
  },
  defaultKeywords: [
    "AI 엔지니어링",
    "RAG",
    "FastAPI",
    "Next.js",
    "프론트엔드",
    "AI 부트캠프",
    "PI Lab",
    "파이랩",
    "MLOps",
    "Cursor",
    "Claude",
    "멀티모달",
    "벡터 DB",
    "임베딩",
  ],
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? undefined,
    naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? undefined,
  },
} as const;

export function absUrl(path: string): string {
  if (!path) return siteConfig.url;
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path.startsWith("/") ? "" : "/"}${path}`;
}
