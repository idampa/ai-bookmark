import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { scrapeUrl } from "@/lib/scraper";
import { analyzeBookmark } from "@/lib/claude";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error("[share] SUPABASE_SERVICE_ROLE_KEY not set");
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const raw = searchParams.get("url") || searchParams.get("text") || "";
  const token = searchParams.get("token");

  console.log("[share] ▶ raw url param:", raw);
  console.log("[share] ▶ token present:", !!token, "token prefix:", token?.slice(0, 8));

  const urlMatch = raw.match(/https?:\/\/[^\s]+/);
  const targetUrl = urlMatch ? urlMatch[0] : raw.trim();
  console.log("[share] ▶ targetUrl:", targetUrl);

  if (!targetUrl) {
    console.log("[share] ✗ no targetUrl — aborting");
    return NextResponse.json({ error: "url 파라미터가 없습니다" }, { status: 400 });
  }

  let userId: string | null = null;

  if (token) {
    // ── 토큰 인증 (iOS 단축어) ──
    // user_tokens는 anon SELECT 허용 정책이 있어야 함
    const anonClient = await createClient();
    const { data: tokenRow, error: tokenErr } = await anonClient
      .from("user_tokens")
      .select("user_id")
      .eq("share_token", token)
      .maybeSingle();

    console.log("[share] token lookup — data:", tokenRow, "error:", tokenErr?.message);

    if (tokenErr) {
      console.error("[share] ✗ token query error:", tokenErr.message);
      return NextResponse.json({ error: "토큰 조회 실패: " + tokenErr.message }, { status: 500 });
    }
    if (!tokenRow) {
      console.error("[share] ✗ token not found");
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }
    userId = tokenRow.user_id;
    console.log("[share] ✓ token valid, userId:", userId);
  } else {
    // ── 세션 인증 (브라우저) ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[share] session user:", user?.id ?? "none");
    if (!user) {
      const loginUrl = new URL("/auth/login", origin);
      loginUrl.searchParams.set("next", `/api/share?url=${encodeURIComponent(targetUrl)}`);
      return NextResponse.redirect(loginUrl);
    }
    userId = user.id;
  }

  // ── service role client로 실제 작업 (RLS 우회) ──
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY 미설정" },
      { status: 500 }
    );
  }

  // 중복 체크
  const { data: existing, error: dupErr } = await admin
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("url", targetUrl)
    .maybeSingle();

  console.log("[share] duplicate check — existing:", existing?.id ?? "none", "error:", dupErr?.message);

  if (existing) {
    console.log("[share] ✓ duplicate — skipping save");
    return NextResponse.json({ ok: true, duplicate: true, message: "이미 저장된 URL이에요" });
  }

  // 스크래핑
  console.log("[share] scraping:", targetUrl);
  let scraped;
  try {
    scraped = await scrapeUrl(targetUrl);
    console.log("[share] scrape result — success:", scraped.success, "platform:", scraped.platform, "title:", scraped.title?.slice(0, 50));
  } catch (e) {
    console.error("[share] ✗ scrape exception:", e);
    return NextResponse.json({ error: "스크래핑 실패" }, { status: 500 });
  }

  // AI 분석
  let title: string, summary: string, tags: string[];
  if (!scraped.success && scraped.platform && scraped.platform !== "web") {
    const names: Record<string, string> = {
      instagram: "인스타그램", threads: "Threads", youtube: "유튜브",
    };
    const name = names[scraped.platform] || scraped.platform;
    title = `${name} 게시물`;
    summary = `${name} 콘텐츠를 불러올 수 없습니다.`;
    tags = [name];
    console.log("[share] scrape failed, using fallback title:", title);
  } else {
    console.log("[share] calling Claude analyze...");
    try {
      const analysis = await analyzeBookmark(targetUrl, scraped.title, scraped.description, scraped.bodyText);
      title = analysis.title;
      summary = analysis.summary;
      tags = analysis.tags;
      console.log("[share] Claude result — title:", title, "tags:", tags);
    } catch (e) {
      console.error("[share] ✗ Claude exception:", e);
      return NextResponse.json({ error: "AI 분석 실패" }, { status: 500 });
    }
  }

  // 저장
  console.log("[share] inserting bookmark for userId:", userId);
  const { data: inserted, error: insertErr } = await admin
    .from("bookmarks")
    .insert({
      user_id: userId,
      url: targetUrl,
      title,
      summary,
      tags,
      raw_content: scraped.bodyText || "",
      thumbnail_url: scraped.thumbnailUrl || null,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[share] ✗ insert error:", insertErr.message, insertErr.details, insertErr.hint);
    return NextResponse.json({ error: "저장 실패: " + insertErr.message }, { status: 500 });
  }

  console.log("[share] ✓ saved bookmark id:", inserted.id, "title:", title);
  return NextResponse.json({ ok: true, id: inserted.id, title });
}
