"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ShortcutPanel from "./ShortcutPanel";

interface NavProps {
  onAddClick: () => void;
  bookmarkCount: number;
}

export default function Nav({ onAddClick, bookmarkCount }: NavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showShortcut, setShowShortcut] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Mobile: bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] z-40">
        <div className="flex items-center justify-around px-4 py-2">
          <button className="flex flex-col items-center gap-0.5 text-indigo-400 py-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span className="text-[10px]">북마크</span>
          </button>

          <button
            onClick={onAddClick}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-full shadow-lg shadow-indigo-500/25 flex items-center justify-center text-2xl transition-all"
            aria-label="북마크 추가"
          >
            +
          </button>

          <button
            onClick={() => setShowShortcut(true)}
            className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-300 transition-colors py-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-[10px]">단축어</span>
          </button>
        </div>
      </nav>

      {/* ── Tablet+: left sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-[#1a1a1a] border-r border-[#2a2a2a] flex-col z-40">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔖</span>
            <div>
              <p className="font-bold text-white text-sm leading-tight">AI Bookmark</p>
              <p className="text-xs text-gray-500 mt-0.5">{bookmarkCount}개 저장됨</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-300 bg-indigo-500/10">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span className="text-sm font-medium">북마크</span>
          </button>
          <button
            onClick={() => setShowShortcut(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm font-medium">iOS 단축어</span>
          </button>
        </nav>

        {/* Add + Logout */}
        <div className="p-4 border-t border-[#2a2a2a] space-y-2">
          <button
            onClick={onAddClick}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span>북마크 추가</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 flex items-center justify-center gap-2 transition-colors rounded-xl hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {showShortcut && <ShortcutPanel onClose={() => setShowShortcut(false)} />}
    </>
  );
}
