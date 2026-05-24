import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBookmark } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const scraped = await scrapeUrl(parsedUrl.href);

  // 소셜미디어 스크래핑 실패 시 Claude 추측 방지 — 고정 응답 반환
  if (!scraped.success && scraped.platform && scraped.platform !== "web") {
    const platformNames: Record<string, string> = {
      instagram: "인스타그램",
      threads: "Threads",
      youtube: "유튜브",
    };
    const name = platformNames[scraped.platform] || scraped.platform;
    return NextResponse.json({
      title: `${name} 게시물`,
      summary: `${name} 콘텐츠를 불러올 수 없습니다. 원문 링크를 통해 확인해주세요.`,
      tags: [name],
      raw_content: "",
      scraped: false,
    });
  }

  const analysis = await analyzeBookmark(
    parsedUrl.href,
    scraped.title,
    scraped.description,
    scraped.bodyText
  );

  return NextResponse.json({
    ...analysis,
    raw_content: scraped.bodyText,
    scraped: scraped.success,
    thumbnail_url: scraped.thumbnailUrl || null,
  });
}
