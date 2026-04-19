import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type AnchorProps = ComponentPropsWithoutRef<"a">;

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

// Velite renders markdown → raw HTML string. 실제 타이포그래피는 globals.css 의
// .prose 레이어에서 정의. 여기선 래퍼만 제공한다.
export function MdxContent({ html }: { html: string }) {
  return (
    <article
      className="prose prose-neutral dark:prose-invert post-lead max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MdxLink(props: AnchorProps) {
  const { href = "", children, ...rest } = props;
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...(rest as AnchorProps)}>
      {children}
    </Link>
  );
}
