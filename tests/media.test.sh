#!/bin/bash
# Clip-wall + Play preview media checks. Run: bash tests/media.test.sh  (needs ffprobe)
cd "$(dirname "$0")/.." || exit 1
SLUGS="shabang lucia-bob frozone luigi fried-chicken-hour so-good"
MAX_EACH=1572864   # 1.5 MB
MAX_TOTAL=9437184  # 9 MB
pass=0; fail=0; total=0
check() { if [ "$2" = 1 ]; then echo "PASS  $1"; pass=$((pass+1)); else echo "FAIL  $1  $3"; fail=$((fail+1)); fi; }

for s in $SLUGS; do
  v="media/wall/$s.mp4"; p="media/wall/$s.jpg"
  [ -f "$p" ] && check "$s: poster exists" 1 || check "$s: poster exists" 0
  if [ ! -f "$v" ]; then check "$s: video exists" 0; continue; fi
  check "$s: video exists" 1
  codec=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$v")
  [ "$codec" = h264 ] && check "$s: h264" 1 || check "$s: h264" 0 "$codec"
  audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$v")
  [ -z "$audio" ] && check "$s: no audio" 1 || check "$s: no audio" 0
  wh=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$v")
  w=${wh%x*}; h=${wh#*x}
  [ $((w*16)) -eq $((h*9)) ] && check "$s: 9:16 ($wh)" 1 || check "$s: 9:16" 0 "$wh"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
  awk -v d="$dur" 'BEGIN{exit !(d>=6.0 && d<=8.0)}' && check "$s: 6-8 s ($dur)" 1 || check "$s: 6-8 s" 0 "$dur"
  size=$(stat -f %z "$v"); total=$((total+size))
  [ "$size" -le $MAX_EACH ] && check "$s: <=1.5MB ($size)" 1 || check "$s: <=1.5MB" 0 "$size"
done
[ $total -le $MAX_TOTAL ] && check "wall total <=9MB ($total)" 1 || check "wall total <=9MB" 0 "$total"

for s in emoji-arcade music-nerd ripple star-speller; do
  v="media/play/$s.mp4"; p="media/play/$s.jpg"
  [ -f "$p" ] && check "play/$s: poster exists" 1 || check "play/$s: poster exists" 0
  if [ ! -f "$v" ]; then check "play/$s: video exists" 0; continue; fi
  codec=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$v")
  [ "$codec" = h264 ] && check "play/$s: h264" 1 || check "play/$s: h264" 0 "$codec"
  audio=$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$v")
  [ -z "$audio" ] && check "play/$s: no audio" 1 || check "play/$s: no audio" 0
  wh=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$v")
  w=${wh%x*}; h=${wh#*x}
  [ $((w*10)) -eq $((h*16)) ] && check "play/$s: 16:10 ($wh)" 1 || check "play/$s: 16:10" 0 "$wh"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
  awk -v d="$dur" 'BEGIN{exit !(d>=6.0 && d<=12.0)}' && check "play/$s: 6-12 s ($dur)" 1 || check "play/$s: 6-12 s" 0 "$dur"
  size=$(stat -f %z "$v")
  [ "$size" -le 1048576 ] && check "play/$s: <=1MB ($size)" 1 || check "play/$s: <=1MB" 0 "$size"
done

echo; echo "$pass passed, $fail failed"
[ $fail -eq 0 ]
