import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import data from './beats.json';

// Fonts are self-hosted from public/fonts (Google Fonts, OFL) so renders never touch the network.
const FACES: Array<[string, string, string]> = [
  ['Fredoka', 'fonts/fredoka.ttf', '300 700'],
  ['KuaiLe', 'fonts/kuaile.ttf', '400'],
];
const fontHandle = delayRender('Loading fonts', { timeoutInMilliseconds: 60000, retries: 2 });
const loadFace = async ([family, file, weight]: (typeof FACES)[number], attempt = 0): Promise<void> => {
  try {
    const face = await new FontFace(family, `url(${staticFile(file)}) format('truetype')`, { weight }).load();
    document.fonts.add(face);
  } catch (err) {
    if (attempt < 3) return loadFace([family, file, weight], attempt + 1);
    throw err;
  }
};
Promise.all(FACES.map((f) => loadFace(f)))
  .then(() => continueRender(fontHandle))
  .catch((err) => cancelRender(err));

export const ROUND = "'Fredoka', 'Helvetica Neue', Arial, sans-serif";
export const CUTE_ZH = "'KuaiLe', 'Fredoka', sans-serif";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DURATION = Math.round(16.4 * FPS);

// ---- Music map (from analysis/beats.mjs: 136 BPM, stop-and-go phrasing) ----
export const PERIOD = data.period;
export const INTRO_HITS = [0.18, 0.84, 1.54, 1.96, 2.4];
const GROOVE = data.beats.map((b) => b.t).filter((t) => t >= 2.79);
// Every foot landing: five shy intro steps, then the steady groove grid.
export const STEPS = [...INTRO_HITS, ...GROOVE];
export const ONSETS = data.onsets.filter((t) => t >= 2.79);
export const ENV = data.env;

export const T = {
  drop: 2.8, // groove kicks in after the 2.71–2.82 s silence
  friend1: 5.24, // restarts after a micro-gap
  friend2: 7.0,
  baby: 7.66,
  rainbow: 8.77,
  softStart: 9.85, // beats soften
  softEnd: 11.17, // bass returns
  confetti: 12.3,
  build: 14.07,
  final: 14.72,
  audioEnd: 15.05,
};
// Short restarts after silent gaps: camera punches here.
export const RESTARTS = [2.82, 5.25, 7.01, 7.67, 8.78, 11.18, 12.31, 14.08, 14.74];

export type BeatInfo = { k: number; prev: number; next: number; dt: number; frac: number; u: number; win: number };
// Where are we relative to the step grid? u = progress of the lift leading into the *next* landing.
export const beatAt = (t: number): BeatInfo => {
  let k = -1;
  for (let i = 0; i < STEPS.length; i++) if (STEPS[i] <= t) k = i;
  const prev = k >= 0 ? STEPS[k] : -1;
  const next = k + 1 < STEPS.length ? STEPS[k + 1] : prev + PERIOD;
  const span = next - prev;
  const win = Math.min(span, PERIOD) * 0.86;
  return {
    k,
    prev,
    next,
    dt: t - prev,
    frac: clamp((t - prev) / span),
    u: clamp((t - (next - win)) / win),
    win,
  };
};

// ---- math ----
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x: number, s = 1.9) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
export const elastic = (x: number) =>
  x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
// Decaying pulse after time `at` (1 at impact → 0).
export const pulse = (t: number, at: number, rate = 8) => (t < at ? 0 : Math.exp(-(t - at) * rate));
// Most recent value in a sorted list that is ≤ t.
export const lastBefore = (list: number[], t: number) => {
  let r = -99;
  for (const v of list) if (v <= t) r = v;
  return r;
};
export const mix = (c1: string, c2: string, t: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))).toString(16).padStart(2, '0')).join('');
};
