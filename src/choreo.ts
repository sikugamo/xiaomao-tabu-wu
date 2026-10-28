import { Pose, REST } from './Kitten';
import { INTRO_HITS, T, beatAt, clamp, easeOut, elastic, lerp, prog, pulse } from './theme';

// Per-kitten flavour: phase lets friends lead with the other foot; energy scales the moves.
export type Style = { phase: 0 | 1; energy: number; seed: number; pawsTo: -1 | 0 | 1 };

const blinkAt = (t: number, seed: number) => {
  // a quick blink roughly every 2.3 s, offset per kitten
  const c = (t + seed * 0.77) % 2.3;
  return c < 0.12 ? Math.sin((c / 0.12) * Math.PI) : 0;
};

export const danceAt = (t: number, s: Style): Pose => {
  const b = beatAt(t);
  const landFoot = (b.k + 1 + s.phase) % 2; // foot that lands on the next step
  const lift = Math.sin(Math.PI * Math.pow(b.u, 0.75));
  const impact = b.k >= 0 ? Math.exp(-b.dt * 13) : 0;
  const swing = Math.sin(Math.PI * (b.k + b.frac + s.phase));
  const p: Pose = { ...REST, blink: blinkAt(t, s.seed), tail: Math.sin(t * 6.5 + s.seed) * 14 };

  // ---------- Intro: alone, shy little steps on the five stomps ----------
  if (t < T.drop) {
    const stepH = 34;
    p.liftL = landFoot === 0 ? stepH * lift : 0;
    p.liftR = landFoot === 1 ? stepH * lift : 0;
    p.squash = 1 - 0.07 * impact + 0.025 * lift;
    p.hop = 6 * lift;
    p.headLag = 7 * impact;
    p.tilt = 5 * swing;
    p.armL = 8 + 6 * lift;
    p.armR = 8 + 6 * lift;
    p.eyes = 'dot';
    // glances left, right, then (after the 4th step) at us
    const step = INTRO_HITS.filter((h) => h <= t).length;
    p.look = step < 4 ? [0, -1, 1, -0.6][step] : 0;
    p.blush = 0.45;
    p.sweat = t > 0.9 && t < 2.2 ? 0.9 : 0;
    p.tail = Math.sin(t * 3) * 6 - 8;
    // deep breath in the silence before the drop
    const breath = prog(t, 2.5, 2.78);
    if (breath > 0) {
      p.eyes = 'closed';
      p.squash = lerp(p.squash, 1.06, easeOut(breath));
      p.armL = p.armR = lerp(p.armL, 0, breath);
      p.sweat = 0;
    }
    return p;
  }

  // ---------- Groove ----------
  const e = s.energy;
  const stepH = 58 * e;
  p.liftL = landFoot === 0 ? stepH * lift : 0;
  p.liftR = landFoot === 1 ? stepH * lift : 0;
  p.squash = 1 - 0.11 * e * impact + 0.04 * e * lift;
  p.hop = 22 * e * lift;
  p.headLag = 12 * e * impact;
  p.tilt = 9 * swing;
  p.armL = 38 + 34 * swing * e;
  p.armR = 38 - 34 * swing * e;
  p.mouth = b.k % 4 < 2 ? 'open' : 'w';
  p.eyes = b.k % 4 === 3 ? 'happy' : 'normal';
  p.blush = 0.8;
  p.tail = Math.sin(t * 8 + s.seed) * 22;
  // the drop itself: sparkly-eyed joy for a bar
  const joy = prog(t, T.drop, T.drop + 1.8);
  if (joy < 1) {
    p.eyes = 'sparkle';
    p.mouth = 'open';
    const burst = elastic(prog(t, T.drop, T.drop + 0.5));
    p.armL = lerp(150, p.armL, burst);
    p.armR = lerp(150, p.armR, burst);
  }

  // ---------- Breakdown: hold paws and sway together ----------
  const soft = Math.min(prog(t, T.softStart - 0.15, T.softStart + 0.25), 1 - prog(t, T.softEnd - 0.2, T.softEnd + 0.05));
  if (soft > 0) {
    const sway = Math.sin(Math.PI * (b.k + b.frac));
    const reachL = s.pawsTo <= 0 ? 72 : 30; // reach towards neighbours
    const reachR = s.pawsTo >= 0 ? 72 : 30;
    p.liftL = lerp(p.liftL, 0, soft);
    p.liftR = lerp(p.liftR, 0, soft);
    p.hop = lerp(p.hop, 0, soft);
    p.squash = lerp(p.squash, 1 - 0.03 * impact, soft);
    p.tilt = lerp(p.tilt, 12 * sway, soft);
    p.armL = lerp(p.armL, reachL + 8 * sway, soft);
    p.armR = lerp(p.armR, reachR - 8 * sway, soft);
    p.headLag = lerp(p.headLag, 3 * impact, soft);
    if (soft > 0.5) {
      p.eyes = 'happy';
      p.mouth = 'smile';
      p.blink = 0;
    }
    p.blush = lerp(p.blush, 1, soft);
    p.tail = lerp(p.tail, Math.sin(t * 3 + s.seed) * 14, soft);
  }

  // ---------- Build-up crouch → big jump on the final hit ----------
  if (t >= T.build && t < T.final) {
    const c = easeOut(prog(t, T.build, T.final - 0.05));
    p.squash = lerp(p.squash, 0.84, c);
    p.hop = lerp(p.hop, 0, c);
    p.liftL = lerp(p.liftL, 0, c);
    p.liftR = lerp(p.liftR, 0, c);
    p.armL = lerp(p.armL, -10, c);
    p.armR = lerp(p.armR, -10, c);
    p.eyes = c > 0.4 ? 'closed' : p.eyes;
    p.mouth = 'w';
    p.tilt *= 1 - c;
  }
  if (t >= T.final) {
    const j = t - T.final;
    // ballistic jump that settles into a hop-in-place pose
    const air = Math.max(0, 1 - j / 0.62);
    const jump = 4 * air * (1 - air);
    const land = pulse(t, T.final + 0.62, 9);
    p.hop = 210 * e * jump;
    p.squash = j < 0.08 ? lerp(0.84, 1.16, j / 0.08) : lerp(1.12, 1, clamp((j - 0.1) / 0.4)) - (j > 0.62 ? 0.12 * land : 0);
    p.liftL = 40 * jump;
    p.liftR = 40 * jump;
    p.armL = lerp(165, 140, clamp(j / 1.2)) + 8 * Math.sin(t * 9);
    p.armR = lerp(165, 140, clamp(j / 1.2)) + 8 * Math.sin(t * 9 + 1);
    p.eyes = j < 0.9 ? 'happy' : 'sparkle';
    p.mouth = 'open';
    p.tilt = Math.sin(t * 5 + s.seed) * 6;
    p.headLag = 14 * land;
    p.blush = 1;
    p.blink = 0;
  }
  return p;
};

// Where on screen a kitten's head-top lands (for the baby kitten's drop onto Mimi).
export const headTop = (pose: Pose, x: number, y: number, scale: number) => {
  const a = (pose.tilt * Math.PI) / 180;
  const lx = Math.sin(a) * 210;
  const ly = -200 - Math.cos(a) * 210 + pose.headLag;
  return { x: x + lx * (2 - pose.squash) * scale, y: y + (ly * pose.squash - pose.hop) * scale };
};
