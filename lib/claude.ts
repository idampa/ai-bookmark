import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

export interface AnalysisResult {
  title: string;
  summary: string;
  tags: string[];
}

export async function analyzeBookmark(
  url: string,
  scrapedTitle: string,
  scrapedDescription: string,
  bodyText: string
): Promise<AnalysisResult> {
  const contentContext = [
    scrapedTitle && `제목: ${scrapedTitle}`,
    scrapedDescription && `설명: ${scrapedDescription}`,
    bodyText && `본문 일부:\n${bodyText}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = contentContext
    ? `다음 웹페이지를 분석해주세요.\n\nURL: ${url}\n\n${contentContext}`
    : `다음 URL을 분석해주세요: ${url}`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `${prompt}

아래 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:
{
  "title": "페이지를 잘 설명하는 제목 (50자 이내)",
  "summary": "이 페이지의 핵심 내용을 2문장으로 요약",
  "tags": ["태그1", "태그2", "태그3"]
}

규칙:
- title: 명확하고 간결하게
- summary: 2문장, 핵심 정보 위주
- tags: 3~5개, 한국어, 구체적인 키워드 (예: "스타벅스", "커피", "카페인", "음료", "브랜드")`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      title: scrapedTitle || new URL(url).hostname,
      summary: scrapedDescription || "내용을 불러올 수 없습니다.",
      tags: [],
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: parsed.title || scrapedTitle || new URL(url).hostname,
    summary: parsed.summary || scrapedDescription || "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
  };
}

export interface SearchResult {
  ids: string[];
  reasoning: string;
}

export async function searchBookmarks(
  query: string,
  bookmarks: { id: string; title: string; summary: string; tags: string[] }[]
): Promise<SearchResult> {
  if (bookmarks.length === 0) {
    return { ids: [], reasoning: "북마크가 없습니다." };
  }

  const bookmarkList = bookmarks
    .map(
      (b) =>
        `ID: ${b.id}\n제목: ${b.title}\n요약: ${b.summary}\n태그: ${b.tags.join(", ")}`
    )
    .join("\n\n---\n\n");

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `사용자가 "${query}"로 검색했습니다.

다음 북마크 목록에서 이 검색어와 관련된 것들을 찾아주세요.
동의어, 유추, 약어도 고려하세요 (예: "스벅" → "스타벅스", "AI" → "인공지능").

북마크 목록:
${bookmarkList}

아래 JSON 형식으로만 응답해주세요:
{
  "ids": ["관련_id_1", "관련_id_2"],
  "reasoning": "왜 이 북마크들이 검색어와 관련있는지 간단히"
}

관련 없으면 ids를 빈 배열로 반환하세요.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { ids: [], reasoning: "검색 결과를 파싱할 수 없습니다." };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    ids: Array.isArray(parsed.ids) ? parsed.ids : [],
    reasoning: parsed.reasoning || "",
  };
}
