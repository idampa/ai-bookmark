import * as cheerio from "cheerio";

export interface ScrapedContent {
  title: string;
  description: string;
  bodyText: string;
  success: boolean;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
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
