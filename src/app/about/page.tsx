import type { Metadata } from "next";
import { absUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "소개",
  description:
    "프론트엔드 개발자가 AI 엔지니어링을 공부하며 남기는 기록.",
  alternates: { canonical: absUrl("/about") },
  openGraph: {
    title: "소개 · canwefly-log",
    description:
      "프론트엔드 개발자가 AI 엔지니어링을 공부하며 남기는 기록.",
    url: absUrl("/about"),
    type: "profile",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-14 pb-8 sm:pt-24">
      <header className="mb-12 border-b border-[color:var(--color-hairline)] pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          About
        </p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[1.2] tracking-tight text-[color:var(--color-ink)] sm:text-[2.5rem]">
          이곳에 대하여
        </h1>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          안녕하세요. 프론트엔드 6년차 개발자입니다. React, Next.js,
          TypeScript로 수만 명이 쓰는 사내 그룹웨어를 만들고 있습니다.
        </p>

        <p>
          <strong>canwefly-log</strong>는 이미 AI를 매일 쓰고 있는 개발자가
          &ldquo;내가 쓰고 있는 이 물건의 속은 왜 이렇게 되는지도
          궁금하다&rdquo;는 이유로 AI 엔지니어링을 공부하면서 남기는
          기록입니다. 이 공간에서 주로 다루는 것들:
        </p>

        <ul>
          <li>AI 시스템 (RAG, 멀티모달, 평가 체계) 의 실제 설계</li>
          <li>FastAPI · Python 생태계의 반직관적 함정들</li>
          <li>Cursor · Claude · MCP · 에이전트 하네스를 쓰면서 얻은 감각</li>
          <li>
            프론트엔드 엔지니어가 백엔드·데이터·ML 레이어로 내려갈 때의
            디테일
          </li>
        </ul>

        <h2>연락</h2>
        <ul>
          <li>
            이메일 · <a href="mailto:canwefly@kakao.com">canwefly@kakao.com</a>
          </li>
          <li>
            GitHub ·{" "}
            <a
              href="https://github.com/canwefly89"
              target="_blank"
              rel="noreferrer"
            >
              @canwefly89
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
