const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (e0, e1, x) => {
  if (e0 === e1) return x < e0 ? 0 : 1;
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const toUnit = (hexColor) => [1, 3, 5].map(i => parseInt(hexColor.slice(i, i + 2), 16) / 255);
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; };
const dot3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const spreadToCosine = (deg) => Math.cos((clamp(deg, 5, 170) * Math.PI) / 360);
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionQuery.matches;
const onMotionChange = (event) => { reduceMotion = event.matches; };
if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change', onMotionChange);
else if (typeof motionQuery.addListener === 'function') motionQuery.addListener(onMotionChange);

/* ═══════════════════════════════════════════════════════════════════════════
   3 · 光：app/nocturne/light-model.ts 的逐行移植
   ═══════════════════════════════════════════════════════════════════════ */

export {clamp, smoothstep, toUnit, norm, dot3, spreadToCosine, reduceMotion};
