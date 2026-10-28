import { Quiz } from '@/components/Quiz';

export const metadata = { title: '내 조건으로 추천받기 — 몇 월에 어디 갈까' };

export default function QuizPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-extrabold">내 조건으로 추천받기</h1>
      <p className="mb-5 text-sm text-sub">
        다섯 가지만 답하면 그 조건으로 점수를 다시 매긴 추천 목록을 보여드려요.
      </p>
      <Quiz />
    </main>
  );
}
