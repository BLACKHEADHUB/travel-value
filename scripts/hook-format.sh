#!/bin/sh
# PostToolUse(Edit|Write): 수정된 파일을 prettier로 포맷
f=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input.file_path||"")}catch{}})')
case "$f" in
  *.ts|*.tsx|*.js|*.mjs|*.json|*.css|*.md) npx --no-install prettier --write "$f" >/dev/null 2>&1 ;;
esac
exit 0
