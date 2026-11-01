#!/usr/bin/env bash
# shot.sh <url> <out.png> [width] [height]
set -e
URL="${1:-http://127.0.0.1:4173/}"
OUT="${2:-/tmp/shot.png}"
W="${3:-1600}"
H="${4:-1000}"
PROFILE=$(mktemp -d)
google-chrome --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size="${W},${H}" --user-data-dir="${PROFILE}" --virtual-time-budget=6000 \
  --no-first-run --no-default-browser-check --disable-extensions --font-render-hinting=none \
  --screenshot="$OUT" "$URL" >/dev/null 2>&1
rm -rf "$PROFILE"
echo "$OUT"
