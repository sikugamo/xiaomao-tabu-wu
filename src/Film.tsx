import React from 'react';
import { AbsoluteFill, Audio, random, staticFile, useCurrentFrame } from 'remotion';
import { Kitten, PALETTES, Pose } from './Kitten';
import { Style, danceAt, headTop } from './choreo';
import {
  CUTE_ZH, FPS, H, INTRO_HITS, ONSETS, RESTARTS, ROUND, STEPS, T, W,
  beatAt, clamp, easeInOut, easeOut, easeOutBack, elastic, lastBefore, lerp, mix, prog, pulse,
} from './theme';

// ------------------------------------------------------------------ cast & blocking
type Placed = { x: number; y: number; s: number; pose: Pose; on: boolean };

const STYLE: Record<string, Style> = {
  mimi: { phase: 0, energy: 1, seed: 0, pawsTo: 0 },
  grey: { phase: 1, energy: 0.9, seed: 1.7, pawsTo: 1 },
  snow: { phase: 1, energy: 0.9, seed: 3.1, pawsTo: -1 },
  bean: { phase: 1, energy: 1.1, seed: 4.4, pawsTo: 0 },
};

const softAmt = (t: number) => Math.min(prog(t, T.softStart - 0.2, T.softStart + 0.3), 1 - prog(t, T.softEnd - 0.2, T.softEnd + 0.1));

const mimiAt = (t: number): Placed => {
  const pose = danceAt(t, STYLE.mimi);
  // intro: one shy step forward per stomp
  const fwd = INTRO_HITS.reduce((a, h) => a + easeInOut(prog(t, h - 0.28, h)), 0);
  const d = easeOut(prog(t, T.drop, T.drop + 0.45));
  // glance at each friend as they land, surprised-happy when baby lands on her head
  if (t > T.friend1 - 0.3 && t < T.friend1 + 0.5) pose.look = -1;
  if (t > T.friend2 - 0.3 && t < T.friend2 + 0.5) pose.look = 1;
  const bump = pulse(t, T.baby, 9);
  if (t >= T.baby && t < T.baby + 0.5) pose.eyes = 'sparkle';
  pose.squash -= 0.1 * bump;
  return { x: 540, y: lerp(1440 + fwd * 16, 1565, d), s: lerp(0.8 + fwd * 0.02, 0.96, d), pose, on: true };
};

const friendAt = (t: number, key: 'grey' | 'snow', arrive: number, fromX: number, toX: number): Placed => {
  const pose = danceAt(t, STYLE[key]);
  const q = prog(t, arrive - 0.66, arrive);
  const inward = Math.sign(540 - toX) * (40 * softAmt(t) + 46 * easeOut(prog(t, T.final + 0.7, T.final + 1.3)));
  let hop = 0;
  if (q < 1) {
    hop = 120 * Math.abs(Math.sin(3 * Math.PI * q));
    pose.eyes = 'happy';
    pose.mouth = 'open';
    pose.armL = pose.armR = 130;
    pose.liftL = pose.liftR = 20;
    pose.squash = 1.05;
  }
  const land = pulse(t, arrive, 10);
  pose.squash -= 0.12 * land;
  pose.hop += hop;
  return { x: lerp(fromX, toX, q) + inward, y: 1515, s: 0.74, pose, on: t >= arrive - 0.66 };
};

const BABY_S = 0.36 / 0.96;
const babyPose = (t: number) => {
  const p = danceAt(t, STYLE.bean);
  p.squash -= 0.18 * pulse(t, T.baby, 8);
  if (t < T.baby + 0.4) { p.eyes = 'happy'; p.mouth = 'open'; p.armL = p.armR = 120; }
  return p;
};

// ------------------------------------------------------------------ small shapes
const heartPath = (s: number) =>
  `M 0 ${0.3 * s} C ${-0.1 * s} ${0.12 * s} ${-0.5 * s} ${0.1 * s} ${-0.5 * s} ${-0.2 * s} C ${-0.5 * s} ${-0.48 * s} ${-0.12 * s} ${-0.55 * s} 0 ${-0.3 * s} C ${0.12 * s} ${-0.55 * s} ${0.5 * s} ${-0.48 * s} ${0.5 * s} ${-0.2 * s} C ${0.5 * s} ${0.1 * s} ${0.1 * s} ${0.12 * s} 0 ${0.3 * s} Z`;
const starPath = (r: number, inner = 0.45, n = 5) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rr = i % 2 ? r * inner : r;
    d += `${i ? 'L' : 'M'} ${(Math.cos(a) * rr).toFixed(1)} ${(Math.sin(a) * rr).toFixed(1)} `;
  }
  return d + 'Z';
};
const Paw: React.FC<{ fill: string }> = ({ fill }) => (
  <g fill={fill}>
    <ellipse cx={0} cy={8} rx={22} ry={16} />
    <ellipse cx={-22} cy={-14} rx={8} ry={10} />
    <ellipse cx={-7} cy={-24} rx={8} ry={10} />
    <ellipse cx={9} cy={-24} rx={8} ry={10} />
    <ellipse cx={23} cy={-14} rx={8} ry={10} />
  </g>
);
const Fish: React.FC = () => (
  <g stroke="#3E3F5C" strokeWidth={5} strokeLinejoin="round">
    <path d="M -40 0 Q -10 -30 26 0 Q -10 30 -40 0 Z" fill="#7CC6FF" />
    <path d="M 22 0 L 46 -18 L 42 0 L 46 18 Z" fill="#7CC6FF" />
    <circle cx={-22} cy={-4} r={4} fill="#3E3F5C" stroke="none" />
  </g>
);
const Yarn: React.FC<{ c: string }> = ({ c }) => (
  <g stroke="#5A3226" strokeWidth={5}>
    <circle r={30} fill={c} />
    <path d="M -24 -16 Q 0 0 22 -20 M -28 4 Q 0 20 28 2 M -14 24 Q 4 8 16 26" fill="none" strokeWidth={4} opacity={0.6} />
  </g>
);

const RAINBOW = ['#FF6F9E', '#FFA54F', '#FFD84F', '#6FD99A', '#5DB7FF', '#A88CFF'];
const PASTEL = ['#FF8FB8', '#FFB86B', '#FFE07A', '#86E3B0', '#82C8FF', '#C3A6FF', '#FFFFFF'];

// ------------------------------------------------------------------ backdrop
const Sky: React.FC<{ t: number; night: boolean }> = ({ t, night }) => {
  if (night) {
    return (
      <g>
        <rect width={W} height={H} fill="url(#nightSky)" />
        {Array.from({ length: 70 }, (_, i) => {
          const x = random(`sx${i}`) * W, y = random(`sy${i}`) * 1100;
          const tw = 0.35 + 0.35 * Math.sin(t * (2 + random(`st${i}`) * 3) + i);
          return <circle key={i} cx={x} cy={y} r={1.5 + random(`sr${i}`) * 2.5} fill="#fff" opacity={tw} />;
        })}
        <g transform="translate(840, 300)">
          <circle r={95} fill="#FFF3C4" opacity={0.18} />
          <circle r={70} fill="#FFF3C4" />
          <circle cx={30} cy={-18} r={66} fill="#1E2150" />
        </g>
        {/* one wish-star lights up per stomp */}
        {INTRO_HITS.map((h, i) => {
          const pos = [[170, 330], [380, 190], [600, 420], [270, 620], [900, 640]][i];
          const pop = elastic(prog(t, h, h + 0.6));
          const glow = 0.45 + 0.55 * pulse(t, h, 4);
          return pop > 0 ? (
            <g key={i} transform={`translate(${pos[0]}, ${pos[1]}) scale(${pop}) rotate(${(t - h) * 30})`}>
              <circle r={60} fill="#FFE98A" opacity={0.25 * glow} />
              <path d={starPath(34)} fill="#FFE98A" stroke="#FFF8D6" strokeWidth={4} strokeLinejoin="round" />
            </g>
          ) : null;
        })}
      </g>
    );
  }
  const soft = softAmt(t);
  const late = prog(t, T.softEnd, T.softEnd + 0.6);
  const top = mix(mix('#FFB6D5', '#FF9E7A', soft), '#B9A7FF', late * (1 - soft));
  const bot = mix(mix('#FFF0C9', '#FFD39A', soft), '#FFD3EE', late * (1 - soft));
  const b = beatAt(t);
  const rayPulse = 1 + 0.06 * Math.exp(-b.dt * 8);
  const rainbow = easeOut(prog(t, T.rainbow, T.rainbow + 0.8));
  return (
    <g>
      <defs>
        <linearGradient id="daySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="0.62" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#daySky)" />
      <g transform={`translate(540, 1080) rotate(${t * 9}) scale(${rayPulse})`} opacity={0.35 + 0.15 * soft}>
        {Array.from({ length: 18 }, (_, i) => (
          <path key={i} d="M 0 0 L -95 -1500 L 95 -1500 Z" transform={`rotate(${i * 20})`} fill="#FFFFFF" opacity={i % 2 ? 0.55 : 0.25} />
        ))}
      </g>
      {rainbow > 0 &&
        RAINBOW.map((c, i) => (
          <path
            key={c}
            d={`M ${540 - (760 - i * 46)} 1180 A ${760 - i * 46} ${760 - i * 46} 0 0 1 ${540 + (760 - i * 46)} 1180`}
            fill="none"
            stroke={c}
            strokeWidth={48}
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * (760 - i * 46)}`}
            strokeDashoffset={`${Math.PI * (760 - i * 46) * (1 - rainbow)}`}
            opacity={0.85 - soft * 0.3}
          />
        ))}
      {/* puffy clouds bob to the beat */}
      {[[150, 760, 1], [900, 560, 0.8], [700, 900, 0.6], [330, 470, 0.7]].map(([x, y, s], i) => {
        const bob = Math.sin(Math.PI * (b.k + b.frac + i)) * 8;
        const dx = ((t * 18 * (i % 2 ? 1 : -1)) % 200) * 0.3;
        return (
          <g key={i} transform={`translate(${x + dx}, ${y + bob}) scale(${s})`} opacity={0.95}>
            <path d="M -130 30 Q -150 -20 -95 -30 Q -80 -90 -15 -75 Q 25 -120 75 -70 Q 140 -80 135 -15 Q 170 25 120 40 Z" fill="#fff" />
            <ellipse cx={0} cy={36} rx={128} ry={10} fill="#F4D7EA" opacity={0.6} />
          </g>
        );
      })}
      {/* rolling hills on the horizon */}
      <path d="M 0 1170 Q 180 1060 380 1150 Q 560 1060 760 1140 Q 930 1070 1080 1130 L 1080 1200 L 0 1200 Z" fill={mix('#BDEFD2', '#F7C49A', soft)} />
      <path d="M 0 1190 Q 260 1110 520 1180 Q 800 1120 1080 1180 L 1080 1220 L 0 1220 Z" fill={mix('#9FE3BD', '#F2AE86', soft)} />
    </g>
  );
};

// perspective dance floor whose tiles light up on the beat
const HORIZON = 960, FOCAL = 960, XS = 330;
const ROWS = [1, 1.28, 1.62, 2.05, 2.6, 3.3, 4.25, 5.6];
const Floor: React.FC<{ t: number; night: boolean }> = ({ t, night }) => {
  const b = beatAt(t);
  const soft = softAmt(t);
  const fin = t >= T.final;
  const impact = Math.exp(-b.dt * 6);
  const tiles: React.ReactNode[] = [];
  for (let j = 0; j < ROWS.length - 1; j++) {
    const d0 = ROWS[j], d1 = ROWS[j + 1];
    const y0 = HORIZON + FOCAL / d0, y1 = HORIZON + FOCAL / d1;
    for (let i = -9; i <= 8; i++) {
      const xa0 = 540 + (i * XS) / d0, xb0 = 540 + ((i + 1) * XS) / d0;
      const xa1 = 540 + (i * XS) / d1, xb1 = 540 + ((i + 1) * XS) / d1;
      if (Math.max(xb0, xb1) < -20 || Math.min(xa0, xa1) > W + 20) continue;
      let fill = night ? '#221C45' : mix('#F6E9FF', '#FFE6D2', soft);
      let lit = 0;
      if (!night) {
        const k = b.k;
        const ring = (Math.abs(i + 0.5) + j) | 0;
        const on = k % 8 < 4 ? (i + j + k) % 2 === 0 : ring % 3 === k % 3;
        lit = on ? (0.5 + 0.5 * impact) * (1 - soft * 0.75) : 0;
        if (fin) lit = 0.85;
        if (soft > 0) lit += soft * 0.25 * (0.5 + 0.5 * Math.sin(t * 3 + i + j));
        const hue = RAINBOW[(((i + j + (fin ? Math.floor(t * 10) : k)) % 6) + 6) % 6];
        fill = mix(fill, hue, clamp(lit));
      }
      tiles.push(
        <path
          key={`${i}-${j}`}
          d={`M ${xa0} ${y0} L ${xb0} ${y0} L ${xb1} ${y1} L ${xa1} ${y1} Z`}
          fill={fill}
          stroke={night ? '#2D2658' : '#FFFFFF'}
          strokeWidth={night ? 2 : 5}
        />,
      );
    }
  }
  return (
    <g>
      <rect x={0} y={HORIZON + FOCAL / ROWS[ROWS.length - 1]} width={W} height={H} fill={night ? '#1A1538' : '#EBDDFB'} />
      {tiles}
    </g>
  );
};

// ------------------------------------------------------------------ particles
const Dust: React.FC<{ t: number; places: Placed[] }> = ({ t, places }) => {
  if (t < T.drop) return null;
  const b = beatAt(t);
  const out: React.ReactNode[] = [];
  for (let back = 0; back < 2; back++) {
    const k = b.k - back;
    if (k < INTRO_HITS.length) continue;
    const age = t - STEPS[k];
    if (age > 0.4) continue;
    places.forEach((pl, n) => {
      if (!pl.on || softAmt(t) > 0.3) return;
      const foot = (k + (n === 0 ? 0 : 1)) % 2 === 0 ? -1 : 1;
      const fx = pl.x + foot * 42 * pl.s, fy = pl.y;
      for (let m = 0; m < 4; m++) {
        const dir = (m < 2 ? -1 : 1) * (0.6 + (m % 2) * 0.6);
        out.push(
          <circle key={`${k}-${n}-${m}`} cx={fx + dir * age * 260 * pl.s} cy={fy - 8 - age * 70 * (1 + (m % 2))} r={(10 + age * 50) * pl.s} fill="#FFFFFF" opacity={0.85 * (1 - age / 0.4)} />,
        );
      }
    });
  }
  return <g>{out}</g>;
};

const Notes: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {ONSETS.map((o, i) => {
      const age = t - o;
      if (age < 0 || age > 1.6 || i % 2 || (o > T.softStart && o < T.softEnd)) return null;
      const x0 = [300, 540, 780, 180, 900][i % 5] + (random(`nx${i}`) - 0.5) * 120;
      const y = 1180 - age * 420;
      const x = x0 + Math.sin(age * 5 + i) * 30;
      const c = RAINBOW[i % 6];
      const a = Math.min(1, age * 6) * (1 - prog(age, 1.1, 1.6));
      return (
        <g key={i} transform={`translate(${x}, ${y}) rotate(${Math.sin(age * 6) * 15}) scale(${0.8 + 0.4 * easeOutBack(clamp(age * 4))})`} opacity={a}>
          <path d="M 8 -50 L 8 4 M 8 -50 Q 30 -40 34 -22" stroke={c} strokeWidth={9} fill="none" strokeLinecap="round" />
          <ellipse cx={-4} cy={6} rx={16} ry={12} fill={c} transform="rotate(-20, -4, 6)" />
        </g>
      );
    })}
  </g>
);

const Hearts: React.FC<{ t: number }> = ({ t }) => {
  const out: React.ReactNode[] = [];
  const spawns = STEPS.filter((s) => s > T.softStart - 0.1 && s < T.softEnd + 0.3);
  spawns.forEach((s0, si) => {
    for (let m = 0; m < 3; m++) {
      const age = t - s0 - m * 0.1;
      if (age < 0 || age > 2.4) continue;
      const id = si * 3 + m;
      const x0 = 120 + random(`hx${id}`) * 840;
      const x = x0 + Math.sin(age * 2.5 + id) * 40;
      const y = 1500 - age * 520 - random(`hy${id}`) * 200;
      const sc = (0.6 + random(`hs${id}`) * 0.8) * easeOutBack(clamp(age * 3));
      out.push(
        <path key={id} d={heartPath(80)} transform={`translate(${x}, ${y}) scale(${sc}) rotate(${Math.sin(age * 3) * 12})`} fill={['#FF6F9E', '#FF9DBB', '#FFC0D3'][id % 3]} stroke="#fff" strokeWidth={6} opacity={1 - prog(age, 1.6, 2.4)} />,
      );
    }
  });
  return <g>{out}</g>;
};

const Treats: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.softEnd || t > T.final + 1) return null;
  return (
    <g>
      {Array.from({ length: 18 }, (_, i) => {
        const start = T.softEnd + i * 0.16;
        const age = t - start;
        if (age < 0) return null;
        const x = 80 + random(`tx${i}`) * 920;
        const y = -80 + age * 760 + age * age * 160;
        if (y > 2000) return null;
        const rot = (random(`tr${i}`) - 0.5) * 400 * age;
        return (
          <g key={i} transform={`translate(${x}, ${y}) rotate(${rot}) scale(${0.9 + random(`ts${i}`) * 0.5})`}>
            {i % 3 === 0 ? <Fish /> : i % 3 === 1 ? <Yarn c={PASTEL[i % 6]} /> : <path d={starPath(30)} fill="#FFE07A" stroke="#5A3226" strokeWidth={5} strokeLinejoin="round" />}
          </g>
        );
      })}
    </g>
  );
};

type Burst = { at: number; x: number; y: number; n: number; spread: number; dir: number; speed: number };
const BURSTS: Burst[] = [
  { at: T.confetti, x: -20, y: 1700, n: 55, spread: 0.5, dir: -1.05, speed: 2300 },
  { at: T.confetti, x: 1100, y: 1700, n: 55, spread: 0.5, dir: -2.09, speed: 2300 },
  { at: T.final, x: 540, y: 1250, n: 120, spread: Math.PI, dir: -Math.PI / 2, speed: 2100 },
];
const Confetti: React.FC<{ t: number }> = ({ t }) => {
  const out: React.ReactNode[] = [];
  const c = 1.7, g = 1100;
  BURSTS.forEach((bu, bi) => {
    const age = t - bu.at;
    if (age < 0 || age > 3.5) return;
    for (let i = 0; i < bu.n; i++) {
      const r = (k: string) => random(`c${bi}-${i}-${k}`);
      const a = bu.dir + (r('a') - 0.5) * 2 * bu.spread;
      const v = bu.speed * (0.45 + 0.55 * r('v'));
      const e = (1 - Math.exp(-c * age)) / c;
      const x = bu.x + Math.cos(a) * v * e + Math.sin(age * 4 + i) * 22;
      const y = bu.y + Math.sin(a) * v * e + (g / c) * (age - e);
      if (y > 2000) continue;
      const flip = Math.cos(age * (8 + r('f') * 8) + i);
      const col = RAINBOW[i % 6];
      out.push(
        i % 5 === 0 ? (
          <path key={`${bi}-${i}`} d={heartPath(34)} transform={`translate(${x}, ${y}) rotate(${age * 200 * (r('s') - 0.5)}) scale(${flip}, 1)`} fill={col} />
        ) : (
          <rect key={`${bi}-${i}`} x={-9} y={-15} width={18} height={30} rx={4} transform={`translate(${x}, ${y}) rotate(${age * 500 * (r('s') - 0.5) + i * 37}) scale(1, ${flip})`} fill={col} />
        ),
      );
    }
  });
  return <g>{out}</g>;
};

const Sparkles: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {RESTARTS.map((r0, ri) =>
      Array.from({ length: 6 }, (_, i) => {
        const age = t - r0;
        if (age < 0 || age > 0.7) return null;
        const a = (i / 6) * Math.PI * 2 + ri;
        const dist = 330 + easeOut(age / 0.7) * 160;
        const s = Math.sin(Math.PI * (age / 0.7));
        return <path key={`${ri}-${i}`} d={starPath(26, 0.35, 4)} transform={`translate(${540 + Math.cos(a) * dist}, ${1300 + Math.sin(a) * dist * 0.8}) scale(${s}) rotate(${age * 180})`} fill={i % 2 ? '#FFFFFF' : '#FFE07A'} />;
      }),
    )}
  </g>
);

// ------------------------------------------------------------------ text
const Bubble: React.FC<{ t: number; at: number; dur: number; x: number; y: number; zh: string; en: string; tail: -1 | 1 }> = ({ t, at, dur, x, y, zh, en, tail }) => {
  const age = t - at;
  if (age < 0 || age > dur) return null;
  const s = elastic(clamp(age / 0.5)) * (1 - easeOut(prog(age, dur - 0.2, dur)));
  const w = Math.max(zh.length * 64, en.length * 20) + 70;
  return (
    <g transform={`translate(${x}, ${y + Math.sin(age * 6) * 6}) scale(${s})`}>
      <path d={`M ${tail * 30} 50 L ${tail * 62} 104 L ${tail * 76} 44 Z`} fill="#fff" stroke="#5A3226" strokeWidth={7} strokeLinejoin="round" />
      <rect x={-w / 2} y={-62} width={w} height={124} rx={56} fill="#fff" stroke="#5A3226" strokeWidth={7} />
      <rect x={tail * 34 - 26} y={36} width={52} height={22} fill="#fff" />
      <text y={6} textAnchor="middle" fontFamily={CUTE_ZH} fontSize={60} fill="#5A3226">{zh}</text>
      <text y={44} textAnchor="middle" fontFamily={ROUND} fontWeight={500} fontSize={26} fill="#B07A6A">{en}</text>
    </g>
  );
};

const TITLE = ['小', '猫', '踏', '步', '舞'];
const TITLE_COLORS = ['#FF6F9E', '#FF9A3D', '#FFC531', '#45C987', '#4FA8FF'];
const Title: React.FC<{ t: number }> = ({ t }) => {
  const grooveBeats = STEPS.slice(INTRO_HITS.length);
  const b = beatAt(t);
  const fin = elastic(prog(t, T.final, T.final + 0.8));
  const sc = 1 + 0.12 * fin;
  return (
    <g transform={`translate(540, ${330 + 40 * fin}) scale(${sc})`}>
      {TITLE.map((ch, i) => {
        const at = grooveBeats[i];
        const pop = elastic(prog(t, at, at + 0.55));
        if (pop <= 0) return null;
        const wave = -18 * Math.exp(-Math.max(0, t - (b.prev + i * 0.04)) * 9) * (t > at + 0.4 ? 1 : 0);
        const x = (i - 2) * 168;
        const rot = Math.sin(t * 3 + i) * 5;
        return (
          <g key={i} transform={`translate(${x}, ${wave}) rotate(${rot}) scale(${pop})`}>
            <text y={18} textAnchor="middle" fontFamily={CUTE_ZH} fontSize={168} fill="#5A3226" stroke="#5A3226" strokeWidth={34} strokeLinejoin="round" transform="translate(0, 10)">{ch}</text>
            <text y={18} textAnchor="middle" fontFamily={CUTE_ZH} fontSize={168} fill={TITLE_COLORS[i]} stroke="#fff" strokeWidth={18} strokeLinejoin="round" paintOrder="stroke">{ch}</text>
          </g>
        );
      })}
      {(() => {
        const a = easeOutBack(prog(t, grooveBeats[5], grooveBeats[5] + 0.5));
        return a > 0 ? (
          <g transform={`translate(0, ${135}) scale(${a})`}>
            <rect x={-245} y={-38} width={490} height={70} rx={35} fill="#5A3226" />
            <text y={14} textAnchor="middle" fontFamily={ROUND} fontWeight={600} fontSize={40} letterSpacing={3} fill="#FFF3E2">KITTEN STOMP DANCE</text>
          </g>
        ) : null;
      })()}
    </g>
  );
};

const Caption: React.FC<{ t: number; a: number; b: number; zh: string; en: string; y: number; size?: number; color?: string }> = ({ t, a, b, zh, en, y, size = 92, color = '#fff' }) => {
  const i = easeOutBack(prog(t, a, a + 0.5));
  const o = 1 - prog(t, b - 0.3, b);
  if (i <= 0 || o <= 0) return null;
  return (
    <g transform={`translate(540, ${y + (1 - i) * 40}) scale(${0.8 + 0.2 * i})`} opacity={Math.min(1, i) * o}>
      <text textAnchor="middle" fontFamily={CUTE_ZH} fontSize={size} fill={color} stroke="#5A3226" strokeWidth={14} strokeLinejoin="round" paintOrder="stroke">{zh}</text>
      <text y={size * 0.62} textAnchor="middle" fontFamily={ROUND} fontWeight={600} fontSize={size * 0.36} fill={color} stroke="#5A3226" strokeWidth={8} strokeLinejoin="round" paintOrder="stroke">{en}</text>
    </g>
  );
};

// ------------------------------------------------------------------ film
const KittenAt: React.FC<{ pl: Placed; pal: keyof typeof PALETTES; t: number; child?: React.ReactNode }> = ({ pl, pal, t, child }) =>
  pl.on ? (
    <g transform={`translate(${pl.x}, ${pl.y}) scale(${pl.s})`}>
      <Kitten pal={PALETTES[pal]} pose={pl.pose} t={t} headChild={child} />
    </g>
  ) : null;

const Shadow: React.FC<{ pl: Placed; night: boolean }> = ({ pl, night }) =>
  pl.on ? <ellipse cx={pl.x} cy={pl.y + 4} rx={125 * pl.s * (1 - Math.min(0.5, pl.pose.hop / 500))} ry={24 * pl.s} fill={night ? '#000' : '#8B5FBF'} opacity={night ? 0.5 : 0.28} /> : null;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const night = t < T.drop;
  const b = beatAt(t);
  const soft = softAmt(t);

  const mimi = mimiAt(t);
  const grey = friendAt(t, 'grey', T.friend1, -260, 215);
  const snow = friendAt(t, 'snow', T.friend2, 1340, 865);
  const places = [mimi, grey, snow];

  // baby Bean drops from the sky onto Mimi's head, landing on the 7.67 s restart
  const bp = babyPose(t);
  const tgt = headTop(mimi.pose, mimi.x, mimi.y, mimi.s);
  const fallQ = prog(t, T.baby - 0.48, T.baby);
  const babyFalling = fallQ > 0 && fallQ < 1;
  const babyOnHead = t >= T.baby;

  // camera
  const introZoom = lerp(1.2, 1.3, prog(t, 0, T.drop));
  const dropZ = easeOutBack(prog(t, T.drop, T.drop + 0.55), 1.4);
  let zoom = night ? introZoom : lerp(introZoom, 1, dropZ);
  const groove = t >= T.drop ? Math.exp(-b.dt * 9) * (1 - soft) : 0;
  const punch = pulse(t, lastBefore(RESTARTS, t), 7);
  zoom += 0.018 * groove + 0.035 * punch + 0.14 * easeInOut(soft);
  zoom += 0.05 * easeOutBack(prog(t, T.final, T.final + 0.4)) - 0.02 * prog(t, T.final + 0.4, 16);
  const shake = 9 * punch;
  const camX = Math.sin(t * 71) * shake;
  const camY = Math.cos(t * 53) * shake;
  const pivotY = night ? 1360 : lerp(1360, 1300, prog(t, T.drop, T.drop + 0.5)) + 80 * soft;
  const rot = soft * 1.4 * Math.sin(Math.PI * (b.k + b.frac));
  const cam = `translate(${540 + camX}, ${pivotY + camY}) rotate(${rot}) scale(${zoom}) translate(-540, ${-pivotY})`;

  const revealR = 2300 * easeOut(prog(t, T.drop, T.drop + 0.42));
  const flash = 0.85 * pulse(t, T.drop, 7) + 0.7 * pulse(t, T.final, 6);

  // heart iris-out on Mimi at the very end
  const iris = prog(t, 15.75, 16.32);
  const irisS = lerp(3600, 0, easeInOut(iris));

  const scene = (isNight: boolean) => (
    <g>
      <Sky t={t} night={isNight} />
      <Floor t={t} night={isNight} />
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: '#141A3F' }}>
      <Audio src={staticFile('song.mp3')} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#10143A" />
            <stop offset="0.6" stopColor="#2D2462" />
          </linearGradient>
          <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.05" />
            <stop offset="1" stopColor="#FFF6D8" stopOpacity="0.32" />
          </linearGradient>
          <radialGradient id="pool">
            <stop offset="0" stopColor="#FFF4C8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFF4C8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="0.5" cy="0.55" r="0.75">
            <stop offset="0.6" stopColor="#1A0F2E" stopOpacity="0" />
            <stop offset="1" stopColor="#1A0F2E" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="reveal">
            <circle cx={540} cy={1320} r={revealR} />
          </clipPath>
          <mask id="iris">
            <rect width={W} height={H} fill="#fff" />
            <path d={heartPath(irisS)} transform="translate(540, 1270)" fill="#000" />
          </mask>
        </defs>

        <g transform={cam}>
          {(night || revealR < 2300) && scene(true)}
          {!night && <g clipPath={revealR < 2300 ? 'url(#reveal)' : undefined}>{scene(false)}</g>}

          {/* intro spotlight + glowing pawprints */}
          {t < T.drop + 0.5 && (
            <g opacity={1 - prog(t, T.drop, T.drop + 0.4)}>
              <path d="M 470 -100 L 610 -100 L 830 1540 L 250 1540 Z" fill="url(#spot)" />
              <ellipse cx={540} cy={1500} rx={300} ry={80} fill="url(#pool)" />
              {INTRO_HITS.map((h, i) => {
                const a = prog(t, h - 0.02, h + 0.05);
                if (a <= 0) return null;
                const fwd = i + 1;
                const side = i % 2 ? 1 : -1;
                return (
                  <g key={i} transform={`translate(${540 + side * 34 * (0.8 + fwd * 0.02)}, ${1440 + fwd * 16 + 8}) scale(${0.5}, 0.22)`} opacity={(0.35 + 0.65 * pulse(t, h, 3)) * a}>
                    <Paw fill="#FFE98A" />
                  </g>
                );
              })}
            </g>
          )}

          {/* drop shockwave */}
          {[T.drop, T.final].map((at, i) => {
            const age = t - at;
            if (age < 0 || age > 0.8) return null;
            return <circle key={i} cx={540} cy={1320} r={150 + easeOut(age / 0.8) * 1100} fill="none" stroke="#fff" strokeWidth={40 * (1 - age / 0.8)} opacity={0.9 * (1 - age / 0.8)} />;
          })}

          {/* swinging stage beams */}
          {!night && (
            <g opacity={(1 - soft) * 0.55 * prog(t, T.drop, T.drop + 0.6)} style={{ mixBlendMode: 'screen' }}>
              {[0, 1].map((side) => {
                const sw = Math.sin(Math.PI * (b.k + b.frac) * 0.5 + side * Math.PI) * 18;
                const col = RAINBOW[(b.k + side * 3) % 6];
                return (
                  <g key={side} transform={`translate(${side ? 1120 : -40}, -60) rotate(${(side ? 22 : -22) + sw})`}>
                    <path d="M -40 0 L 40 0 L 260 1800 L -260 1800 Z" fill={col} opacity={0.5} />
                    <path d="M -40 0 L 40 0 L 260 1800 L -260 1800 Z" fill="url(#beam)" opacity={0.6} />
                  </g>
                );
              })}
            </g>
          )}

          {/* bunting */}
          {!night &&
            [0, 1].map((row) => {
              const drop = easeOutBack(prog(t, T.drop + 0.1 + row * 0.12, T.drop + 0.6 + row * 0.12));
              const swing = Math.sin(Math.PI * (b.k + b.frac) + row) * 6;
              const y0 = -200 + drop * (row ? 250 : 180);
              return (
                <g key={row} transform={`translate(0, ${y0})`}>
                  <path d={`M -20 0 Q 540 ${90 + swing} 1100 0`} stroke="#5A3226" strokeWidth={5} fill="none" />
                  {Array.from({ length: 11 }, (_, i) => {
                    const x = -20 + (i + 0.5) * (1120 / 11);
                    const u = (x + 20) / 1120;
                    const y = 2 * u * (1 - u) * (90 + swing);
                    return <path key={i} d="M -32 0 L 32 0 L 0 58 Z" transform={`translate(${x}, ${y}) rotate(${swing * (u - 0.5) * 2})`} fill={PASTEL[(i + row * 3) % 6]} stroke="#5A3226" strokeWidth={4} strokeLinejoin="round" />;
                  })}
                </g>
              );
            })}

          <Hearts t={t} />

          {/* big heart behind the final pose */}
          {t >= T.final && (
            <g transform={`translate(540, 980) scale(${elastic(prog(t, T.final, T.final + 0.9)) * (1 + 0.04 * Math.sin(t * 12))})`} opacity={0.92}>
              <path d={heartPath(560)} fill="none" stroke="#fff" strokeWidth={26} opacity={0.9} />
              <path d={heartPath(500)} fill="#FF8FB8" opacity={0.75} />
            </g>
          )}
          {places.map((pl, i) => <Shadow key={i} pl={pl} night={night} />)}
          <KittenAt pl={grey} pal="grey" t={t} />
          <KittenAt pl={snow} pal="snow" t={t} />
          <KittenAt
            pl={mimi}
            pal="mimi"
            t={t}
            child={babyOnHead ? <g transform={`scale(${BABY_S})`}><Kitten pal={PALETTES.bean} pose={bp} t={t} /></g> : undefined}
          />
          {babyFalling && (
            <g transform={`translate(${tgt.x}, ${lerp(-300, tgt.y, fallQ * fallQ)}) scale(0.36) rotate(${(1 - fallQ) * 300}, 0, -250)`}>
              <Kitten pal={PALETTES.bean} pose={{ ...bp, eyes: 'happy', mouth: 'open', armL: 150, armR: 150, liftL: 30, liftR: 30 }} t={t} />
            </g>
          )}
          <Dust t={t} places={places} />
          <Sparkles t={t} />
          <Notes t={t} />
          <Treats t={t} />
          <Confetti t={t} />
        </g>

        {/* warm glow during the breakdown */}
        <rect width={W} height={H} fill="#FF8A5C" opacity={0.1 * soft} />

        {/* words */}
        <Caption t={t} a={0.25} b={2.55} zh="一只小猫…" en="a little kitten, all alone…" y={560} size={80} />
        <Bubble t={t} at={0.95} dur={1.4} x={760} y={980} zh="……" en="so shy…" tail={-1} />
        <Title t={t} />
        <Bubble t={t} at={T.friend1 - 0.05} dur={1.3} x={300} y={980} zh="我也来!" en="me too!" tail={-1} />
        <Bubble t={t} at={T.friend2 - 0.05} dur={1.3} x={790} y={980} zh="加我一个~" en="count me in~" tail={1} />
        <Bubble t={t} at={T.baby + 0.02} dur={1.0} x={540} y={760} zh="喵!" en="mew!" tail={1} />
        <Caption t={t} a={T.softStart} b={T.softEnd + 0.15} zh="有你们真好" en="so glad you're here ♥" y={620} />
        <Caption t={t} a={T.final + 0.15} b={17} zh="一起踏步吧!" en="let's stomp together! ♥" y={1760} size={104} color="#FFF6E8" />

        <rect width={W} height={H} fill="url(#vignette)" opacity={night ? 1 : 0.35} />
        <rect width={W} height={H} fill="#fff" opacity={flash} />
        {iris > 0 && <rect width={W} height={H} fill="#2B1B40" mask="url(#iris)" />}
      </svg>
    </AbsoluteFill>
  );
};
