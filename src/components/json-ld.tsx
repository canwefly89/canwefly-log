/**
 * JSON-LD (schema.org) 임베드. 단일 또는 배열로 받아 한 개의 <script>로 출력.
 * Next.js 16 서버 컴포넌트에서 그대로 쓸 수 있다.
 */
type Json = Record<string, unknown> | Array<Record<string, unknown>>;

export function JsonLd({ data, id }: { data: Json; id?: string }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      id={id}
      type="application/ld+json"
      // suppressHydrationWarning은 React 19에서 dangerouslySetInnerHTML 정적 콘텐츠에 안전
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
