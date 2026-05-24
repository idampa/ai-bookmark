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
  thumbnail_url?: string | null;
  is_favorite?: boolean;
}

type SortOrder = "desc" | "asc";
type FilterMode = "all" | "favorites";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const [searchReason, setSearchReason] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => { fetchBookmarks(); }, []);

  async function fetchBookmarks() {
    try {
      const res = await fetch("/api/bookmarks");
      if (res.ok) setBookmarks(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = useCallback(async (query: string) => {
    if (!query) { setSearchIds(null); setSearchReason(""); return; }
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
    } finally { setSearching(false); }
  }, []);

  function handleAdded(bookmark: Bookmark) {
    setBookmarks((prev) => [bookmark, ...prev]);
  }

  function handleDelete(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleUpdate(updated: Bookmark) {
    setBookmarks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  const isSearchActive = searchIds !== null;

  const displayedBookmarks = (() => {
    let list = isSearchActive
      ? bookmarks.filter((b) => searchIds!.includes(b.id))
      : [...bookmarks];

    if (filterMode === "favorites") list = list.filter((b) => b.is_favorite);

    if (!isSearchActive) {
      list = list.sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortOrder === "desc" ? -diff : diff;
      });
    }

    return list;
  })();

  const favoriteCount = bookmarks.filter((b) => b.is_favorite).length;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Nav onAddClick={() => setShowModal(true)} bookmarkCount={bookmarks.length} />

      <main className="md:ml-60">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-5 md:pt-8 pb-28 md:pb-10">

          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white">내 북마크</h1>
              <p className="text-xs text-gray-500 mt-0.5">{bookmarks.length}개 저장됨</p>
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
          <div className="mb-4">
            <SearchBar onSearch={handleSearch} searching={searching} />
            {isSearchActive && !searching && (
              <div className="md:hidden mt-2 text-xs text-gray-500 px-1">
                {displayedBookmarks.length > 0
                  ? <span>{displayedBookmarks.length}개 결과{searchReason && ` · ${searchReason}`}</span>
                  : <span>검색 결과가 없어요</span>}
              </div>
            )}
          </div>

          {/* 필터/소팅 컨트롤 */}
          {!isSearchActive && (
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {/* 즐겨찾기 필터 */}
              <button
                onClick={() => setFilterMode(filterMode === "favorites" ? "all" : "favorites")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterMode === "favorites"
                    ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/40"
                    : "bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a] hover:border-[#3a3a3a]"
                }`}
              >
                ★ 즐겨찾기
                {favoriteCount > 0 && (
                  <span className="bg-yellow-400/30 text-yellow-400 px-1.5 rounded-full text-[10px]">
                    {favoriteCount}
                  </span>
                )}
              </button>

              {/* 날짜 소팅 */}
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-500 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
              >
                {sortOrder === "desc" ? "최신순 ↓" : "오래된순 ↑"}
              </button>
            </div>
          )}

          {/* Bookmark grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] animate-pulse">
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
              {filterMode === "favorites" ? (
                <>
                  <div className="text-5xl mb-4">★</div>
                  <p className="text-gray-400 font-medium text-lg">즐겨찾기한 북마크가 없어요</p>
                  <p className="text-gray-600 text-sm mt-2">북마크 카드의 ☆을 눌러 추가하세요</p>
                </>
              ) : isSearchActive ? (
                <>
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-400 font-medium text-lg">일치하는 북마크가 없어요</p>
                  <p className="text-gray-600 text-sm mt-2">다른 키워드로 검색해보세요</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🔖</div>
                  <p className="text-gray-400 font-medium text-lg">아직 북마크가 없어요</p>
                  <p className="text-gray-600 text-sm mt-2">+ 버튼을 눌러 첫 번째 북마크를 추가해보세요</p>
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
                  onUpdate={handleUpdate}
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
