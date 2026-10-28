import { defineConfig, devices } from '@playwright/test';

/**
 * QA 스위트 (npm run qa).
 * 전제: `npm run build`를 먼저 실행해 out/ 정적 결과물이 있어야 한다.
 * webServer는 빌드하지 않고 out/만 서빙한다 (빌드까지 넣으면 매번 너무 느림).
 * 테스트 파일은 *.e2e.ts — vitest(*.test.ts)와 겹치지 않게.
 */
const PORT = 4310;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.ts',
  outputDir: 'qa-screenshots/tmp/test-results',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx serve out -l ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
