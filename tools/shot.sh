#!/usr/bin/env bash
# shot.sh <url> <out.png> [width] [height] [full]
set -e
URL="${1:-http://127.0.0.1:4173/}"
OUT="${2:-/tmp/shot.png}"
W="${3:-1600}"
H="${4:-1000}"
FULL="${5:-}"
PROFILE=$(mktemp -d)
FLAGS="--headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=${W},${H} --user-data-dir=${PROFILE} --virtual-time-budget=4000 --no-first-run --no-default-browser-check --disable-extensions --font-render-hinting=none"
if [ -n "$FULL" ]; then
  google-chrome $FLAGS --screenshot="$OUT" --window-size="${W},${H}" "$URL" >/dev/null 2>&1
else
  google-chrome $FLAGS --screenshot="$OUT" "$URL" >/dev/null 2>&1
fi
rm -rf "$PROFILE"
echo "$OUT"
