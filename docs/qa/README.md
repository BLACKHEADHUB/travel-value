# QA 증거 (2026-10-28, UI 개편 후 재촬영)

`npm run build && npm run qa` (Playwright, `tests/e2e/qa.e2e.ts`) 결과: **23 통과 / 1 건너뜀(데스크톱에서 모바일 전용 검사)**, 콘솔 오류 0.
원본 전체 화면 캡처(약 110MB)는 `qa-screenshots/`에 생성되며 git에는 넣지 않고, 아래는 상단만 줄인 사본입니다.

| 시나리오               | 데스크톱                  | 모바일(412px)            |
| ---------------------- | ------------------------- | ------------------------ |
| 월 변경(7월)           | desktop-home-month7.jpg   | mobile-home-month7.jpg   |
| 여행 조건(9박·기온·비) | desktop-trip-controls.jpg |                          |
| 상세(도쿄 4월 5박)     | desktop-detail-tokyo.jpg  | mobile-detail-tokyo.jpg  |
| 비교 3곳               | desktop-compare-table.jpg | mobile-compare-table.jpg |
| 즐겨찾기               |                           | mobile-favorites.jpg     |
| 지도(마커 25)          | desktop-map.jpg           |                          |
| 퀴즈 → 결과            | desktop-quiz-result.jpg   |                          |
| 점수 기준              | desktop-score.jpg         |                          |
| 다크모드               | desktop-dark.jpg          |                          |

QA에서 발견해 고친 문제: 모바일에서 카드·기온 슬라이더가 화면보다 넓어져(786px/455px) 저장·비교 버튼을 누를 수 없던 문제(`Explorer.tsx` 그리드 `grid-cols-1`+`min-w-0`, `TripControls.tsx` 슬라이더 폭).
남은 사소한 점: URL로만 상태가 바뀌는 체크박스(즐겨찾기만, 경비 정보 없는 곳도 보기)는 주소가 바뀐 뒤에 체크 표시가 바뀜(체감 지연 짧음).
