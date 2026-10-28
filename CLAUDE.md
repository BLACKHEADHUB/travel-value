# 시기별 가성비 여행지 큐레이션

**작업 시작 시 `docs/PROGRESS.md` → `docs/PLAN.md` 순서로 읽는다.** 결정은 `docs/DECISIONS.md`에 한 줄씩 기록.

## 개요
월(1~12)을 고르면 해당 시기 가성비 여행지를 기온·항공값·경비·랜드마크와 함께 비교. 자유여행 vs 패키지 비교 포함. 한국어 UI, KRW, 출발지 기본 ICN(GMP 선택).

## 스택
Next.js App Router(`output:'export'`) · TypeScript · Tailwind · Recharts · Leaflet(P4) · zod · vitest · Playwright. 백엔드/DB 없음.

## 명령어
- `npm run dev` / `npm run build`
- `npm run verify` — typecheck+lint+test+validate-data+build (실패 시 "완료" 금지)
- `npm run fetch:climate` — Open-Meteo로 기온/강수 재생성 (직접 입력 금지)
- `npm run validate:data`

## 규칙
- 코드: TS strict, 컴포넌트 작게, 점수는 `src/lib/score.ts`, 비교는 `src/lib/compare.ts` 한 곳에만.
- 데이터: **지어내지 않는다.** 모르면 `null`(UI "정보 없음"). 가격 계열은 `source/asOf/confidence` 필수. 이미지는 출처·라이선스 필수.
- 패키지: 공개 페이지/웹검색만. 로그인·봇 차단 우회·대량 크롤링 금지. 사실 정보만, 판매처 문구·이미지 복사 금지. 포함/불포함 불명확하면 통계 제외.
- 데이터는 지역별 파일(`data/**/<region>.json`)로 쪼개 필요한 것만 읽는다.
- 항공·패키지 가격 옆에 "대략적 참고 가격, 실제 가격은 판매처/검색 링크에서 확인" + 기준일 표기.
- 단계 종료: verify 통과 → PROGRESS.md 갱신 → `git commit -m "phase-N: 요약"` → 2~3줄 보고.
- 서브에이전트(data-collector/reviewer/qa)는 요약만 반환.
