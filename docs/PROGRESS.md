# PROGRESS

갱신: 2026-10-28 · 저장소: https://github.com/BLACKHEADHUB/travel-value (private) · 배포: https://travel-value-eight.vercel.app

## 단계

- [x] Phase 0 — 문서, 초기화, verify 뼈대, 훅, 에이전트 정의
- [x] Phase 1 — schema/validate/fetch-climate/score/compare/data 로더/report, 샘플 5도시
- [x] Phase 2 — UI MVP (PR #1 머지)
- [x] Phase 3 — 25도시(6개 지역), 환율 자동 환산(fx.ts), 이미지 25/25(fetch-images), reviewer 검수 반영 (브랜치 feat/phase-3-data)
- [x] 데이터 보강 (브랜치 feat/data-enrich): 경비 12→17도시, 비자 25/25 공식 출처, 시즌 정의+출처, 비행시간 출처 25/25
- [ ] Phase 4 · [ ] Phase 5

## 현재 작업

없음. Vercel 프로덕션 배포 완료(main, CLI 수동 배포). GitHub 연동 자동 배포는 미설정.

## 다음 할 일

1. Phase 4 기능: 비교 뷰(자유 vs 패키지·여행지 간), 즐겨찾기, 지도, 퀴즈, 다크모드, 이달의 TOP 5
2. 남은 경비 8곳(honolulu, losangeles, paris, rome, prague, taipei, fukuoka, saipan) — 출처가 범위만 주거나 403. 범위 값 처리 규칙(예: 출처 범위를 min/max로 저장)을 정하면 채울 수 있음
3. 비자: 공식 페이지 다수가 JS 렌더링/403이라 검색 요약 기반인 곳 있음(일본, 태국 90일, 발리 VoA 대상국) — 브라우저 열람으로 재확인 권장

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
