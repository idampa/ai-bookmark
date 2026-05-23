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
  });
}
