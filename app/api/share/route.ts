import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBookmark } from "@/lib/claude";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const raw = searchParams.get("url") || searchParams.get("text") || "";
  const urlMatch = raw.match(/https?:\/\/[^\s]+/);
  const targetUrl = urlMatch ? urlMatch[0] : raw.trim();

  if (!targetUrl) {
    return NextResponse.redirect(`${origin}/bookmarks`);
  }

  const supabase = await createClient();
  const token = searchParams.get("token");
  let userId: string | null = null;

  if (token) {
    // 토큰 인증 (iOS 단축어 백그라운드 모드)
    const { data } = await supabase
      .from("user_tokens")
      .select("user_id")
      .eq("share_token", token)
      .maybeSingle();
    userId = data?.user_id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } else {
    // 세션 인증 (브라우저 모드)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set("next", `/api/share?url=${encodeURIComponent(targetUrl)}`);
      return NextResponse.redirect(loginUrl);
    }
    userId = user.id;
  }

  try {
    // 중복 체크
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("url", targetUrl)
      .maybeSingle();

    if (existing) {
      return token
        ? NextResponse.json({ ok: true, duplicate: true, message: "이미 저장된 URL이에요" })
        : NextResponse.redirect(`${origin}/bookmarks`);
    }

    const scraped = await scrapeUrl(targetUrl);

    let title: string, summary: string, tags: string[];

    if (!scraped.success && scraped.platform && scraped.platform !== "web") {
      const names: Record<string, string> = {
        instagram: "인스타그램", threads: "Threads", youtube: "유튜브",
      };
      const name = names[scraped.platform] || scraped.platform;
      title = `${name} 게시물`;
      summary = `${name} 콘텐츠를 불러올 수 없습니다.`;
      tags = [name];
    } else {
      const analysis = await analyzeBookmark(targetUrl, scraped.title, scraped.description, scraped.bodyText);
      title = analysis.title;
      summary = analysis.summary;
      tags = analysis.tags;
    }

    await supabase.from("bookmarks").insert({
      user_id: userId,
      url: targetUrl,
      title,
      summary,
      tags,
      raw_content: scraped.bodyText || "",
      thumbnail_url: scraped.thumbnailUrl || null,
    });

    return token
      ? NextResponse.json({ ok: true, title })
      : NextResponse.redirect(`${origin}/bookmarks`);
  } catch {
    return token
      ? NextResponse.json({ error: "저장 실패" }, { status: 500 })
      : NextResponse.redirect(`${origin}/bookmarks`);
  }
}
