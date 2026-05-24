"use client";

import { useState } from "react";
import TagPill from "./TagPill";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  highlight?: boolean;
}

export default function BookmarkCard({
  bookmark,
  onDelete,
  highlight = false,
}: BookmarkCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const domain = (() => {
    try {
      return new URL(bookmark.url).hostname.replace("www.", "");
    } catch {
      return bookmark.url;
    }
  })();

  const formattedDate = new Date(bookmark.created_at).toLocaleDateString(
    "ko-KR",
    { month: "short", day: "numeric" }
  );

  async function handleDelete() {
    if (!confirm("이 북마크를 삭제할까요?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
      });
      if (res.ok) onDelete(bookmark.id);
    } finally {
      setDeleting(false);
    }
  }

  const isSummaryLong = bookmark.summary && bookmark.summary.length > 80;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        highlight
          ? "bg-indigo-950/40 border-indigo-500/50"
          : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
      }`}
    >
      {/* 카드 상단 — 클릭하면 펼쳐짐 */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug hover:text-indigo-400 transition-colors">
              {bookmark.title || domain}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{domain}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-gray-600 text-xs">
              {expanded ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* 요약 — 접힌 상태: 2줄, 펼친 상태: 전체 */}
        {bookmark.summary && (
          <p
            className={`mt-2 text-gray-400 text-xs leading-relaxed transition-all ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {bookmark.summary}
          </p>
        )}

        {/* 더보기 힌트 */}
        {!expanded && isSummaryLong && (
          <p className="mt-1 text-indigo-400 text-xs">더보기</p>
        )}

        {/* 태그 */}
        {bookmark.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {bookmark.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-600">{formattedDate}</div>
      </button>

      {/* 펼쳤을 때만 보이는 액션 영역 */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a] flex items-center justify-between">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            원문 열기 →
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
