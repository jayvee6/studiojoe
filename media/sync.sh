#!/usr/bin/env bash
# Upload media/dist/ to the Cloudflare R2 bucket behind media.studiojoe.dev.
#
#   bash media/build.sh && bash media/sync.sh
#   bash media/sync.sh --dry-run
#
# Credentials come from media/.env (gitignored). See media/.env.example.
# Uses rclone when available (incremental, much faster); otherwise falls back to
# `npx wrangler`, which needs no install but re-uploads every object.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$PWD"
DIST="$ROOT/media/dist"
ENV_FILE="$ROOT/media/.env"

DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

[[ -d "$DIST" ]] || { echo "No media/dist — run: bash media/build.sh" >&2; exit 1; }

if [[ -f "$ENV_FILE" ]]; then
  set -a; . "$ENV_FILE"; set +a
else
  echo "Missing $ENV_FILE — copy media/.env.example and fill it in." >&2
  exit 1
fi

: "${R2_BUCKET:?set R2_BUCKET in media/.env}"
: "${R2_ACCOUNT_ID:?set R2_ACCOUNT_ID in media/.env}"
VERSION="${MEDIA_VERSION:-v1}"

# Assets are immutable: the version prefix is the cache-buster. Bump MEDIA_VERSION
# when you re-encode, rather than trying to purge a long-lived cache.
CACHE="public, max-age=31536000, immutable"

echo "bucket : $R2_BUCKET"
echo "prefix : $VERSION/"
echo "source : $DIST"
count=$(find "$DIST" -type f \( -name '*.mp4' -o -name '*.jpg' -o -name '*.json' \) | wc -l | tr -d ' ')
bytes=$(find "$DIST" -type f -exec stat -f%z {} + | awk '{s+=$1} END{print s+0}')
echo "files  : $count  ($((bytes/1024)) KB)"
echo

if [[ $DRY -eq 1 ]]; then
  find "$DIST" -type f \( -name '*.mp4' -o -name '*.jpg' -o -name '*.json' \) \
    | sed "s|$DIST/|  would upload  $VERSION/|"
  exit 0
fi

if command -v rclone >/dev/null 2>&1; then
  echo "→ rclone (incremental)"
  : "${R2_ACCESS_KEY_ID:?set R2_ACCESS_KEY_ID in media/.env}"
  : "${R2_SECRET_ACCESS_KEY:?set R2_SECRET_ACCESS_KEY in media/.env}"

  # configure the remote entirely from env — no rclone.conf needed
  export RCLONE_CONFIG_R2_TYPE=s3
  export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
  export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
  export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
  export RCLONE_CONFIG_R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
  export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true

  rclone sync "$DIST" "R2:${R2_BUCKET}/${VERSION}" \
    --header-upload "Cache-Control: ${CACHE}" \
    --checksum --transfers 8 --progress
else
  echo "→ npx wrangler (no rclone installed; uploads every object)"
  echo "  tip: brew install rclone   # makes this incremental"
  : "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN in media/.env}"
  export CLOUDFLARE_ACCOUNT_ID="$R2_ACCOUNT_ID"

  while IFS= read -r f; do
    key="${f#$DIST/}"
    case "$f" in
      *.mp4)  ct="video/mp4" ;;
      *.jpg)  ct="image/jpeg" ;;
      *.json) ct="application/json" ;;
      *)      ct="application/octet-stream" ;;
    esac
    printf "  %s\n" "$VERSION/$key"
    npx --yes wrangler r2 object put "${R2_BUCKET}/${VERSION}/${key}" \
      --file="$f" --content-type="$ct" --cache-control="$CACHE" --remote >/dev/null
  done < <(find "$DIST" -type f \( -name '*.mp4' -o -name '*.jpg' -o -name '*.json' \))
fi

echo
echo "done. verify:"
echo "  curl -sI https://media.studiojoe.dev/${VERSION}/frozone-final-loop.mp4 | head -n 12"
echo
echo "then point the site at it — in redesign/v3-compositor.html set:"
echo "  MEDIA_BASE = 'https://media.studiojoe.dev/${VERSION}/'"
