"use client";

import { useState, useRef } from "react";
import TagPill from "./TagPill";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  thumbnail_url?: string | null;
  is_favorite?: boolean;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onUpdate: (updated: Bookmark) => void;
  highlight?: boolean;
}

export default function BookmarkCard({
  bookmark,
  onDelete,
  onUpdate,
  highlight = false,
}: BookmarkCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [tags, setTags] = useState<string[]>(bookmark.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(bookmark.is_favorite ?? false);
  const [savingTags, setSavingTags] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace("www.", ""); }
    catch { return bookmark.url; }
  })();

  const formattedDate = new Date(bookmark.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  async function handleDelete() {
    if (!confirm("이 북마크를 삭제할까요?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
      if (res.ok) onDelete(bookmark.id);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: next }),
    });
    onUpdate({ ...bookmark, tags, is_favorite: next });
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function saveTags() {
    setSavingTags(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        setEditingTags(false);
      }
    } finally {
      setSavingTags(false);
    }
  }

  const isSummaryLong = bookmark.summary && bookmark.summary.length > 80;
  const hasThumbnail = !!bookmark.thumbnail_url;

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        highlight
          ? "bg-indigo-950/40 border-indigo-500/50"
          : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
      }`}
    >
      {/* 썸네일 */}
      {hasThumbnail && (
        <div className="relative w-full aspect-video bg-[#111]">
          <img
            src={bookmark.thumbnail_url!}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* 카드 상단 — 클릭하면 펼쳐짐 */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-snug">
              {bookmark.title || domain}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{domain}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 즐겨찾기 별 */}
            <span
              role="button"
              aria-label="즐겨찾기"
              onClick={toggleFavorite}
              className={`text-base leading-none transition-colors ${
                isFavorite ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"
              }`}
            >
              {isFavorite ? "★" : "☆"}
            </span>
            <span className="text-gray-600 text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* 요약 */}
        {bookmark.summary && (
          <p
            className={`mt-2 text-gray-400 text-xs leading-relaxed transition-all ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {bookmark.summary}
          </p>
        )}
        {!expanded && isSummaryLong && (
          <p className="mt-1 text-indigo-400 text-xs">더보기</p>
        )}

        {/* 태그 (편집 모드 아닐 때) */}
        {!editingTags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-600">{formattedDate}</div>
      </button>

      {/* 펼쳤을 때 액션 영역 */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a] space-y-3">

          {/* 태그 편집 */}
          {editingTags ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 text-xs hover:bg-red-900/50 hover:text-red-300 transition-colors"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag(); }
                  }}
                  placeholder="태그 입력 후 Enter"
                  className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={addTag}
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-2"
                >
                  추가
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveTags}
                  disabled={savingTags}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingTags ? "저장 중…" : "저장"}
                </button>
                <button
                  onClick={() => { setTags(bookmark.tags ?? []); setEditingTags(false); }}
                  className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setEditingTags(true); setTimeout(() => tagInputRef.current?.focus(), 50); }}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
            >
              태그 편집
            </button>
          )}

          {/* 원문 열기 / 삭제 */}
          <div className="flex items-center justify-between">
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
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
