"use client";

import { useState, useEffect, useCallback } from "react";

interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
}

interface AddBookmarkModalProps {
  onClose: () => void;
  onAdded: (bookmark: Bookmark) => void;
}

type Step = "input" | "analyzing" | "done" | "error";

export default function AddBookmarkModal({
  onClose,
  onAdded,
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [errorMsg, setErrorMsg] = useState("");
  const [visible, setVisible] = useState(false);

  // Trigger entry animation after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    const withProtocol =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;

    setStep("analyzing");
    setErrorMsg("");

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: withProtocol }),
      });
      if (!analyzeRes.ok) throw new Error("분석 실패");

      const analysis = await analyzeRes.json();

      const saveRes = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: withProtocol,
          title: analysis.title,
          summary: analysis.summary,
          tags: analysis.tags,
          raw_content: analysis.raw_content || "",
        }),
      });
      if (!saveRes.ok) throw new Error("저장 실패");

      const saved = await saveRes.json();
      setStep("done");
      onAdded(saved);
      setTimeout(onClose, 900);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "오류가 발생했습니다");
      setStep("error");
    }
  }

  return (
    /*
     * Container: flex column on mobile (panel anchored to bottom),
     * flex row on md+ (panel anchored to right).
     *
     * Animation trick:
     *   Mobile  → translateY: full→0 (slide up)
     *   Tablet+ → md:translateY reset to 0, md:translateX: full→0 (slide in from right)
     */
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:flex-row md:justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`
          relative bg-[#1a1a1a] border-[#2a2a2a] overflow-y-auto
          transition-transform duration-300 ease-out

          w-full rounded-t-3xl border border-b-0 max-h-[88vh]
          md:w-96 md:h-full md:max-h-none md:rounded-l-2xl md:rounded-r-none
          md:rounded-t-none md:border-l md:border-t md:border-b md:border-r-0

          ${
            visible
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:translate-x-full"
          }
        `}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden w-10 h-1 bg-[#3a3a3a] rounded-full mx-auto mt-3" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">북마크 추가</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {step === "input" || step === "error" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                  URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {step === "error" && (
                  <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!url.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>✨</span>
                AI 분석 후 저장
              </button>
              <p className="text-xs text-gray-600 text-center">
                제목·요약·태그를 자동으로 생성해드려요
              </p>
            </form>
          ) : step === "analyzing" ? (
            <div className="flex flex-col items-center py-12 gap-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">AI가 분석 중이에요</p>
                <p className="text-gray-500 text-sm mt-1">
                  제목, 요약, 태그를 생성하고 있어요
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">
                ✓
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">저장되었어요!</p>
                <p className="text-gray-500 text-sm mt-1">북마크에 추가됐어요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
