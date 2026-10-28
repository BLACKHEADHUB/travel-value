'use client';
import { useState } from 'react';

/** 현재 주소(여행 조건 포함) 공유: 지원하면 OS 공유 시트, 아니면 링크 복사 */
export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // 사용자가 공유를 취소했거나 권한 없음: 아무것도 하지 않음
    }
  };
  return (
    <button
      type="button"
      onClick={share}
      className="rounded-full bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
    >
      <span aria-live="polite">{done ? '링크 복사됨' : '공유'}</span>
    </button>
  );
}
