import React from 'react';

export type Palette = {
  id: string;
  fur: string;
  dark: string; // shading + ear backs
  belly: string;
  inner: string; // inner ear / paw beans
  line: string;
  stripe?: string;
  iris?: string; // coloured eyes (dark fur)
  bow?: string;
};

export type Eyes = 'dot' | 'normal' | 'sparkle' | 'happy' | 'closed';
export type Pose = {
  liftL: number;
  liftR: number;
  armL: number; // degrees outward from hanging
  armR: number;
  squash: number; // 1 = rest, <1 squashed, >1 stretched
  hop: number;
  tilt: number;
  headLag: number;
  eyes: Eyes;
  look: number; // -1..1
  mouth: 'w' | 'open' | 'smile';
  tail: number;
  blush: number;
  blink: number; // 0 open → 1 shut
  sweat?: number;
};

export const REST: Pose = {
  liftL: 0, liftR: 0, armL: 12, armR: 12, squash: 1, hop: 0, tilt: 0, headLag: 0,
  eyes: 'normal', look: 0, mouth: 'w', tail: 0, blush: 0.6, blink: 0,
};

export const PALETTES: Record<string, Palette> = {
  mimi: { id: 'mimi', fur: '#FFB45E', dark: '#F28A3A', belly: '#FFF2DE', inner: '#FF9DB0', line: '#5A3226', stripe: '#E8752C' },
  grey: { id: 'grey', fur: '#BFC9DD', dark: '#8F9BB6', belly: '#F2F5FB', inner: '#FFA9BD', line: '#3E3F5C' },
  snow: { id: 'snow', fur: '#FFFFFF', dark: '#E2DBEC', belly: '#FFF7FC', inner: '#FFB3C7', line: '#5B4766', bow: '#FF6F9E' },
  bean: { id: 'bean', fur: '#4C4560', dark: '#332D45', belly: '#6F6789', inner: '#FF9DB8', line: '#231E33', iris: '#FFD65A' },
};

const SW = 7; // outline width

const Eye: React.FC<{ x: number; pal: Palette; pose: Pose }> = ({ x, pal, pose }) => {
  const lx = pose.look * 7;
  const ink = pal.line;
  if (pose.eyes === 'happy')
    return <path d={`M ${x - 22} -292 Q ${x} -322 ${x + 22} -292`} stroke={ink} strokeWidth={9} fill="none" strokeLinecap="round" />;
  if (pose.eyes === 'closed')
    return <path d={`M ${x - 22} -300 Q ${x} -284 ${x + 22} -300`} stroke={ink} strokeWidth={8} fill="none" strokeLinecap="round" />;
  if (pose.eyes === 'dot')
    return (
      <g transform={`translate(${x + lx}, -298) scale(1, ${1 - pose.blink * 0.9})`}>
        <ellipse rx={11} ry={13} fill={ink} />
        <circle cx={3} cy={-4} r={3.5} fill="#fff" />
      </g>
    );
  const big = pose.eyes === 'sparkle';
  const rx = big ? 28 : 22, ry = big ? 34 : 28;
  return (
    <g transform={`translate(${x + lx}, -298) scale(1, ${1 - pose.blink * 0.92})`}>
      {pal.iris ? (
        <>
          <ellipse rx={rx} ry={ry} fill={pal.iris} stroke={ink} strokeWidth={4} />
          <ellipse rx={rx * 0.55} ry={ry * 0.8} fill={ink} />
        </>
      ) : (
        <ellipse rx={rx} ry={ry} fill={big ? `url(#eyeGrad-${pal.id})` : ink} />
      )}
      <circle cx={rx * 0.32} cy={-ry * 0.38} r={big ? 10 : 8} fill="#fff" />
      <circle cx={-rx * 0.3} cy={ry * 0.35} r={big ? 5.5 : 4} fill="#fff" />
      {big && <path d="M -9 -14 L -7 -7 L 0 -5 L -7 -3 L -9 4 L -11 -3 L -18 -5 L -11 -7 Z" fill="#fff" opacity={0.9} />}
    </g>
  );
};

const Ear: React.FC<{ pal: Palette; flip?: boolean; wiggle: number }> = ({ pal, flip, wiggle }) => (
  <g transform={`scale(${flip ? -1 : 1}, 1) rotate(${wiggle}, -100, -380)`}>
    <path d="M -148 -330 Q -158 -452 -132 -478 Q -112 -486 -46 -414 Z" fill={pal.fur} stroke={pal.line} strokeWidth={SW} strokeLinejoin="round" />
    <path d="M -128 -360 Q -134 -438 -124 -452 Q -110 -456 -76 -414 Z" fill={pal.inner} opacity={0.85} />
  </g>
);

const Leg: React.FC<{ pal: Palette; side: -1 | 1; lift: number }> = ({ pal, side, lift }) => {
  const bend = Math.min(lift, 60) * 0.25 * side;
  return (
    <g transform={`translate(${side * 42}, ${-lift}) rotate(${bend}, 0, -60)`}>
      <rect x={-30} y={-90} width={60} height={90} rx={28} fill={pal.fur} stroke={pal.line} strokeWidth={SW} />
      <ellipse cx={0} cy={-14} rx={36} ry={20} fill={pal.belly} stroke={pal.line} strokeWidth={SW} />
      {lift > 6 && (
        <g opacity={Math.min(1, (lift - 6) / 12)}>
          <ellipse cx={0} cy={-8} rx={13} ry={8} fill={pal.inner} />
          <circle cx={-15} cy={-20} r={5} fill={pal.inner} />
          <circle cx={0} cy={-24} r={5} fill={pal.inner} />
          <circle cx={15} cy={-20} r={5} fill={pal.inner} />
        </g>
      )}
    </g>
  );
};

const Arm: React.FC<{ pal: Palette; side: -1 | 1; angle: number }> = ({ pal, side, angle }) => (
  <g transform={`translate(${side * 74}, -168) rotate(${-side * angle})`}>
    <rect x={-19} y={-10} width={38} height={84} rx={19} fill={pal.fur} stroke={pal.line} strokeWidth={SW} />
    <circle cx={0} cy={70} r={22} fill={pal.belly} stroke={pal.line} strokeWidth={SW} />
  </g>
);

export const Kitten: React.FC<{ pal: Palette; pose: Pose; t: number; headChild?: React.ReactNode }> = ({ pal, pose, t, headChild }) => {
  const sx = 2 - pose.squash;
  const ink = pal.line;
  const earW = Math.sin(t * 9) * 2 + pose.headLag * 0.4;
  return (
    <g>
      <defs>
        <radialGradient id={`eyeGrad-${pal.id}`} cx="0.5" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#4B2F5E" />
          <stop offset="0.55" stopColor={ink} />
          <stop offset="1" stopColor="#7A4CC2" />
        </radialGradient>
        <radialGradient id={`furShade-${pal.id}`} cx="0.42" cy="0.32" r="0.8">
          <stop offset="0.55" stopColor={pal.fur} />
          <stop offset="1" stopColor={pal.dark} />
        </radialGradient>
      </defs>
      <g transform={`translate(0, ${-pose.hop}) scale(${sx}, ${pose.squash})`}>
        {/* tail */}
        <g transform={`rotate(${pose.tail}, -70, -110)`}>
          <path d="M -70 -110 C -170 -110 -190 -220 -150 -265 C -128 -290 -100 -270 -116 -252" fill="none" stroke={ink} strokeWidth={46} strokeLinecap="round" />
          <path d="M -70 -110 C -170 -110 -190 -220 -150 -265 C -128 -290 -100 -270 -116 -252" fill="none" stroke={pal.fur} strokeWidth={32} strokeLinecap="round" />
          {pal.stripe && (
            <path d="M -170 -190 L -150 -196 M -160 -238 L -142 -232" stroke={pal.stripe} strokeWidth={9} strokeLinecap="round" />
          )}
        </g>
        <Leg pal={pal} side={-1} lift={pose.liftL} />
        <Leg pal={pal} side={1} lift={pose.liftR} />
        {/* body */}
        <ellipse cx={0} cy={-128} rx={98} ry={92} fill={`url(#furShade-${pal.id})`} stroke={ink} strokeWidth={SW} />
        <ellipse cx={0} cy={-118} rx={60} ry={62} fill={pal.belly} />
        {pal.stripe && (
          <g stroke={pal.stripe} strokeWidth={9} strokeLinecap="round" fill="none">
            <path d="M -92 -150 Q -76 -146 -70 -132" />
            <path d="M -96 -112 Q -80 -110 -74 -98" />
            <path d="M 92 -150 Q 76 -146 70 -132" />
            <path d="M 96 -112 Q 80 -110 74 -98" />
          </g>
        )}
        <Arm pal={pal} side={-1} angle={pose.armL} />
        <Arm pal={pal} side={1} angle={pose.armR} />
        {/* head */}
        <g transform={`translate(0, ${pose.headLag}) rotate(${pose.tilt}, 0, -200)`}>
          <Ear pal={pal} wiggle={earW} />
          <Ear pal={pal} flip wiggle={earW} />
          <ellipse cx={0} cy={-300} rx={152} ry={124} fill={`url(#furShade-${pal.id})`} stroke={ink} strokeWidth={SW} />
          <ellipse cx={0} cy={-262} rx={78} ry={44} fill={pal.belly} opacity={0.9} />
          {pal.stripe && (
            <g stroke={pal.stripe} strokeWidth={10} strokeLinecap="round" fill="none">
              <path d="M -26 -418 Q -22 -398 -24 -384" />
              <path d="M 0 -423 L 0 -390" />
              <path d="M 26 -418 Q 22 -398 24 -384" />
            </g>
          )}
          {pal.bow && (
            <g transform="translate(92, -392) rotate(18)">
              <path d="M 0 0 L -38 -24 Q -46 0 -38 24 Z" fill={pal.bow} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <path d="M 0 0 L 38 -24 Q 46 0 38 24 Z" fill={pal.bow} stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <circle r={11} fill="#FFD1E1" stroke={ink} strokeWidth={5} />
            </g>
          )}
          <ellipse cx={-100} cy={-252} rx={26} ry={14} fill="#FF7E9A" opacity={pose.blush * 0.65} />
          <ellipse cx={100} cy={-252} rx={26} ry={14} fill="#FF7E9A" opacity={pose.blush * 0.65} />
          <Eye x={-58} pal={pal} pose={pose} />
          <Eye x={58} pal={pal} pose={pose} />
          <path d="M -9 -272 Q 0 -266 9 -272 Q 4 -260 0 -259 Q -4 -260 -9 -272 Z" fill="#FF8DA6" stroke={ink} strokeWidth={4} strokeLinejoin="round" />
          {pose.mouth === 'open' ? (
            <g>
              <path d="M -22 -252 Q 0 -206 22 -252 Q 0 -244 -22 -252 Z" fill="#8E2F45" stroke={ink} strokeWidth={5} strokeLinejoin="round" />
              <ellipse cx={0} cy={-227} rx={10} ry={6} fill="#FF8DA6" />
            </g>
          ) : pose.mouth === 'smile' ? (
            <path d="M -26 -252 Q -13 -236 0 -252 Q 13 -236 26 -252" stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />
          ) : (
            <path d="M -18 -254 Q -9 -244 0 -254 Q 9 -244 18 -254" stroke={ink} strokeWidth={5.5} fill="none" strokeLinecap="round" />
          )}
          <g stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.75}>
            <path d="M -112 -276 L -168 -286 M -112 -262 L -170 -258" />
            <path d="M 112 -276 L 168 -286 M 112 -262 L 170 -258" />
          </g>
          {pose.sweat ? (
            <path
              d={`M 128 -370 Q 146 -340 128 -330 Q 110 -340 128 -370 Z`}
              fill="#9FD8FF"
              stroke={ink}
              strokeWidth={4}
              opacity={pose.sweat}
              transform={`translate(0, ${(1 - pose.sweat) * 10})`}
            />
          ) : null}
          {headChild ? <g transform="translate(0, -410)">{headChild}</g> : null}
        </g>
      </g>
    </g>
  );
};
