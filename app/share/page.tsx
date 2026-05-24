"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ShareHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"analyzing" | "done" | "error">("analyzing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const rawUrl = searchParams.get("url") || searchParams.get("text") || "";
    if (!rawUrl) { router.replace("/bookmarks"); return; }

    // URL 추출 (text에 URL이 섞여있을 경우 대비)
    const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : rawUrl;

    async function save() {
      try {
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!analyzeRes.ok) throw new Error("분석 실패");
        const analysis = await analyzeRes.json();

        const saveRes = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            title: analysis.title,
            summary: analysis.summary,
            tags: analysis.tags,
            raw_content: analysis.raw_content || "",
            thumbnail_url: analysis.thumbnail_url || null,
          }),
        });
        if (!saveRes.ok) throw new Error("저장 실패");

        setStatus("done");
        setTimeout(() => router.replace("/bookmarks"), 1200);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "오류 발생");
        setStatus("error");
      }
    }

    save();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-6 px-4">
      {status === "analyzing" && (
        <>
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">AI가 분석 중이에요</p>
            <p className="text-gray-500 text-sm mt-1">잠깐만 기다려주세요</p>
          </div>
        </>
      )}
      {status === "done" && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-4xl">✓</div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">저장됐어요!</p>
            <p className="text-gray-500 text-sm mt-1">북마크로 이동합니다</p>
          </div>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-4xl">✕</div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">저장 실패</p>
            <p className="text-gray-500 text-sm mt-1">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.replace("/bookmarks")}
            className="text-indigo-400 text-sm hover:text-indigo-300"
          >
            북마크로 돌아가기
          </button>
        </>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareHandler />
    </Suspense>
  );
}
