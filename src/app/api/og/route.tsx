import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/posts";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";
  const post = slug ? getPostBySlug(slug) : null;

  const title = post?.title ?? "canwefly-log";
  const seriesLabel = post?.series
    ? `${post.series.name} · ${post.series.order}/${post.series.total}`
    : "Writing on FE, AI engineering, & the space between.";
  const dateLabel = post?.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "MMXXVI";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0e0e0c",
          color: "#ededeb",
          padding: "72px 80px",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Running folio */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#8a8a85",
            fontFamily: "monospace",
          }}
        >
          <span>canwefly-log</span>
          <span>Vol. 01 · MMXXVI</span>
        </div>

        {/* Accent rule */}
        <div
          style={{
            display: "flex",
            width: 72,
            height: 2,
            background: "#d97e51",
            marginTop: 72,
          }}
        />

        {/* Series label */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: post?.series ? "#d97e51" : "#8a8a85",
            marginTop: 28,
            fontFamily: "monospace",
          }}
        >
          {seriesLabel}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 58 : 74,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 24,
            maxWidth: "90%",
            fontFamily:
              '"Pretendard Variable", "Apple SD Gothic Neo", system-ui, sans-serif',
          }}
        >
          {title}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            fontSize: 20,
            color: "#8a8a85",
            fontFamily: "monospace",
            letterSpacing: "0.15em",
          }}
        >
          <span style={{ textTransform: "uppercase" }}>{dateLabel}</span>
          <span style={{ textTransform: "uppercase" }}>
            {post ? `${post.readingTime}분 읽기` : "Progress, not Perfection."}
          </span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
