import { expect, test, type Page, type TestInfo } from '@playwright/test';

/** 전제: `npm run build` 후 실행 (playwright.config.ts 참고). */

const shot = (page: Page, info: TestInfo, name: string) =>
  page.screenshot({ path: `qa-screenshots/${info.project.name}-${name}.png`, fullPage: true });

/** 콘솔 에러·페이지 예외 수집 (지도 타일 등 외부 네트워크 실패는 제외) */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location().url ?? '';
    if (/tile\.openstreetmap|openstreetmap\.org/.test(loc + m.text())) return;
    errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

const listHeading = (page: Page) => page.locator('h2[aria-live="polite"]');
const cards = (page: Page) => page.locator('ul.grid > li');
const top5 = (page: Page) => page.locator('#top5-h');
/** 접힌 필터 패널 열기 */
const openFilters = async (page: Page) => {
  const details = page.locator('details', { has: page.locator('summary', { hasText: '필터' }) });
  if (!(await details.evaluate((el) => (el as HTMLDetailsElement).open)))
    await details.locator('summary').click();
};

/** "123만 원" → 1230000, "정보 없음" → null */
const parseWon = (s: string): number | null => {
  const m = s.replace(/,/g, '').match(/([\d.]+)만 원/);
  return m ? Math.round(Number(m[1]) * 10000) : null;
};

let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = trackErrors(page);
});
test.afterEach(async ({}, info) => {
  if (info.status === 'passed') expect(errors, 'console errors').toEqual([]);
});

test('home: 기본 월 + 7월 선택', async ({ page }, info) => {
  const now = new Date().getMonth() + 1;
  await page.goto('/');
  await expect(listHeading(page)).toContainText(`${now}월 ·`);
  await expect(page.getByRole('radio', { name: `${now}월` })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('radio', { name: '7월' }).click();
  await expect(listHeading(page)).toContainText('7월 ·');
  await expect(page).toHaveURL(/[?&]m=7(&|$)/);
  await shot(page, info, 'home-month7');
});

test('trip controls: 박수·기온·비', async ({ page }, info) => {
  await page.goto('/?m=7');
  await page.getByLabel('여행 기간').selectOption('9');
  await expect(listHeading(page)).toContainText('9박 10일');
  await expect(top5(page)).toContainText('9박 10일 가성비 TOP 5');
  await expect(page).toHaveURL(/[?&]n=9/);

  const range = page.getByText(/일평균 -?\d+~-?\d+℃/);
  await expect(range).toContainText('18~27℃');
  await page.getByLabel('날씨 취향').selectOption('warm');
  await expect(range).toContainText('24~32℃');
  await page.getByLabel('날씨 취향').selectOption('custom');
  await page.getByRole('slider').nth(0).fill('10');
  await expect(range).toContainText('10~');
  await page.getByRole('slider').nth(1).fill('30');
  await expect(range).toContainText('10~30℃');
  await expect.poll(() => new URL(page.url()).searchParams.get('t')).toBe('10~30');

  await openFilters(page);
  const rain = page.getByLabel('비 오는 달 피하기');
  await rain.click();
  await expect(rain).toBeChecked();
  await expect(page).toHaveURL(/[?&]rain=avoid/);
  await rain.click();
  await expect(rain).not.toBeChecked();
  await expect(page).not.toHaveURL(/rain=avoid/);
  await shot(page, info, 'trip-controls');
});

test('filters: 테마·예산·정렬', async ({ page }, info) => {
  await page.goto('/?m=4');
  const countOf = async () =>
    Number((await listHeading(page).innerText()).match(/추천 (\d+)곳/)![1]);
  const all = await countOf();
  expect(all).toBe(25);
  await openFilters(page);

  const themeBtn = page
    .locator('fieldset', { has: page.locator('legend', { hasText: '테마' }) })
    .getByRole('button')
    .first();
  await themeBtn.click();
  await expect(themeBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/[?&]theme=/);
  const themed = await countOf();
  expect(themed).toBeLessThanOrEqual(all);
  expect(await cards(page).count()).toBe(themed);
  await themeBtn.click();
  await expect(page).not.toHaveURL(/theme=/);

  await page.getByLabel(/예산 상한/).selectOption('100');
  await expect(page).toHaveURL(/[?&]budget=100/);
  const unknown = page.getByLabel(/경비 정보 없는 곳도 보기/);
  await expect(unknown).toBeVisible();
  const label = page.locator('label', { hasText: '경비 정보 없는 곳도 보기' });
  const hiddenMatch = (await label.innerText()).match(/\((\d+)곳 숨김\)/);
  const budgeted = await countOf();
  // URL(router.replace) 기반 제어 체크박스라 상태가 비동기로 바뀜 → click 후 대기
  await unknown.click();
  await expect(unknown).toBeChecked();
  await expect(page).toHaveURL(/[?&]unknown=1/);
  if (hiddenMatch) {
    await expect.poll(countOf).toBe(budgeted + Number(hiddenMatch[1]));
    await expect(label).not.toContainText('숨김');
  }
  await shot(page, info, 'filter-budget');

  await page.goto('/?m=4');
  await page
    .getByRole('combobox', { name: '정렬', exact: true })
    .selectOption({ label: '총액 낮은 순' });
  await expect(page).toHaveURL(/[?&]sort=cost/);
  const totals = await cards(page).locator('p', { hasText: '예상' }).locator('b').allInnerTexts();
  const known = totals.map(parseWon);
  const [a, b] = known;
  if (a !== null && b !== null) expect(a).toBeLessThanOrEqual(b);
  // 알려진 값끼리는 오름차순, 정보 없음은 뒤로
  const nums = known.filter((x): x is number => x !== null);
  expect(nums).toEqual([...nums].sort((x, y) => x - y));
  const firstNull = known.indexOf(null);
  if (firstNull >= 0) expect(known.slice(firstNull).every((x) => x === null)).toBe(true);
  await shot(page, info, 'sort-cost');
});

test('card: 항목별 점수 표기', async ({ page }, info) => {
  await page.goto('/?m=4');
  const p = cards(page).first().locator('dl');
  for (const k of ['가격', '날씨', '볼거리', '이동']) await expect(p).toContainText(k);
  await shot(page, info, 'card-breakdown');
});

test('detail: /d/tokyo/?m=4&n=5', async ({ page }, info) => {
  await page.goto('/d/tokyo/?m=4&n=5');
  await expect(page.locator('h1')).toContainText('도쿄');
  await expect(page.locator('#sum-h')).toHaveCount(1);
  await expect(page.locator('#chart-h')).toBeVisible();
  await expect(page.locator('section[aria-labelledby="chart-h"] svg').first()).toBeVisible();
  await expect(page.locator('#score-h')).toContainText('4월 · 5박 6일');
  await expect(page.locator('section[aria-labelledby="score-h"] tbody tr')).toHaveCount(4);
  await expect(page.locator('#pkg-h')).toBeVisible();
  await expect(page.locator('#src-h')).toBeVisible();
  await expect(page.locator('section[aria-labelledby="src-h"] li').first()).toBeVisible();
  await shot(page, info, 'detail-tokyo');

  await page.goto('/d/tokyo/?m=13');
  await expect(page.locator('h1')).toContainText('도쿄');
  await expect(page.locator('#score-h')).toContainText(`${new Date().getMonth() + 1}월`);
  await shot(page, info, 'detail-tokyo-m13');
});

test('favorites: 저장 → 메뉴 카운트 → 즐겨찾기만', async ({ page }, info) => {
  await page.goto('/?m=4');
  const card = cards(page).first();
  const name = await card.locator('h2 a').innerText();
  await card.getByRole('button', { name: `${name} 즐겨찾기` }).click();
  await expect(card.getByRole('button', { name: `${name} 즐겨찾기 해제` })).toHaveText('★');
  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(nav.getByRole('link', { name: '즐겨찾기 1곳' })).toBeVisible();
  await openFilters(page);
  await page.getByLabel(/즐겨찾기만/).click();
  await expect(page.getByLabel(/즐겨찾기만/)).toBeChecked();
  await expect(page).toHaveURL(/[?&]fav=1/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().locator('h2 a')).toHaveText(name);
  await shot(page, info, 'favorites');
});

test('compare: 3곳 담기, 4번째 비활성, 표·공유 링크', async ({ page }, info) => {
  await page.goto('/?m=4');
  const add = (i: number) =>
    cards(page)
      .nth(i)
      .getByRole('button', { name: /비교에 담기$/ });
  for (const i of [0, 1, 2]) await add(i).click();
  await expect(add(3)).toBeDisabled();
  const nav = page.getByRole('navigation', { name: '주요 메뉴' });
  const cmpLink = nav.getByRole('link', { name: /^비교/ });
  await expect(cmpLink).toContainText('3');
  await shot(page, info, 'compare-picked');

  await cmpLink.click();
  await expect(page).toHaveURL(/\/compare\//);
  await expect(page.locator('table thead th[scope="col"]')).toHaveCount(4); // 항목 열 + 3곳
  const share = page.getByRole('link', { name: '이 비교 열기' });
  expect(await share.getAttribute('href')).toMatch(/ids=[^&]+,[^&]+,[^&]+/);
  await shot(page, info, 'compare-table');
});

test('map: 마커 25개', async ({ page }, info) => {
  await page.goto('/map/?m=4');
  await expect(page.locator('.leaflet-overlay-pane path.leaflet-interactive')).toHaveCount(25, {
    timeout: 15_000,
  });
  await shot(page, info, 'map');
});

test('quiz: 5단계 → 추천 목록', async ({ page }, info) => {
  await page.goto('/quiz/');
  const next = page.getByRole('button', { name: '다음' });
  await page.getByRole('button', { name: '7월', exact: true }).click();
  await next.click();
  await page.getByRole('button', { name: '6박 7일' }).click();
  await next.click();
  await page.getByRole('button', { name: '정하지 않음' }).click();
  await next.click();
  await page.getByRole('button', { name: '휴양', exact: true }).click();
  await next.click();
  await page.getByRole('button', { name: /더워도 괜찮아요/ }).click();
  await shot(page, info, 'quiz-last-step');
  await page.getByRole('button', { name: '추천 보기' }).click();
  await expect(page).toHaveURL(/\/\?/);
  const url = new URL(page.url());
  expect(url.pathname).toBe('/');
  expect(url.searchParams.get('m')).toBe('7');
  expect(url.searchParams.get('n')).toBe('6');
  expect(url.searchParams.get('t')).toBe('24~32');
  await expect(listHeading(page)).toContainText('7월 · 6박 7일');
  await shot(page, info, 'quiz-result');
});

test('score: 4개 항목', async ({ page }, info) => {
  await page.goto('/score/');
  await expect(page.locator('main table tbody tr')).toHaveCount(4);
  await shot(page, info, 'score');
});

test('dark mode toggle', async ({ page }, info) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await page.getByRole('button', { name: '다크 모드' }).click();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/); // 저장값 유지
  await shot(page, info, 'dark');
});

test('mobile: 가로 넘침 없음', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile 전용');
  for (const [path, name] of [
    ['/?m=4', 'overflow-home'],
    ['/compare/?m=4&ids=tokyo,osaka,bangkok', 'overflow-compare'],
    ['/d/bangkok/?m=4', 'overflow-detail-bangkok'],
    ['/map/?m=4', 'overflow-map'],
  ] as const) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    await shot(page, info, name);
    expect.soft(sw, `${path} scrollWidth`).toBeLessThanOrEqual(cw);
  }
});
