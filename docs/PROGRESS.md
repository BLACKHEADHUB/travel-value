# PROGRESS

갱신: 2026-10-28 · 저장소: https://github.com/BLACKHEADHUB/travel-value (private)

## 단계

- [x] Phase 0 — 문서, 초기화, verify 뼈대, 훅, 에이전트 정의
- [x] Phase 1 — schema/validate/fetch-climate/score/compare/data 로더/report, 샘플 5도시
- [x] Phase 2 — UI MVP (PR #1 머지)
- [x] Phase 3 — 25도시(6개 지역), 환율 자동 환산(fx.ts), 이미지 25/25(fetch-images), reviewer 검수 반영 (브랜치 feat/phase-3-data)
- [ ] Phase 4 · [ ] Phase 5

## 현재 작업

Phase 3 PR 리뷰/머지 대기.

## 다음 할 일 (Phase 4 전 데이터 보강 권장)

1. **1일 경비 없는 13곳** 보강: honolulu, losangeles, paris, rome, barcelona, prague, shanghai, tokyo, osaka, fukuoka, sapporo, saipan, auckland (Budget Your Trip 403 — Numbeo/관광청 자료를 브라우저로 열람)
2. **비자 공식 출처**: 외교부 해외안전여행 국가별 페이지로 통일(현재 7곳 출처 없음, 중국 한시 무비자 2026-12-31 만료 재확인, ETIAS 시행 여부)
3. **seasonLevel 정의·출처**: "여행 수요(항공·숙박) 성수기"로 정의하고 출처와 함께 재수집. 다낭·세부·싱가포르·발리는 출처 없어 null 처리함
4. flightHours 출처 필드 추가
5. Phase 4 기능: 비교 뷰(자유 vs 패키지·여행지 간), 즐겨찾기, 지도, 퀴즈, 다크모드, 이달의 TOP 5

## 데이터 현황 (25도시)

- 연중 대표 항공가 25/25, 월별 항공 76/300칸, 1일 경비 144/300칸(12/25도시, 전부 confidence low), 이미지 25/25
- 패키지 26개 / 12도시, termsClear=true 1개(사이판) → 자유 vs 패키지 판정 가능한 도시 사실상 0
- 패키지 없는 도시 13곳: bangkok, danang, cebu, singapore, bali, paris, rome, barcelona, prague, honolulu, losangeles, newyork, vancouver

## 알려진 이슈

1. 판매처 상세 페이지가 동적 렌더링이라 포함/불포함을 거의 확인 못 함 → 패키지 비교의 실효성 낮음. 수집 방식(브라우저 열람, 약관 범위) 재검토 필요.
2. 가격 정보 없는 도시는 가격 항목 제외 점수 → 카드 "가격 제외" + 목록 안내 문구로 표시.
3. ERA5 격자 기후는 해안·섬·고지대 편차(삿포로 1월 -10~-3℃ 등) → 상세에 안내 문구.
4. Stop 훅이 매 종료마다 verify(빌드 포함) 실행 — 느림.
