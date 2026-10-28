# PLAN — 시기별 가성비 여행지 큐레이션 (승인 대기)

## 1. 스택 (확정)

Next.js(App Router, `output: 'export'`) + TypeScript + Tailwind + Recharts, 지도는 Leaflet(Phase 4, dynamic import).
스크립트: `tsx`, 검증: `zod`, 테스트: `vitest`, QA: Playwright. 린트/포맷: ESLint + Prettier. Vercel 배포.
제안: 월/필터 상태는 URL 쿼리(`?m=7&theme=…`)로 동기화 → 공유 가능. 정적 export라 서버 불필요.

## 2. 폴더 구조

```
CLAUDE.md
docs/ PLAN.md PROGRESS.md DECISIONS.md
data/
  destinations/<region>.json   # 도시 메타 + monthly[12] (가격계열: value/source/asOf/confidence)
  climate/<region>.json        # fetch-climate가 생성 (직접 수정 금지)
  packages/<region>.json       # packageTours[] (도시별)
scripts/ fetch-climate.ts validate-data.ts refresh.md(재수집 절차) build-data.ts
src/
  app/ page.tsx(월 선택+목록) d/[id]/page.tsx(상세, generateStaticParams) compare/ quiz/ map/
  components/ MonthPicker, DestinationCard, Filters, charts/, PackageCompare, ...
  lib/ schema.ts(zod) data.ts score.ts compare.ts links.ts(딥링크) format.ts
tests/ score.test.ts compare.test.ts
.claude/ settings.json(훅) agents/(reviewer, qa, data-collector)
```

## 3. 스키마 (zod, `src/lib/schema.ts`)

- `Sourced<T>` = `{ value: T|null, source: string|null, asOf: 'YYYY-MM-DD'|null, confidence: 'high'|'medium'|'low' }` — 가격 계열 전부(flightPriceMin/Max, dailyCost).
- destination: id, nameKo, country, region, coordinates, themes[], visaInfo, flightHours(ICN/GMP별 값 or 공통), landmarks[3~5], imageUrl, imageCredit{author,license,sourceUrl}.
- monthly[12]: month, avgTempMin/Max, rainfallMm(climate 스크립트 산출), flightPriceMin/Max, dailyCost(숙박+식비+교통 분해 가능), seasonLevel, notes.
- packageTours[]: vendor, title, nights, departureMonth, priceKRW, priceIncludesFuelSurcharge(bool|null), included[], excluded[], hasShopping(bool|null), hasOptionalTours(bool|null), url, asOf, confidence. 포함/불포함 불명확 → `termsClear=false`로 통계 제외.
- 출발지: ICN 기본, GMP 선택(항공값은 ICN 기준 수집, GMP는 노선 있는 도시만 별도 값/없으면 "정보 없음").
- 통화 KRW. 모르면 `null`, UI "정보 없음".

## 4. 가성비 점수 (`lib/score.ts`)

가중치 상수 객체 하나: 가격 40 / 기후 30 / 테마·볼거리 20 / 접근성 10. 가격 = (항공+경비×박수)의 **지역 평균 대비 비율**을 0~100 환산, 기후 = 체감 쾌적 구간(기온 18~27℃ 최적, 우기·폭염 감점), 테마 = 테마 수·랜드마크 수, 접근성 = 비행시간 + 비자.
null 항목은 제외 후 가중치 재분배(전부 null이면 점수 null). 개선 제안: 지역 평균 대신 **전체 평균 병용**(한 지역 내 편차가 작을 때 변별력 보완) — 기본은 요청대로 지역 평균, 설정으로 전환.

## 5. 패키지 비교 (`lib/compare.ts`)

- 자유여행 총액 = 항공(해당 월 min~max) + 일 경비 × 박수 → 범위.
- 패키지 = termsClear 샘플의 최저~중앙값. 박수 불일치 시 1박당 환산 + 경고, 샘플 <2 → "샘플 부족" 표시(판정 보류).
- 불포함 중 금액 아는 항목만 가산, 모르면 "추가 비용 발생 가능". 판정은 범위 문구("패키지가 약 N~M만 원 저렴할 수 있음").
- 상세 페이지: 상품 카드(판매처·상품명·박수·출발일·가격·포함/불포함·쇼핑/선택관광·링크) + 패키지/자유여행 판단 가이드 + "참고용, 판매처에서 확인" 문구.

## 6. 데이터 수집 원칙

- 기온·강수: Open-Meteo 과거 데이터(연도 5년 이상 평균)를 스크립트로 계산.
- 항공값·경비·패키지: 웹검색/공개 페이지 열람만. 로그인·우회·대량 크롤링 금지, 사실 정보만 저장(문구·이미지 복사 금지). 도시당 패키지 3~5개, 없으면 있는 만큼.
- 이미지: Wikimedia Commons API로 작가·라이선스 확인된 것만, 출처 표기(핫링크 vs 로컬 저장은 라이선스 확인 후 결정).
- 서브에이전트: data-collector(지역 6개, 가벼운 모델), reviewer(새 컨텍스트), qa. 결과는 요약만 반환.

## 7. 자동 검증 `npm run verify`

typecheck → lint → vitest(score, compare) → validate-data(12개월, min≤max, 이상치, source/asOf/url 누락, 중복 id, 이미지 출처, 패키지 박수 범위·총액 극단값 경고) → build.
훅: PostToolUse(Edit/Write) 시 prettier+eslint --fix, Stop 시 verify.

## 8. 단계별 체크리스트

- **P0**: 문서 4종, 프로젝트 초기화, verify 뼈대, 훅, git init.
- **P1**: 스키마·validate·fetch-climate·score/compare 테스트, 샘플 5도시(+패키지 샘플)로 end-to-end.
- **P2**: UI MVP — 월 선택, 카드, 필터/정렬, 상세(그래프·시즌·딥링크), 패키지 비교 섹션.
- **P3**: 20~30도시 확장(지역별 병렬 수집, 패키지 포함) → reviewer 검수(포함/불포함 동일선상 비교, 문구·이미지 복사 여부 체크 추가).
- **P4**: 비교 뷰(자유 vs 패키지, 여행지 간), 즐겨찾기, 지도, 퀴즈, 다크모드, 이달의 TOP5.
- **P5**: qa 전 기능 점검+스크린샷, README(실행/데이터/재수집/배포), Vercel 설정, 최종 보고(확인값 vs 추정값 비율, 신뢰도 낮은 목록, 패키지 확보 도시 수·샘플 부족 목록, 남은 이슈).

## 9. 위험·한계

항공값·패키지는 검색 기반이라 신뢰도 편차가 큼(그래서 confidence 필수). 판매처 페이지는 동적 렌더링·봇 차단이 많아 패키지 샘플이 일부 도시에서 부족할 수 있음 — 이 경우 있는 만큼만 저장.
