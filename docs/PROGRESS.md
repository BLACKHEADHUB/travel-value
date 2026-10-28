# PROGRESS

갱신: 2026-10-28

## 단계
- [x] Phase 0 — 문서 4종, Next.js 초기화, verify 뼈대, 훅(.claude/settings.json), 에이전트 3종, git (브랜치 feat/phase-0-setup)
- [ ] Phase 1 · [ ] Phase 2 · [ ] Phase 3 · [ ] Phase 4 · [ ] Phase 5

## 현재 작업
없음 (Phase 1 시작 대기)

## 다음 할 일 (Phase 1)
zod 스키마(schema.ts) → validate-data 본구현 → fetch-climate.ts → score.ts/compare.ts + 테스트 → 샘플 5도시(+패키지) end-to-end.

## 알려진 이슈
- Stop 훅이 매 종료마다 verify(빌드 포함)를 돌려 느림. 거슬리면 빌드 제외 고려.
- Next 16 / Tailwind 4 / zod 4 사용 (최신 메이저).
