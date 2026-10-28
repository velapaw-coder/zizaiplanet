#!/usr/bin/env bash
# Rebuild public/fonts/NotoSansSC-Plan.ttf from a full Noto Sans SC source.
# Requires: pyftsubset (fonttools), and a source TTF path as $1 or NOTO_SC_SRC.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-${NOTO_SC_SRC:-}}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: $0 /path/to/NotoSansSC-Regular.ttf" >&2
  exit 1
fi
CHARSET="$ROOT/scripts/noto-sc-plan-charset.txt"
OUT="$ROOT/public/fonts/NotoSansSC-Plan.ttf"
pyftsubset "$SRC" \
  --output-file="$OUT" \
  --text-file="$CHARSET" \
  --no-layout-closure \
  --layout-features='' \
  --no-hinting \
  --glyph-names --symbol-cmap --legacy-cmap \
  --notdef-glyph --notdef-outline --recommended-glyphs \
  --name-IDs='*' --name-legacy --name-languages='*' \
  --recalc-average-width --recalc-timestamp
ls -lah "$OUT"
