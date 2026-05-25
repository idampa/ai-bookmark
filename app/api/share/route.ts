import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBookmark } from "@/lib/claude";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  // url 또는 text 파라미터에서 URL 추출
  const raw = searchParams.get("url") || searchParams.get("text") || "";
  const urlMatch = raw.match(/https?:\/\/[^\s]+/);
  const targetUrl = urlMatch ? urlMatch[0] : raw.trim();

  if (!targetUrl) {
    return NextResponse.redirect(`${origin}/bookmarks`);
  }

  // 로그인 확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("next", `/api/share?url=${encodeURIComponent(targetUrl)}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 중복 URL 체크
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("url", targetUrl)
      .maybeSingle();

    if (existing) {
      return NextResponse.redirect(`${origin}/bookmarks`);
    }

    // 스크래핑 + AI 분석
    const scraped = await scrapeUrl(targetUrl);

    let title: string;
    let summary: string;
    let tags: string[];

    // 소셜미디어 스크래핑 실패 시 고정 응답
    if (!scraped.success && scraped.platform && scraped.platform !== "web") {
      const names: Record<string, string> = {
        instagram: "인스타그램", threads: "Threads", youtube: "유튜브",
      };
      const name = names[scraped.platform] || scraped.platform;
      title = `${name} 게시물`;
      summary = `${name} 콘텐츠를 불러올 수 없습니다. 원문 링크를 통해 확인해주세요.`;
      tags = [name];
    } else {
      const analysis = await analyzeBookmark(
        targetUrl,
        scraped.title,
        scraped.description,
        scraped.bodyText,
      );
      title = analysis.title;
      summary = analysis.summary;
      tags = analysis.tags;
    }

    await supabase.from("bookmarks").insert({
      user_id: user.id,
      url: targetUrl,
      title,
      summary,
      tags,
      raw_content: scraped.bodyText || "",
      thumbnail_url: scraped.thumbnailUrl || null,
    });
  } catch {
    // 실패해도 북마크 페이지로 이동
  }

  return NextResponse.redirect(`${origin}/bookmarks`);
}
