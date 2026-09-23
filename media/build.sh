#!/usr/bin/env bash
# Build web derivatives for studiojoe.dev from masters that live outside the repo.
# Reads media/sources.tsv, writes media/dist/ (clips + posters + manifest.json).
#
#   bash media/build.sh          # build anything missing or out of date
#   bash media/build.sh --force  # rebuild everything
#
# Nothing here touches the masters. dist/ is disposable — delete it and rerun.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$PWD"

MC="${MC:-$HOME/Documents/Comfy}"   # masters (symlink into JDrive — must be mounted)
SV="$ROOT/vfx"                      # existing web cuts
DIST="$ROOT/media/dist"
SRC="$ROOT/media/sources.tsv"

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

command -v ffmpeg  >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)" >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found" >&2; exit 1; }

if [[ ! -d "$MC" ]]; then
  echo "Masters dir missing: $MC" >&2
  echo "~/Documents/Comfy is a symlink into JDrive — mount the volume first." >&2
  exit 1
fi

mkdir -p "$DIST/posters"
built=0; skipped=0; failed=0
entries=()

while IFS=$'\t' read -r out src scale crf trim; do
  # skip comments, blanks and the header row
  [[ -z "${out:-}" || "$out" == \#* || "$out" == "out_name" ]] && continue

  src="${src/\$MC/$MC}"
  src="${src/\$SV/$SV}"

  if [[ ! -f "$src" ]]; then
    echo "  MISSING SOURCE  $out  <- $src" >&2
    failed=$((failed+1)); continue
  fi

  target="$DIST/$out"
  poster="$DIST/posters/${out%.mp4}.jpg"

  # rebuild only when the source is newer than the output
  if [[ $FORCE -eq 0 && -f "$target" && "$target" -nt "$src" ]]; then
    skipped=$((skipped+1))
  else
    trim_args=()
    if [[ "$trim" != "-" && -n "$trim" ]]; then
      trim_args=(-ss "${trim%%:*}" -t "${trim##*:}")
    fi

    # NB: guarded expansion — macOS bash 3.2 errors on empty arrays under `set -u`
    ffmpeg -nostdin -y -v error ${trim_args[@]+"${trim_args[@]}"} -i "$src" \
      -an -vf "scale=${scale}:flags=lanczos" \
      -c:v libx264 -profile:v high -crf "$crf" -preset veryslow -tune film \
      -movflags +faststart -pix_fmt yuv420p "$target"

    # poster ~15% in, so it is never a black first frame
    dur=$(ffprobe -v quiet -show_entries format=duration -of default=nw=1:nk=1 "$target")
    seek=$(awk -v d="$dur" 'BEGIN{ s=d*0.15; if(s<0.1) s=0; printf "%.2f", s }')
    ffmpeg -nostdin -y -v error -ss "$seek" -i "$target" -frames:v 1 -q:v 4 "$poster"

    built=$((built+1))
    printf "  built  %-26s %6s KB\n" "$out" "$(( $(stat -f%z "$target") / 1024 ))"
  fi

  # plain substitution, not `read` — ffprobe emits no trailing newline and `read`
  # then returns nonzero, which `set -e` treats as a fatal error
  # comma separator: ffprobe 8.x rejects `s=' '` with "Failed to parse option string"
  dims=$(ffprobe -v quiet -select_streams v:0 \
    -show_entries stream=width,height -of csv=p=0 "$target")
  w=${dims%%,*}; h=${dims##*,}
  entries+=("{\"file\":\"$out\",\"bytes\":$(stat -f%z "$target"),\"w\":$w,\"h\":$h,\"poster\":\"posters/${out%.mp4}.jpg\",\"posterBytes\":$(stat -f%z "$poster")}")
done < "$SRC"

# manifest — what sync.sh uploads and what the page can verify against
{
  echo "{"
  echo "  \"generated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"assets\": ["
  for i in "${!entries[@]}"; do
    sep=","; [[ $i -eq $(( ${#entries[@]} - 1 )) ]] && sep=""
    echo "    ${entries[$i]}$sep"
  done
  echo "  ]"
  echo "}"
} > "$DIST/manifest.json"

vid=$(find "$DIST" -maxdepth 1 -name '*.mp4' -exec stat -f%z {} + | awk '{s+=$1} END{print s+0}')
img=$(find "$DIST/posters" -name '*.jpg' -exec stat -f%z {} + | awk '{s+=$1} END{print s+0}')

echo
echo "built $built · unchanged $skipped · missing sources $failed"
printf "video  %6s KB\nposter %6s KB\nTOTAL  %6s KB\n" \
  "$((vid/1024))" "$((img/1024))" "$(( (vid+img)/1024 ))"
echo "-> $DIST"
[[ $failed -gt 0 ]] && exit 1 || exit 0
