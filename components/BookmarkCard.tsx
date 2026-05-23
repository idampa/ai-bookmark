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

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        highlight
          ? "bg-indigo-950/40 border-indigo-500/50"
          : "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 hover:text-indigo-400 transition-colors">
              {bookmark.title || domain}
            </h3>
          </a>
          <p className="text-xs text-gray-500 mt-0.5">{domain}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 p-1"
          aria-label="삭제"
        >
          ×
        </button>
      </div>

      {bookmark.summary && (
        <p className="mt-2 text-gray-400 text-xs leading-relaxed line-clamp-2">
          {bookmark.summary}
        </p>
      )}

      {bookmark.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {bookmark.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-600">{formattedDate}</div>
    </div>
  );
}
