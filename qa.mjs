// Renders stills at given times (seconds) into out/qa for visual checks.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';

const times = process.argv.slice(2).map(Number);
const browserExecutable = process.env.CHS;
const chromiumOptions = { gl: 'swangle' };
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id: 'KittenStomp', browserExecutable, chromiumOptions, timeoutInMilliseconds: 120000 });
for (const s of times) {
  const frame = Math.round(s * 30);
  const output = `out/qa/t${s.toFixed(2).padStart(5, '0')}.jpg`;
  await renderStill({ composition, serveUrl, browserExecutable, chromiumOptions, timeoutInMilliseconds: 120000, frame, output, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.4 });
  console.log('rendered', s, frame, output);
}
