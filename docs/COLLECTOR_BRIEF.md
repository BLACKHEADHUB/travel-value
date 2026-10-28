# data-collector 작업 지침 (지역/도시 단위)

스키마 원본: `src/lib/schema.ts` (반드시 먼저 읽기). 기준일(asOf)은 수집한 날짜.

## 출력 파일
- `data/destinations/<region>.json` — `Destination[]` (기존 파일이 있으면 해당 도시만 추가/교체)
- `data/packages/<region>.json` — `PackageTour[]`
- 기온·강수는 **쓰지 않는다** (`npm run fetch:climate`가 `data/climate/`에 생성).

## 절대 규칙
1. **지어내지 않는다.** 출처에서 확인 못 한 값은 `null`. 추정했다면 `confidence: "low"`와 출처 URL을 남긴다.
2. 가격 값이 하나라도 있으면 `source`(URL)와 `asOf` 필수. 값이 전부 null이면 source/asOf도 null 가능.
3. 웹검색과 공개 페이지 열람만. 로그인, 봇 차단 우회, 대량 크롤링, robots.txt·약관 위반 금지. 막히면 그 페이지는 포기.
4. 판매처 상세 소개 문구·이미지를 복사하지 않는다. 상품명·가격·박수·포함/불포함 같은 사실만 짧게 구조화.

## 필드별 가이드
- **flightPrice (ICN 왕복, 1인, 이코노미, KRW)**: 월별 최저가 경향을 보여주는 페이지(Skyscanner/Kayak/Google Flights "가장 저렴한 달", 여행사·뉴스 기사 등)를 우선. 특정 월 근거가 없으면 그 달은 null. 연간 범위 하나만 있으면 모든 달에 같은 값을 넣지 말고, 근거가 있는 달만 채운다.
- **flightPriceTypical (연중 대표 왕복가, ICN, KRW)**: 월별 근거가 없을 때를 위한 값. 노선 단위로 출처가 있는 범위(예: Skyscanner/Kayak/Google Flights 노선 페이지의 "왕복 최저가/평균가", 항공사 특가 기사). min/max는 출처 범위 그대로, note에 "왕복 평균가 기준" 등 근거 설명. 월별 값을 이것으로 복사해 채우지 않는다.
- **dailyCost (1인 1일, 숙박+식비+교통, 중저가 기준, KRW)**: Budget Your Trip, Numbeo 등. 월별로 크게 안 변하면 12개월 같은 값 + 동일 source 허용(confidence medium). 환율 환산했다면 notes 없이 source에 원 출처만.
- **seasonLevel**: peak/shoulder/off — 관광청·여행 가이드의 성수기 설명 근거. 근거 없으면 null.
- **notes**: 우기, 태풍, 축제로 인한 가격 급등 등 짧게(한국어). 없으면 null.
- **visaInfo**: 한국 여권 기준. 외교부 해외안전여행 또는 대사관 페이지. ETA/ESTA/K-ETA류 전자허가는 required=true + note에 명칭.
- **flightHours.ICN**: 직항 기준 편도 시간(소수 1자리). GMP 직항 있으면 GMP에도, 없으면 null.
- **landmarks**: 3~5개, 한국어 이름.
- **imageFile**: Commons 파일명(`File:` 접두어 제외, 예: `Tokyo_Tower_2023.jpg`). Wikipedia 문서 대표 이미지나 Commons 검색에서 고른다. 라이선스 확인과 imageUrl/imageCredit 채우기는 `npm run fetch:images`가 한다(직접 쓰지 말 것).
- **image(구 방식, 참고)**: Wikimedia Commons만. `https://commons.wikimedia.org/w/api.php?action=query&titles=File:<파일명>&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&format=json` 로 작가(Artist)·라이선스(LicenseShortName) 확인. imageUrl은 thumburl(1200px), imageCredit.sourceUrl은 파일 설명 페이지. 확인 못 하면 imageUrl/imageCredit 모두 null.
- **packageTours (도시당 3~5개 목표)**: 목록 페이지만 보지 말고 **상품 상세 페이지**에서 포함/불포함·유류할증료·가이드경비·쇼핑/선택관광을 확인해야 termsClear=true. 상세 확인 못 하면 termsClear=false. 상품 개별 URL 필수(목록 URL 금지). 도시 상품이 아니면(예: 타이베이 수집인데 타이중 위주) 넣지 않는다. 하나투어/모두투어/노랑풍선/참좋은여행 등 공개 상품 페이지. nights=박수, departureMonth, priceKRW(성인 1인, 표시 출발일 기준), departureDate(알면), priceIncludesFuelSurcharge, included/excluded(짧은 명사구: "왕복항공", "4성급 호텔", "조식", "가이드/기사 경비" 등), extraKnownKRW(불포함 중 금액 명시된 합계, 예: 가이드경비 $50 → 원화), hasShopping, hasOptionalTours, termsClear(포함/불포함이 페이지에서 명확하면 true), url, asOf, confidence. 못 찾으면 있는 만큼만(0개도 가능, 빈 배열).

## 마무리
`npx tsx scripts/validate-data.ts` 로 검증 통과 확인 후, 메인에 **10줄 이내 요약만** 반환: 도시별 채운 월 수(항공/경비), null 비율, 패키지 개수, confidence low 항목, 막힌 사이트.
