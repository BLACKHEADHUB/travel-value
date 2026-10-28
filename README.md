# 몇 월에 어디 갈까 — 시기별 가성비 여행지

언제(월), 며칠(1~13박), 어떤 날씨(선호 기온)를 고르면 같은 돈으로 가장 알차게 다녀올 해외 여행지를 골라 주는 정적 웹사이트입니다.

- 배포: https://travel-value-eight.vercel.app
- 도시 25곳 (일본·동남아·중화권·유럽·미주·대양주), 인천 출발, 원화 기준
- 기능: 여행 조건별 추천 목록과 TOP 5, 항목별 가성비 점수와 [점수 기준](https://travel-value-eight.vercel.app/score/), 상세(12개월 기온·강수·항공 차트, 시즌, 주의사항, 출처, 항공·숙소 검색 링크), 자유여행 vs 패키지 비교, 여행지 비교(최대 3곳), 즐겨찾기, 지도, 추천 퀴즈, 다크모드

> 항공값·경비·패키지 가격은 웹에서 모은 **대략적인 참고값**입니다. 값마다 출처·기준일·신뢰도를 남기고, 확인하지 못한 값은 지어내지 않고 "정보 없음"으로 둡니다. 현황은 [docs/DATA_REPORT.md](docs/DATA_REPORT.md)를 보세요.

## 실행

Node 20 이상.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # 정적 사이트 → out/
npm run verify       # 타입체크 + 린트 + 단위 테스트 + 데이터 검증 + 빌드 (변경 후 반드시)
```

브라우저 QA (Playwright, 스크린샷은 `qa-screenshots/`):

```bash
npx playwright install chromium   # 처음 한 번
npm run build && npm run qa
```

## 구조

```
data/
  destinations/<region>.json  도시 정보 + 12개월 항공·경비·시즌 (출처·기준일·신뢰도 포함)
  climate/<region>.json       기온·강수 (스크립트가 생성, 직접 수정 금지)
  packages/<region>.json      패키지 상품 샘플
  fx.json                     환율 스냅샷 (스크립트가 생성)
scripts/                      수집·검증·리포트 스크립트
src/lib/                      schema(zod) · score(점수) · compare(자유 vs 패키지) · prefs(여행 조건) · data(로더)
src/app, src/components       화면 (Next.js App Router, 정적 export)
docs/                         PLAN · PROGRESS · DECISIONS · COLLECTOR_BRIEF · DATA_REPORT
```

점수 가중치와 구간은 `src/lib/score.ts` 한 곳에서만 바꿉니다. 비교 로직은 `src/lib/compare.ts`에 있습니다.

## 데이터 추가·수정

1. **도시 추가**: `data/destinations/<region>.json`에 항목을 추가합니다. 형식은 `src/lib/schema.ts`, 수집 규칙은 [docs/COLLECTOR_BRIEF.md](docs/COLLECTOR_BRIEF.md)를 따릅니다.
   - 가격 값에는 `source`(URL), `asOf`(기준일), `confidence`(high/medium/low)가 필수입니다.
   - 1일 경비는 출처 통화 그대로 `dailyCost.local`에 넣고 원화 칸은 비워 둡니다(환율을 가정하지 않음).
   - 이미지는 Wikimedia Commons 파일명만 `imageFile`에 적습니다.
2. 스크립트를 순서대로 실행합니다.

```bash
npm run fetch:climate -- <region>   # 기온·강수 생성 (Open-Meteo, 2019–2023 월평균)
npm run fx                          # 현지 통화 경비 → 원화 환산 (최신 환율)
npm run fetch:images                # Commons 라이선스 확인 후 이미지 URL·출처 채움
npm run validate:data               # 스키마·이상치·출처 누락 검사
npm run data:report                 # docs/DATA_REPORT.md 갱신
```

3. 패키지는 `data/packages/<region>.json`에 추가합니다. 공개 상품 상세 페이지에서 확인한 사실(가격·박수·포함/불포함)만 적고, 판매처 문구·이미지는 복사하지 않습니다. 포함/불포함이 불명확하면 `termsClear: false`로 두고, 이런 상품은 가격 비교 통계에서 빠집니다.

## 가격 갱신(재수집)

- **기후·환율·이미지**: 위 스크립트를 다시 실행하면 최신 값으로 갱신됩니다. 인자 없이 실행하면 전체 지역이 대상입니다.
- **항공·경비·패키지·비자**: 웹 검색 기반이라 사람이나 에이전트가 수집합니다. Claude Code에서는 지역마다 `data-collector` 에이전트(`.claude/agents/`)에게 `docs/COLLECTOR_BRIEF.md`를 따르게 하고, 끝난 뒤 `npm run fx && npm run validate:data`를 실행합니다. 이어서 `reviewer` 에이전트로 검수합니다.

## 배포

Vercel 프로젝트 `travel-value`가 이 GitHub 저장소와 연결되어 있습니다.

- `main`에 머지하면 프로덕션에 자동 배포됩니다.
- PR을 올리면 미리보기(Preview) 주소가 생깁니다.
- 수동 배포: `vercel deploy --prod`
- 정적 export라 `out/`을 GitHub Pages 같은 다른 정적 호스팅에 올려도 됩니다.

## 알려진 한계

- 1일 경비가 없는 도시는 가격 항목을 빼고 점수를 매깁니다(카드에 "가격 제외"). 이달의 TOP 5는 가격이 반영된 도시만으로 뽑습니다.
- 패키지는 포함/불포함을 확인한 상품이 적어 자유여행 vs 패키지 판정이 대부분 "보류"입니다.
- 비행시간은 Kayak 노선 평균이라 실제 직항 시간표보다 조금 길 수 있습니다.
