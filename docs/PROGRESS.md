# PROGRESS

갱신: 2026-10-28 · 저장소: https://github.com/BLACKHEADHUB/travel-value (private)

## 단계

- [x] Phase 0 — 문서, 초기화, verify 뼈대, 훅, 에이전트 정의
- [x] Phase 1 — schema/validate/fetch-climate/score/compare(+테스트 23)/data 로더/report, 샘플 5도시 end-to-end
- [x] Phase 2 — UI MVP (브랜치 feat/phase-2-ui, PR) : 월 선택(URL ?m), 카드, 필터(테마·기온·예산·비행시간·무비자·출발지)/정렬(점수·항공·쾌적도), 상세(12개월 차트·시즌·주의사항·점수 근거·출처·항공/숙소 딥링크), 자유여행 vs 패키지 비교(3/4박 토글)
- [ ] Phase 3 · [ ] Phase 4 · [ ] Phase 5

## 현재 작업

없음. Phase 2 PR 리뷰/머지 대기.

## 다음 할 일 (Phase 3)

1. **환율 자동화**: dailyCost를 현지 통화 원값(+출처)으로 저장하고 `scripts/fx`가 ECB 환율로 KRW 환산 — 수집기가 환율을 "가정"하는 문제 제거
2. 이미지: Commons 복구 확인 후 `npm run fetch:images`
3. 20~30도시 확장(지역별 수집, sonnet 이상 권장) → reviewer 검수
4. 패키지: 판매처 상세 페이지가 동적 렌더링이라 포함/불포함 확인이 거의 불가 — 수집 방식 재검토(브라우저 열람 등, 약관 범위 내)

## 데이터 현황 (샘플 5도시)

- 월별 항공 25/60칸, 연중 대표가 5/5, 1일 경비 36/60 (도쿄·파리 없음)
- 패키지 16개 중 termsClear=true 1개(방콕, 2025-03 출발 — 지난 가격) → 비교 판정 가능한 도시 0
- 이미지 0/5 (Wikimedia 503 지속, imageFile은 4~5곳 지정됨)

## 알려진 이슈

1. 경비 KRW 환산에 수집기가 가정한 환율 사용(방콕 1,400/USD, 시드니 945/AUD, 타이베이 45/TWD) → confidence low. 위 1번으로 해결 예정.
2. 가격 정보 없는 도시는 가격 항목이 빠져 점수가 상대적으로 높게 나올 수 있음 → 카드에 "가격 제외" 표시로 완화.
3. 비자: 외교부 0404 페이지 접근 실패로 2차 출처 다수. 방콕은 2026-09 태국 제도 변경 가능성 표시.
4. Stop 훅이 매 종료마다 verify(빌드 포함) 실행 — 느림.
5. 상세 차트 항공 최저/최고가 같으면(min=max) 선이 겹쳐 하나로 보임.
