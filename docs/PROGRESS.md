# PROGRESS

갱신: 2026-10-29 · 저장소: https://github.com/BLACKHEADHUB/travel-value (private) · 배포: https://travel-value-eight.vercel.app

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

- [x] 도시 확장 (브랜치 feat/expand-cities): 25 → 57곳, 새 지역 west-asia(중동·중앙·남아시아). 스테이징 병렬 수집(scripts/staging.ts) → reviewer 검수 반영 → 기후·환율·이미지 일괄 생성. 성수기 −10/비수기 +10 가격 점수 보정. QA 도시 수 하드코딩 제거.

## 다음 할 일 (선택)

1. 신뢰도 low 경비를 medium 이상 출처로 교체
2. 패키지: 포함/불포함 확인 상품 확보(판매처 상세 페이지 브라우저 열람, 약관 범위) — 현재 판정 가능 도시 0
3. 1일 경비 없는 20곳 보강(푸켓·쿠알라룸푸르·런던·이스탄불·인터라켄 등), 사마르칸트 비자 공식 출처(0404)
4. 체크박스 즉시 반영(낙관적 UI)

## 데이터 현황 (57도시, 2026-10-29)

- 연중 대표 항공가 57/57, 월별 항공 165/684칸, 1일 경비 444/684칸(37/57도시), 이미지 57/57, seasonLevel 180/684칸
- 비자 출처 56/57(사마르칸트 미확인 → null), 비행시간 출처 55/57(직항 없는 곳 null)
- 패키지 26개 / 12도시, 판정 가능 도시 0 (이번 확장은 패키지 미수집)
- 공식 원문 미확인 표시: 울란바토르 무비자(보도 기준), 멜버른 직항 운항 시기

## 알려진 이슈

1. 판매처 상세 페이지가 동적 렌더링이라 포함/불포함을 거의 확인 못 함 → 패키지 비교의 실효성 낮음. 수집 방식(브라우저 열람, 약관 범위) 재검토 필요.
2. 가격 정보 없는 도시는 가격 항목 제외 점수 → 카드 "가격 제외" + 목록 안내 문구로 표시.
3. ERA5 격자 기후는 해안·섬·고지대 편차(삿포로 1월 -10~-3℃ 등) → 상세에 안내 문구.
4. Stop 훅이 매 종료마다 verify(빌드 포함) 실행 — 느림.
