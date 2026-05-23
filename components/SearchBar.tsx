"use client";

import { useState, useCallback } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  searching: boolean;
}

export default function SearchBar({ onSearch, searching }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(query.trim());
    },
    [query, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-500 pointer-events-none">
          {searching ? (
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="AI 검색... (예: 스벅, 개발 공부)"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-500 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </form>
  );
}
