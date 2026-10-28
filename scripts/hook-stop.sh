#!/bin/sh
# Stop: 작업 종료 전 verify 실행. 실패하면 종료를 막고 오류를 되돌려준다(루프 방지: stop_hook_active).
input=$(cat)
case "$input" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;; esac
[ -f package.json ] || exit 0
out=$(npm run verify 2>&1) || { echo "npm run verify 실패:" >&2; echo "$out" | tail -30 >&2; exit 2; }
exit 0
