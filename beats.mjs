// Beat / onset analysis for a mono f32le 22050 Hz file. Pure JS, no deps.
// Usage: node beats.mjs mono.f32 out.json
import fs from 'node:fs';

const [, , inPath, outPath] = process.argv;
const SR = 22050;
const buf = fs.readFileSync(inPath);
const x = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const HOP = 256, WIN = 1024;
const FPS_ENV = SR / HOP;
const nFrames = Math.floor((x.length - WIN) / HOP);

// Radix-2 FFT magnitude
function fftMag(frame) {
  const n = frame.length, re = Float64Array.from(frame), im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
  const m = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) m[i] = Math.hypot(re[i], im[i]);
  return m;
}

const hann = Float64Array.from({ length: WIN }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / WIN));
const binHz = SR / WIN;
const flux = new Float64Array(nFrames), low = new Float64Array(nFrames), rms = new Float64Array(nFrames);
let prev = null;
for (let f = 0; f < nFrames; f++) {
  const fr = new Float64Array(WIN);
  let e = 0;
  for (let i = 0; i < WIN; i++) { const s = x[f * HOP + i]; fr[i] = s * hann[i]; e += s * s; }
  rms[f] = Math.sqrt(e / WIN);
  const m = fftMag(fr).map(v => Math.log1p(100 * v));
  let fl = 0, lo = 0;
  if (prev) for (let k = 1; k < m.length; k++) {
    const d = Math.max(0, m[k] - prev[k]);
    fl += d;
    if (k * binHz < 180) lo += d;
  }
  flux[f] = fl; low[f] = lo; prev = m;
}

const norm = a => { const mx = Math.max(...a) || 1; return Array.from(a, v => v / mx); };
const fluxN = norm(flux), lowN = norm(low), rmsN = norm(rms);

// Tempo via autocorrelation of onset envelope (60–200 BPM)
let best = 0, bestLag = 0;
for (let lag = Math.round(FPS_ENV * 60 / 200); lag <= Math.round(FPS_ENV * 60 / 60); lag++) {
  let s = 0;
  for (let i = lag; i < nFrames; i++) s += fluxN[i] * fluxN[i - lag];
  s /= (nFrames - lag);
  // mild preference for 90–140 BPM
  const bpm = 60 * FPS_ENV / lag;
  const w = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 115), 2) / 0.5);
  if (s * w > best) { best = s * w; bestLag = lag; }
}
const period = bestLag / FPS_ENV;
const bpm = 60 / period;

// Phase: pick offset maximizing summed onset strength on the beat grid
let bestPhase = 0, bestScore = -1;
for (let p = 0; p < bestLag; p++) {
  let s = 0;
  for (let i = p; i < nFrames; i += bestLag) s += fluxN[Math.round(i)];
  if (s > bestScore) { bestScore = s; bestPhase = p; }
}
// Beat grid, each beat snapped to local onset max within ±40 ms
const beats = [];
const snap = Math.round(0.04 * FPS_ENV);
for (let t = bestPhase / FPS_ENV; t < x.length / SR; t += period) {
  const c = Math.round(t * FPS_ENV);
  let bi = c, bv = -1;
  for (let i = Math.max(0, c - snap); i <= Math.min(nFrames - 1, c + snap); i++) if (fluxN[i] > bv) { bv = fluxN[i]; bi = i; }
  beats.push({ t: +(bi / FPS_ENV).toFixed(3), strength: +bv.toFixed(3), bass: +lowN[bi].toFixed(3) });
}

// Peak-picked onsets (for accents)
const onsets = [];
for (let i = 3; i < nFrames - 3; i++) {
  let mean = 0; for (let j = i - 10; j <= i + 10; j++) mean += fluxN[Math.min(nFrames - 1, Math.max(0, j))]; mean /= 21;
  if (fluxN[i] > mean + 0.12 && fluxN[i] === Math.max(...fluxN.slice(i - 3, i + 4))) onsets.push(+(i / FPS_ENV).toFixed(3));
}

// Downsample energy envelope to 30 fps for the video
const VFPS = 30, dur = x.length / SR;
const env = [];
for (let v = 0; v < Math.ceil(dur * VFPS); v++) {
  const i = Math.min(nFrames - 1, Math.round(v / VFPS * FPS_ENV));
  env.push(+rmsN[i].toFixed(3));
}
const out = { duration: +dur.toFixed(3), bpm: +bpm.toFixed(2), period: +period.toFixed(4), beats, onsets, env };
fs.writeFileSync(outPath, JSON.stringify(out));
console.log('dur', out.duration, 'bpm', out.bpm, 'beats', beats.length, 'onsets', onsets.length);
console.log('first beats', beats.slice(0, 8).map(b => b.t).join(' '));
// coarse loudness timeline (per 0.5s)
const seg = []; for (let s = 0; s < dur; s += 0.5) { const a = env.slice(Math.round(s * VFPS), Math.round((s + 0.5) * VFPS)); seg.push((a.reduce((p, c) => p + c, 0) / a.length).toFixed(2)); }
console.log('loudness/0.5s', seg.join(' '));
