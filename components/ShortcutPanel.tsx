"use client";

import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

export default function ShortcutPanel({ onClose }: Props) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetch("/api/token")
      .then((r) => r.json())
      .then((d) => setToken(d.token || ""))
      .finally(() => setLoading(false));
  }, []);

  const shortcutUrl = token
    ? `https://ai-bookmark-kappa.vercel.app/api/share?url=[단축어 입력]&token=${token}`
    : "";

  async function copyToken() {
    await navigator.clipboard.writeText(shortcutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    if (!confirm("토큰을 재발급하면 기존 단축어가 동작하지 않아요. 계속할까요?")) return;
    setRegenerating(true);
    const res = await fetch("/api/token", { method: "POST" });
    const d = await res.json();
    setToken(d.token || "");
    setRegenerating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-3xl md:rounded-2xl w-full md:max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-base">iOS 단축어 설정</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">×</button>
        </div>

        <div className="space-y-2">
          <p className="text-gray-400 text-xs leading-relaxed">
            아래 URL을 iOS 단축어의 <span className="text-white font-medium">"URL 내용 가져오기"</span> 동작에 붙여넣으면,<br />
            공유하기 → 단축어 실행 시 <span className="text-white font-medium">앱 열지 않고 백그라운드로 저장</span>됩니다.
          </p>
        </div>

        {loading ? (
          <div className="h-10 bg-[#2a2a2a] rounded-xl animate-pulse" />
        ) : (
          <div className="bg-[#0f0f0f] rounded-xl p-3 text-[11px] text-gray-400 font-mono break-all leading-relaxed border border-[#2a2a2a]">
            {`https://ai-bookmark-kappa.vercel.app/api/share?url=[단축어 입력]&token=${token}`}
          </div>
        )}

        <button
          onClick={copyToken}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition-colors"
        >
          {copied ? "복사됨 ✓" : "단축어 URL 복사"}
        </button>

        <div className="border-t border-[#2a2a2a] pt-4 space-y-3">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">단축어 만들기 순서</p>
          <ol className="space-y-1.5 text-xs text-gray-400">
            <li className="flex gap-2"><span className="text-indigo-400 font-bold">1</span> 단축어 앱 → + → 동작 추가</li>
            <li className="flex gap-2"><span className="text-indigo-400 font-bold">2</span> <span><span className="text-white">"URL 내용 가져오기"</span> 검색 → 추가</span></li>
            <li className="flex gap-2"><span className="text-indigo-400 font-bold">3</span> URL 필드에 위 URL 붙여넣기</li>
            <li className="flex gap-2"><span className="text-indigo-400 font-bold">4</span> <span><span className="text-white">"알림 표시"</span> 추가 → "저장됨!" 입력</span></li>
            <li className="flex gap-2"><span className="text-indigo-400 font-bold">5</span> 단축어 이름 저장 → 공유 시트에서 실행 ON</li>
          </ol>
        </div>

        <button
          onClick={regenerate}
          disabled={regenerating}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors w-full text-center"
        >
          {regenerating ? "재발급 중…" : "토큰 재발급 (단축어 재설정 필요)"}
        </button>
      </div>
    </div>
  );
}
