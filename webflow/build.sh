#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./webflow/build.sh [BUILD_ID]
# If BUILD_ID not provided, uses timestamp.
BUILD_ID="${1:-$(date +%Y-%m-%d-%H%M)}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/webflow/src"
DIST_DIR="$ROOT_DIR/webflow/dist"

mkdir -p "$DIST_DIR"

echo "Build: $BUILD_ID"

# ---------------------------
# CSS bundle (expands @import url("...");)
# ---------------------------
CSS_ENTRY="$SRC_DIR/css/index.css"
CSS_OUT="$DIST_DIR/drafted-editor.css"

if [[ ! -f "$CSS_ENTRY" ]]; then
  echo "ERROR: Missing CSS entrypoint: $CSS_ENTRY" >&2
  exit 1
fi

: > "$CSS_OUT"
echo "/* drafted-editor.css | build=$BUILD_ID */" >> "$CSS_OUT"

bundle_css() {
  local file="$1"
  local file_dir
  file_dir="$(cd "$(dirname "$file")" && pwd)"

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Trim leading whitespace for easier matching
    local trimmed="$line"
    trimmed="${trimmed#"${trimmed%%[![:space:]]*}"}"

    # Match lines like: @import url("./path.css");
    if [[ "$trimmed" == @import\ url* ]]; then
      # Extract inside url("...") or url('...') or url(...)
      local rel
      rel="$(printf '%s' "$trimmed" | sed -nE 's/^@import[[:space:]]+url\((["'\''"]?)([^"'\''\)]+)\1\)[[:space:]]*;[[:space:]]*$/\2/p')"

      if [[ -n "${rel:-}" ]]; then
        local target="$file_dir/$rel"
        if [[ -f "$target" ]]; then
          echo "" >> "$CSS_OUT"
          echo "/* --- import: $rel (from $(basename "$file")) --- */" >> "$CSS_OUT"
          bundle_css "$target"
          echo "/* --- end import: $rel --- */" >> "$CSS_OUT"
          echo "" >> "$CSS_OUT"
        else
          echo "/* WARN: missing import $rel referenced from $file */" >> "$CSS_OUT"
        fi
      else
        # If it looks like import but we couldn't parse it, keep the line to avoid silent loss
        echo "/* WARN: could not parse import line: $trimmed */" >> "$CSS_OUT"
      fi
    else
      echo "$line" >> "$CSS_OUT"
    fi
  done < "$file"
}


bundle_css "$CSS_ENTRY"

# ---------------------------
# JS build (simple copy + optional build id injection)
# ---------------------------
JS_SRC="$SRC_DIR/drafted-editor.js"
JS_OUT="$DIST_DIR/drafted-editor.js"

if [[ -f "$JS_SRC" ]]; then
  # If your JS contains the placeholder __DRAFTED_BUILD_ID__, replace it.
  sed "s/__DRAFTED_BUILD_ID__/$BUILD_ID/g" "$JS_SRC" > "$JS_OUT"
else
  echo "WARN: Missing $JS_SRC (skipping JS build)."
fi

# ---------------------------
# Publish artifacts to root (what Webflow loads)
# ---------------------------
cp "$CSS_OUT" "$ROOT_DIR/drafted-editor.css"
if [[ -f "$JS_OUT" ]]; then
  cp "$JS_OUT" "$ROOT_DIR/drafted-editor.js"
fi

echo "OK: wrote $ROOT_DIR/drafted-editor.css"
if [[ -f "$JS_OUT" ]]; then
  echo "OK: wrote $ROOT_DIR/drafted-editor.js"
fi

# ---------------------------
# Publish "latest" pointer (stable URL for Webflow)
# ---------------------------
LATEST_SRC="$ROOT_DIR/webflow/latest.json"
LATEST_ROOT="$ROOT_DIR/latest.json"

cat > "$LATEST_SRC" <<JSON
{
  "build": "$BUILD_ID",
  "css": "https://draftedagent.github.io/drafted-webflow/drafted-editor.css?v=$BUILD_ID",
  "js": "https://draftedagent.github.io/drafted-webflow/drafted-editor.js?v=$BUILD_ID",
  "ts": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

cp "$LATEST_SRC" "$LATEST_ROOT"

echo "OK: wrote $LATEST_ROOT"
