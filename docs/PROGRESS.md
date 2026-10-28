# PROGRESS

갱신: 2026-10-28

## 단계
- [x] Phase 0 — 문서, 초기화, verify 뼈대, 훅, 에이전트 정의
- [x] Phase 1 — schema/validate/fetch-climate/score/compare(+테스트 23개)/data 로더/report, 샘플 5도시 end-to-end 통과
- [ ] Phase 2 · [ ] Phase 3 · [ ] Phase 4 · [ ] Phase 5

## 현재 작업
없음. **가격 데이터 수집 방식 결정 대기** (아래 이슈 1).

## 다음 할 일
1. 가격 데이터 보강 방식 확정 → 5도시 재수집
2. 이미지: Commons 복구 후 `scripts/fetch-images.ts`(UA 지정, 라이선스 자동 확인)로 수집
3. Phase 2 UI MVP

## 알려진 이슈
1. 샘플 5도시 월별 항공값 59/60칸 null, 경비는 방콕만(블로그 범위 중간값, low). haiku 수집기로는 월별 근거를 거의 못 찾음.
2. 이미지 5/5 없음 — Wikimedia가 2026-10-28 503(점검 페이지) 반환. 재시도 필요.
3. 패키지 14개 전부 termsClear=false(목록 페이지 기반, 포함/불포함 미확인) → 비교 통계 0건. 방콕 0개.
4. 타이베이 패키지 1개 제목이 "타이중 왕복" — 타이베이 상품인지 확인 필요. 시드니 패키지 url이 개별 상품이 아닌 목록 페이지.
5. 비자: 외교부 0404 페이지 404로 2차 출처 다수(도쿄·방콕), 타이베이는 2017 공지.
6. flightHours는 검색 스니펫 기반 low 신뢰.
7. Stop 훅이 매 종료마다 verify(빌드 포함) 실행 — 느림.
