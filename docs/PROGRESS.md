# PROGRESS

갱신: 2026-10-28 · 저장소: https://github.com/BLACKHEADHUB/travel-value (private) · 배포: https://travel-value-eight.vercel.app

## 단계

- [x] Phase 0 — 문서, 초기화, verify 뼈대, 훅, 에이전트 정의
- [x] Phase 1 — schema/validate/fetch-climate/score/compare/data 로더/report, 샘플 5도시
- [x] Phase 2 — UI MVP (PR #1 머지)
- [x] Phase 3 — 25도시(6개 지역), 환율 자동 환산(fx.ts), 이미지 25/25(fetch-images), reviewer 검수 반영 (브랜치 feat/phase-3-data)
- [x] 데이터 보강 (브랜치 feat/data-enrich): 경비 12→17도시, 비자 25/25 공식 출처, 시즌 정의+출처, 비행시간 출처 25/25
- [x] Phase 4 (브랜치 feat/phase-4): 여행 조건(월·1~13박·선호 기온 범위·비 회피) URL 설정 + 브라우저 점수 재계산, 카드 항목별 점수(가격 n/40 …), 점수 기준 페이지(/score), 이달의 TOP 5, 즐겨찾기·비교 담기(localStorage), 비교 뷰(/compare, 공유 링크), 지도(/map, Leaflet+OSM), 추천 퀴즈(/quiz), 다크모드
- [ ] Phase 5

## 현재 작업

Phase 4 PR 리뷰/머지 대기.

## 다음 할 일 (Phase 5)

1. qa 에이전트로 전 기능 점검 + 스크린샷(qa-screenshots/)
2. README (실행, 데이터 추가·수정, 재수집 명령, 배포)
3. 최종 보고: 확인값 vs 추정값 비율, 신뢰도 낮은 데이터, 패키지 확보 도시 수/샘플 부족 목록
4. 데이터: 경비 없는 8곳, 도시 확대(목표 40곳 안팎 — 데이터가 다 찬 도시 위주)

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
