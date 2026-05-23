"use client";

import { useEffect, useState, useCallback } from "react";
import BookmarkCard from "@/components/BookmarkCard";
import SearchBar from "@/components/SearchBar";
import AddBookmarkModal from "@/components/AddBookmarkModal";
import Nav from "@/components/BottomNav";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const [searchReason, setSearchReason] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    try {
      const res = await fetch("/api/bookmarks");
      if (res.ok) setBookmarks(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      setSearchIds(null);
      setSearchReason("");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchIds(data.ids || []);
        setSearchReason(data.reasoning || "");
      }
    } finally {
      setSearching(false);
    }
  }, []);

  function handleAdded(bookmark: Bookmark) {
    setBookmarks((prev) => [bookmark, ...prev]);
  }

  function handleDelete(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  const isSearchActive = searchIds !== null;
  const displayedBookmarks = isSearchActive
    ? bookmarks.filter((b) => searchIds.includes(b.id))
    : bookmarks;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navigation (bottom bar on mobile, sidebar on md+) */}
      <Nav
        onAddClick={() => setShowModal(true)}
        bookmarkCount={bookmarks.length}
      />

      {/* Main content — offset by sidebar on md+ */}
      <main className="md:ml-60">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-28 md:pb-10">

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">내 북마크</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {bookmarks.length}개 저장됨
              </p>
            </div>
          </div>

          {/* Tablet+ header */}
          <div className="hidden md:block mb-6">
            <h1 className="text-2xl font-bold text-white">북마크</h1>
            {isSearchActive && !searching && (
              <p className="text-sm text-gray-500 mt-1">
                검색 결과 {displayedBookmarks.length}개
                {searchReason && ` · ${searchReason}`}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="mb-5 md:mb-6">
            <SearchBar onSearch={handleSearch} searching={searching} />
            {/* Mobile search result hint */}
            {isSearchActive && !searching && (
              <div className="md:hidden mt-2 text-xs text-gray-500 px-1">
                {displayedBookmarks.length > 0 ? (
                  <span>
                    {displayedBookmarks.length}개 결과
                    {searchReason && ` · ${searchReason}`}
                  </span>
                ) : (
                  <span>검색 결과가 없어요</span>
                )}
              </div>
            )}
          </div>

          {/* Bookmark grid */}
          {loading ? (
            /* Skeleton — 1 col mobile, 2 col md, 3 col lg */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] animate-pulse"
                >
                  <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#2a2a2a] rounded w-1/3 mb-3" />
                  <div className="h-3 bg-[#2a2a2a] rounded w-full mb-1" />
                  <div className="h-3 bg-[#2a2a2a] rounded w-4/5 mb-3" />
                  <div className="flex gap-1.5">
                    <div className="h-5 bg-[#2a2a2a] rounded-full w-14" />
                    <div className="h-5 bg-[#2a2a2a] rounded-full w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              {isSearchActive ? (
                <>
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-400 font-medium text-lg">
                    일치하는 북마크가 없어요
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    다른 키워드로 검색해보세요
                  </p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🔖</div>
                  <p className="text-gray-400 font-medium text-lg">
                    아직 북마크가 없어요
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    + 버튼을 눌러 첫 번째 북마크를 추가해보세요
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  highlight={isSearchActive && searchIds?.includes(bookmark.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <AddBookmarkModal
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
