# PROGRESS

갱신: 2026-10-28 · 저장소: https://github.com/BLACKHEADHUB/travel-value (private) · 배포: https://travel-value-eight.vercel.app

## 단계

- [x] Phase 0 — 문서, 초기화, verify 뼈대, 훅, 에이전트 정의
- [x] Phase 1 — schema/validate/fetch-climate/score/compare/data 로더/report, 샘플 5도시
- [x] Phase 2 — UI MVP (PR #1 머지)
- [x] Phase 3 — 25도시(6개 지역), 환율 자동 환산(fx.ts), 이미지 25/25(fetch-images), reviewer 검수 반영 (브랜치 feat/phase-3-data)
- [x] 데이터 보강 (브랜치 feat/data-enrich): 경비 12→17도시, 비자 25/25 공식 출처, 시즌 정의+출처, 비행시간 출처 25/25
- [x] Phase 4 (브랜치 feat/phase-4): 여행 조건(월·1~13박·선호 기온 범위·비 회피) URL 설정 + 브라우저 점수 재계산, 카드 항목별 점수(가격 n/40 …), 점수 기준 페이지(/score), 이달의 TOP 5, 즐겨찾기·비교 담기(localStorage), 비교 뷰(/compare, 공유 링크), 지도(/map, Leaflet+OSM), 추천 퀴즈(/quiz), 다크모드
- [x] Phase 5 (브랜치 feat/phase-5): Playwright QA 23/23(+1 skip) 통과·증거 docs/qa/, 모바일 넘침 수정, README, 데이터 품질 리포트(docs/DATA_REPORT.md, npm run data:report), Vercel 자동 배포

- [x] UI 개편 (브랜치 feat/ui-refresh): 문장형 여행 조건, 접는 필터, 사진 중심 카드·TOP 5, 점수 막대, 상세 히어로·카드 섹션, 간결한 상단 메뉴+푸터, Pretendard

- [x] 날짜 지정·브랜드 (브랜치 feat/date-brand): 출발·귀국일 달력(범위·빠른 길이·월만 정하기, 모바일 바텀시트), 검색창형 조건 바, 브랜드 '제철여행'(잎 로고, 청록 포인트, 따뜻한 바탕)

## 현재 작업 (2026-10-29, 브랜치 feat/expand-cities)
**도시 25 → 57곳 확장 진행 중.** 수집 에이전트 9개가 `data/staging/<이름>.json`에 쓰는 중(japan-x, vn-th, sea-b, china-x, west-asia, europe-a, europe-b, americas-x, oceania-x). 새 지역 `west-asia`(중동·중앙·남아시아) 추가됨. 패키지는 이번엔 수집 안 함.

이어서 할 순서:
1. `ls data/staging` 로 9개 파일 확인 → 각각 `npx tsx scripts/staging.ts check <file>`
2. `npx tsx scripts/staging.ts merge` (지역 파일로 병합, 스테이징 비움)
3. `npm run fetch:climate` → `npm run fx` → `npm run fetch:images`(429 나면 잠시 후 재실행, 실패 파일명은 Commons 검색으로 교체) → `npm run validate:data`
4. 점수에 성수기·비수기 수요 반영: `src/lib/score.ts` 가격 항목에 seasonLevel 보정(예: peak −10, off +10), `/score` 페이지 설명·테스트 추가
5. reviewer 에이전트로 새 도시 검수 → 수정 → `npm run data:report`
6. `npm run build && npm run qa`, `npm run verify` → PROGRESS·DECISIONS 갱신 → 커밋 → PR

## 다음 할 일 (선택)

1. 1일 경비 없는 8곳 보강, 신뢰도 low 경비를 medium 이상 출처로 교체
2. 패키지: 포함/불포함 확인 상품 확보(판매처 상세 페이지 브라우저 열람, 약관 범위) — 현재 판정 가능 도시 0
3. 도시 확대(목표 40곳 안팎, 데이터가 다 찬 곳 위주)
4. 체크박스 즉시 반영(낙관적 UI)

## 데이터 현황 (25도시)

- 연중 대표 항공가 25/25, 월별 항공 76/300칸, 1일 경비 204/300칸(17/25도시, 전부 confidence low), 이미지 25/25
- 비자 출처 25/25(공식·대사관), 비행시간 출처 25/25(Kayak 노선 평균), seasonLevel은 Kayak 최고·최저가 달 위주로 부분 표시
- 패키지 26개 / 12도시, termsClear=true 1개(사이판) → 자유 vs 패키지 판정 가능한 도시 사실상 0
- 패키지 없는 도시 13곳: bangkok, danang, cebu, singapore, bali, paris, rome, barcelona, prague, honolulu, losangeles, newyork, vancouver

## 알려진 이슈

1. 판매처 상세 페이지가 동적 렌더링이라 포함/불포함을 거의 확인 못 함 → 패키지 비교의 실효성 낮음. 수집 방식(브라우저 열람, 약관 범위) 재검토 필요.
2. 가격 정보 없는 도시는 가격 항목 제외 점수 → 카드 "가격 제외" + 목록 안내 문구로 표시.
3. ERA5 격자 기후는 해안·섬·고지대 편차(삿포로 1월 -10~-3℃ 등) → 상세에 안내 문구.
4. Stop 훅이 매 종료마다 verify(빌드 포함) 실행 — 느림.
