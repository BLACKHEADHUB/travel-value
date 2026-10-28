# DECISIONS

- 2026-10-28 프로젝트 폴더는 ~/Documents/travel-value.
- 스택: Next.js 정적 export + Tailwind + Recharts, 배포 Vercel.
- 데이터 수집: 웹검색 + 가벼운 모델 서브에이전트, 확인 불가는 null, 신뢰도 표기.
- 이미지: Wikimedia Commons, 작가·라이선스 표기.
- 추가 요구(패키지 비교, packageTours 스키마, compare.ts, 수집 원칙, 하네스 반영)를 PLAN에 반영.
- 월/필터 상태는 URL 쿼리로 동기화(제안).
- 점수의 가격 항목: 기본은 지역 평균 대비, 전체 평균 병용 옵션 제공(제안).
- 2026-10-28 package.json 직접 구성(create-next-app은 비어있지 않은 폴더라 사용 안 함). eslint는 flat config 직접 실행.
- 2026-10-28 점수 가격 항목: 같은 지역 비교 가능 도시 3개 미만이면 전체 평균 사용(샘플 단계에서 지역 평균이 무의미).
- 패키지 박수 불일치는 1박 환산하지 않고 통계에서 제외 + 제외 개수 표시(환산은 근거 약함).
- 기후: Open-Meteo ERA5 2019–2023 5년, 일 최저/최고의 월평균, 연도별 월 강수합의 평균.
- 패키지 스키마에 extraKnownKRW(금액 확인된 불포함 합계), termsClear, departureDate 추가.
