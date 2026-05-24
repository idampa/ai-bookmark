import * as cheerio from "cheerio";

export interface ScrapedContent {
  title: string;
  description: string;
  bodyText: string;
  success: boolean;
  platform?: string;
}

type Platform = "youtube" | "instagram" | "threads" | "web";

function detectPlatform(url: string): Platform {
  const hostname = new URL(url).hostname.replace("www.", "");
  if (hostname === "youtube.com" || hostname === "youtu.be" || hostname === "m.youtube.com") return "youtube";
  if (hostname === "instagram.com") return "instagram";
  if (hostname === "threads.net" || hostname === "threads.com") return "threads";
  return "web";
}

async function scrapeYoutube(url: string): Promise<ScrapedContent> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!res.ok) return { title: "", description: "", bodyText: "", success: false, platform: "youtube" };

    const data = await res.json();
    const title = data.title || "";
    const author = data.author_name || "";

    return {
      title,
      description: `${author}의 유튜브 영상`,
      bodyText: `유튜브 영상 제목: ${title}. 채널명: ${author}.`,
      success: true,
      platform: "youtube",
    };
  } catch {
    return { title: "", description: "", bodyText: "", success: false, platform: "youtube" };
  }
}

async function scrapeThreads(url: string): Promise<ScrapedContent> {
  // 1단계: oEmbed로 작성자와 HTML 임베드 내용 추출
  let author = "";
  try {
    const res = await fetch(
      `https://www.threads.net/oembed/?url=${encodeURIComponent(url)}`
    );
    if (res.ok) {
      const data = await res.json();
      author = data.author_name || "";

      let content = "";
      if (data.html) {
        const $ = cheerio.load(data.html);
        content =
          $("p[dir]").first().text().trim() ||
          $("p").first().text().trim() ||
          $("blockquote a p").first().text().trim() ||
          $("blockquote").clone().children("script").remove().end().text().trim().split("\n")[0].trim();
      }
      if (!content && data.title && data.title !== "Threads") {
        content = data.title;
      }
      if (content && content.length > 5) {
        return {
          title: content.slice(0, 60),
          description: content,
          bodyText: `Threads 게시물 작성자: @${author}. 내용: ${content}`,
          success: true,
          platform: "threads",
        };
      }
    }
  } catch {}

  // 2단계: 직접 페이지 OG 메타태그 스크래핑
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
      },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const ogDescription = $('meta[property="og:description"]').attr("content") || "";
      const ogTitle = $('meta[property="og:title"]').attr("content") || "";
      if (ogDescription) {
        return {
          title: ogDescription.slice(0, 60),
          description: ogDescription,
          bodyText: `Threads 게시물 작성자: @${author}. 제목: ${ogTitle}. 내용: ${ogDescription}`,
          success: true,
          platform: "threads",
        };
      }
    }
  } catch {}

  return { title: "", description: "", bodyText: "", success: false, platform: "threads" };
}

async function scrapeInstagram(url: string): Promise<ScrapedContent> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return { title: "", description: "", bodyText: "", success: false, platform: "instagram" };
  }

  try {
    // 캐러셀 특정 이미지 URL(img_index=N)은 쿼리스트링 제거하고 게시물 루트 URL만 사용
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");

    const res = await fetch(
      `https://instagram-scraper-20251.p.rapidapi.com/postdetail/?code_or_url=${encodeURIComponent(cleanUrl)}`,
      {
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "instagram-scraper-20251.p.rapidapi.com",
        },
      }
    );
    if (!res.ok) return { title: "", description: "", bodyText: "", success: false, platform: "instagram" };

    const data = await res.json();
    const post = data?.data?.items?.[0];
    const caption = post?.caption?.text ?? "";
    const username = post?.user?.username ?? post?.owner?.username ?? "";
    const isReel = post?.media_type === 2 || post?.product_type === "clips";
    const mediaLabel = isReel ? "릴스" : "게시물";

    return {
      title: `@${username}의 인스타그램 ${mediaLabel}`,
      description: caption.slice(0, 200),
      bodyText: `인스타그램 ${mediaLabel}. 작성자: @${username}. 내용: ${caption}`,
      success: true,
      platform: "instagram",
    };
  } catch {
    return { title: "", description: "", bodyText: "", success: false, platform: "instagram" };
  }
}

async function scrapeWeb(url: string): Promise<ScrapedContent> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { title: "", description: "", bodyText: "", success: false };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, aside, .ad, .advertisement").remove();

    const title =
      $("title").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      "";

    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    const bodyText = $("article, main, .content, .post, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);

    return { title, description, bodyText, success: true };
  } catch {
    return { title: "", description: "", bodyText: "", success: false };
  }
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const platform = detectPlatform(url);

  switch (platform) {
    case "youtube":   return scrapeYoutube(url);
    case "instagram": return scrapeInstagram(url);
    case "threads":   return scrapeThreads(url);
    default:          return scrapeWeb(url);
  }
}
