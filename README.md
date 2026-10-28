# 小猫踏步舞 · Kitten Stomp Dance

A 16-second vertical (1080×1920, 30 fps) animated music video for the track `public/song.mp3`, built in Remotion with hand-drawn SVG characters. Every move is driven by a beat map extracted from the audio.

**Story:** a shy kitten (Mimi) takes five nervous steps alone under a spotlight, one per intro stomp. Then the groove drops, the night bursts into color, and friends arrive on the song's stop-and-go restarts. The friends are Grey, Snow, and baby Bean, who lands on Mimi's head. In the soft breakdown everyone holds paws ("有你们真好"). The video ends with a big group jump on the final hit and a heart iris-out.

## Watch
The finished render is at [`demo/xiaomao-tabu-wu.mp4`](demo/xiaomao-tabu-wu.mp4) (1080×1920, 16.4 s, H.264 with AAC audio).

## Beat sync
- `beats.mjs` is a dependency-free beat/onset analyzer: FFT spectral flux, autocorrelation tempo, and grid snapping. The song is 136 BPM.
  `ffmpeg -i public/song.mp3 -ac 1 -ar 22050 -f f32le mono.f32 && node beats.mjs mono.f32 src/beats.json`
- `src/theme.ts` holds the cue map: the intro hits, groove steps, the silent-gap restarts, and the section times.
- `src/choreo.ts` turns time into a pose. Each foot lifts and lands exactly on a step, with squash on impact.
- Floor tiles, the camera pulse, stage beams, clouds and the title wave all key off the same step grid.

## Audio
The song isn't included in this repository because it's a third-party track. Put your copy at `public/song.mp3` before previewing or rendering. All cue times in `src/theme.ts` are tuned to that exact recording (15.05 s, 136 BPM).

## Run
Requires the shared toolchain (`. ~/.local/opt/env.sh`: Node 22, FFmpeg, `$CHS` headless Chrome).
```
npm install          # Remotion 4.0.484
npm run dev          # Remotion Studio preview
node qa.mjs 3.1 10.5 # render QA stills (seconds) to out/qa
./render.sh          # chunked, resumable render → out/xiaomao-tabu-wu.mp4
```
The fonts in `public/fonts` are Fredoka and ZCOOL KuaiLe, both from Google Fonts under the OFL license.
