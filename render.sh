#!/usr/bin/env bash
# Renders the film in resumable muted chunks, then muxes the original song (padded with silence for the end card).
set -e
. ~/.local/opt/env.sh
cd "$(dirname "$0")"
mkdir -p out/chunks
COMMON="--browser-executable=$CHS --gl=swangle --concurrency=2 --timeout=120000"
RANGES="0-163 164-327 328-491"
for r in $RANGES; do
  f=out/chunks/v_$r.mp4
  [ -s "$f" ] && { echo "skip $r"; continue; }
  npx remotion render src/index.ts KittenStomp out/chunks/tmp_$r.mp4 --frames=$r --muted --crf=16 $COMMON > out/chunks/log_$r.txt 2>&1
  mv out/chunks/tmp_$r.mp4 "$f"; echo "done $r"
done
: > out/chunks/list.txt
for r in $RANGES; do echo "file 'v_$r.mp4'" >> out/chunks/list.txt; done
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -i public/song.mp3 -map 0:v -map 1:a -c:v copy -af "apad=whole_dur=16.4" -c:a aac -b:a 192k -movflags +faststart -t 16.4 out/xiaomao-tabu-wu.mp4
echo "muxed"
