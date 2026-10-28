/**
 * dsh-nocturne — 浏览器半。
 *
 * 纸、灯、辉光三层的渲染代码由 tools/build.mjs 从 sample/nocturne-desk.html 抽取；
 * 上游配方来自 Chaosnap/Typewriter-Nocturne（MIT），随包保留其版权行。
 *
 *   核心 1819 行 · 适配 698 行 · 样式 70 行
 *   样张 sample/nocturne-desk.html（117999 bytes）
 */
window.__ModuleLoader__.load({
  id: 'dsh-nocturne',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });


/* ═══════════════════════════════════════════════════════════════════════════
   1 · 数据：照搬 app/nocturne/papers.ts 与 themes.ts
   ═══════════════════════════════════════════════════════════════════════ */
const LIGHT_ANSI = {
  black:'#2b231c', red:'#9c3a2a', green:'#4c6b2f', yellow:'#8a6a1c',
  blue:'#2f5277', magenta:'#7b3f6e', cyan:'#2e6b6a', white:'#7d7060',
  lightBlack:'#6e6153', lightRed:'#b0452a', lightGreen:'#557a33', lightYellow:'#94701a',
  lightBlue:'#3a6491', lightMagenta:'#8c4a7e', lightCyan:'#317876', lightWhite:'#5b4f43'
};
const NIGHT_ANSI = {
  black:'#2a2b42', red:'#d88a9a', green:'#9cc3a4', yellow:'#e2cf9a',
  blue:'#8ea8e0', magenta:'#b79ce0', cyan:'#8cc8d6', white:'#c9cadf',
  lightBlack:'#6f7192', lightRed:'#eba5b3', lightGreen:'#b4d8bc', lightYellow:'#efdfb2',
  lightBlue:'#aac0ef', lightMagenta:'#cbb5ef', lightCyan:'#a8dbe6', lightWhite:'#f0f0fa'
};
const lightPaper = (id, name, paperColor, surface) => ({
  id, name, appearance:'light', paper:paperColor,
  ink:'#2a2019', inkMuted:'#6b5f52', cursor:'#3a2c20',
  selection:'rgba(52, 64, 112, 0.2)', ansi:LIGHT_ANSI, surface
});

const PAPERS = {
  cotton: lightPaper('cotton', 'Cotton', '#eee6d5', {crinkle:.3, felt:1, laid:0, linen:0, mottle:.08, age:0}),
  laid: lightPaper('laid', 'Laid', '#f1e9d6', {crinkle:.22, felt:0, laid:1, linen:0, mottle:.18, age:0}),
  linen: lightPaper('linen', 'Linen', '#ebe5d8', {crinkle:.2, felt:0, laid:0, linen:1, mottle:.08, age:0}),
  onionskin: lightPaper('onionskin', 'Onionskin', '#f2f1ea', {crinkle:.08, felt:0, laid:0, linen:0, mottle:.04, age:0}),
  parchment: lightPaper('parchment', 'Parchment', '#efdfbd', {crinkle:.25, felt:0, laid:0, linen:0, mottle:1, age:.75}),
  night: {
    id:'night', name:'Night', appearance:'dark', paper:'#1d1a20',
    ink:'#e6e1ea', inkMuted:'#9a94a6', cursor:'#e9e7ff',
    selection:'rgba(196, 188, 255, 0.2)', ansi:NIGHT_ANSI,
    surface:{crinkle:.3, felt:0, laid:0, linen:0, mottle:.1, age:0}
  }
};

const THEMES = {
  'paper-and-ink': {
    selection:'rgba(176,138,74,.30)',
    palette:{room:'#241a14', roomEdge:'#070504', paper:'#f4ecdb', paperEdge:'#e1d1b0',
      ink:'#2b231c', inkMuted:'#6e6153', inkFaint:'#a89a85',
      accent:'#b08a4a', accentSoft:'#d9c08a', border:'#c9b48e'},
    light:{source:'carriage', color:'#ffd29a', position:{x:.5, y:1}, shade:.42},
    atmosphere:{particles:.1, filmGrain:.08, vignette:.35}
  },
  'midnight-study': {
    selection:'rgba(201,164,92,.30)',
    palette:{room:'#140f0b', roomEdge:'#030202', paper:'#1c1714', paperEdge:'#2c241e',
      ink:'#eadfc8', inkMuted:'#a39580', inkFaint:'#6b5f52',
      accent:'#c9a45c', accentSoft:'#8a6f3d', border:'#3a2f27'},
    light:{source:'desk-lamp', color:'#ffb35c', position:{x:.84, y:.04}, shade:.5},
    atmosphere:{particles:.2, filmGrain:.12, vignette:.6}
  },
  'moonlit-poetry': {
    selection:'rgba(160,168,214,.28)',
    palette:{room:'#0e0e1a', roomEdge:'#030307', paper:'#171826', paperEdge:'#26283e',
      ink:'#dcdcec', inkMuted:'#9496b4', inkFaint:'#5c5e7c',
      accent:'#b7bdd6', accentSoft:'#6e7396', border:'#2c2e48'},
    light:{source:'moonlight', color:'#c9d4ff', position:{x:.14, y:-.1}, shade:.48},
    atmosphere:{particles:.35, filmGrain:.1, vignette:.55}
  }
};

/* 出厂设置 = TN 的 balanced 灯预设 + manuscript 字体预设 */
const SETTINGS = {
  theme:'paper-and-ink',
  paper:'parchment',
  lamp:true,
  enabled:true,
  intensity:1.1,
  spread:74,
  beam:'pointed',
  aim:0,
  reach:1,
  softness:.65,
  bloom:.25,
  grain:.1,
  cursorGlow:.35,
  paperIllumination:.72,
  particles:.45,
  texture:1,
  cursorMode:'ink',
  // auto：探测到别的皮肤在改同一批 token 时，只叠纸与灯，不去抢它的配色
  coexist:'auto',
  // 滚条：上游三形态（纸夹 / 细杆 / 原生），纸夹另有四种金属
  scrollbar:{style:'clip', finish:'silver', barWidth:6, barOpacity:.45},
  // 窗光自成一组：上游的 Studio 里窗格数、斜度、柔边都是独立参数，
  // 不能借台灯的 softness（借了就是一团糊，达不到截图里那种 3×2 的方窗）。
  window:{x:.5, y:.5, columns:3, rows:2, softness:.15, slant:0}
};
const theme = () => THEMES[SETTINGS.theme];
const paper = () => PAPERS[SETTINGS.paper];

/**
 * 标定值：这一组是亮度分布对到上游官方截图（p50≈115 / p95≈178）的那一套。
 * 把滑杆推散之后还能一键回家——"复刻"得有个可回的基准。
 */
const NOCTURNE_DEFAULTS = JSON.parse(JSON.stringify(SETTINGS));

/* ═══════════════════════════════════════════════════════════════════════════
   2 · 小工具
   ═══════════════════════════════════════════════════════════════════════ */
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
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════════════════════════════
   3 · 光：app/nocturne/light-model.ts 的逐行移植
   ═══════════════════════════════════════════════════════════════════════ */
const barHalfWidth = (w, h) => Math.min(16, Math.max(4, .04 * Math.min(w, h)));

function between(offset, cell, bar, soft) {
  const t = offset / cell;
  return smoothstep(bar - soft, bar + soft, Math.abs(t - Math.round(t)) * cell);
}

function windowGobo(rig, x, y) {
  const w = rig.window;
  const soft = Math.max(.5, w.softness);
  const sx = x - (y - w.y) * w.skew;
  const dx = sx - w.x;
  const dy = y - w.y;
  const across = smoothstep(-soft, soft, w.width / 2 - Math.abs(dx));
  const down = smoothstep(-soft, soft, w.height / 2 - Math.abs(dy));
  const paneW = w.width / w.columns;
  const paneH = w.height / w.rows;
  const bar = barHalfWidth(paneW, paneH);
  const open = between(dx + w.width / 2, paneW, bar, soft) * between(dy + w.height / 2, paneH, bar, soft);
  return across * down * (.3 + .7 * open);
}

function irradiance(rig, x, y, normal) {
  const n = normal || [0, 0, 1];
  if (rig.source === 'moonlight') {
    return Math.max(0, dot3(n, [-rig.direction[0], -rig.direction[1], -rig.direction[2]])) * windowGobo(rig, x, y);
  }
  const d = [x - rig.position[0], y - rig.position[1], -rig.position[2]];
  const d2 = Math.max(1, dot3(d, d));
  const ray = norm(d);
  const cone = smoothstep(rig.cosOuter, rig.cosInner, dot3(ray, rig.direction));
  const lambert = Math.max(0, -dot3(n, ray));
  return (cone * lambert) / d2;
}

const toneMap = (v) => 1 - Math.exp(-Math.max(0, v));
const lightAmount = (rig, x, y, n) => toneMap(irradiance(rig, x, y, n) * rig.exposure);

function referenceExposure(rig, x, y) {
  const E = irradiance(rig, x, y);
  return E > 0 ? SETTINGS.intensity / E : 0;
}

/**
 * 与 TN buildRig 同一套几何。唯一改编：灯挂在「输入光标」上，而不是打字机小车上——
 * 于是底部仍有那道标志性的光锥，且它随你打字的位置游走。
 */
function buildRig(sheet, caretSheetX) {
  const width = sheet.width;
  const height = sheet.height;
  const halfAngle = Math.acos(spreadToCosine(SETTINGS.spread));
  const cosOuter = Math.cos(halfAngle);
  const cosInner = Math.cos(halfAngle * (1 - .85 * SETTINGS.softness));
  const source = theme().light.source;

  const base = {
    source,
    position:[0, 0, 1], direction:[0, 0, -1],
    cosOuter, cosInner, exposure:1,
    window:{x:width/2, y:height/2, width, height, columns:3, rows:2, softness:8, skew:0}
  };
  const swivel = (clamp(SETTINGS.aim, -45, 45) * Math.PI) / 180;

  if (source === 'carriage') {
    // 灯座钉在纸的横向中心，只随光标轻微偏移（±30%）。TN 的灯跟着打字机小车横移，
    // 那是因为终端的光标常在左侧；正文界面若照搬，光锥会永远挤在左边缘。
    const centre = width / 2;
    const lampX = clamp(centre + (caretSheetX - centre) * .3, 40, width - 40);
    const lampY = height - Math.max(18, height * .03);
    const lamp = [lampX, lampY, 12 + .02 * height];
    const throwLength = .6 * SETTINGS.reach * height;
    const aim = [lampX + Math.tan(swivel) * throwLength, lampY - throwLength, 0];
    const rig = Object.assign({}, base, {
      position:lamp,
      direction:norm([aim[0] - lamp[0], aim[1] - lamp[1], aim[2] - lamp[2]])
    });
    const refLength = .5 * SETTINGS.reach * height;
    const ref = [lampX + Math.tan(swivel) * refLength, lampY - refLength];
    rig.exposure = referenceExposure(rig, ref[0], ref[1]);
    return rig;
  }

  if (source === 'desk-lamp') {
    const pos = theme().light.position;
    const lamp = [pos.x * width, pos.y * height, (.3 + .4 * SETTINGS.reach) * height];
    const dx = width * .5 - lamp[0];
    const dy = height * .55 - lamp[1];
    const cos = Math.cos(swivel), sin = Math.sin(swivel);
    const aim = [lamp[0] + dx * cos - dy * sin, lamp[1] + dx * sin + dy * cos, 0];
    const rig = Object.assign({}, base, {
      position:lamp,
      direction:norm([aim[0] - lamp[0], aim[1] - lamp[1], aim[2] - lamp[2]])
    });
    rig.exposure = referenceExposure(rig, aim[0], aim[1]);
    return rig;
  }

  const pos = theme().light.position;
  const azimuth = Math.atan2(.5 - pos.y, .5 - pos.x) + swivel;
  const elevation = (40 * Math.PI) / 180;
  const direction = norm([
    Math.cos(azimuth) * Math.cos(elevation),
    Math.sin(azimuth) * Math.cos(elevation),
    -Math.sin(elevation)
  ]);
  const frame = SETTINGS.window;
  const pane = Math.max(60, (Math.min(width * .62, height * .7) * SETTINGS.reach) / 2);
  const rig = Object.assign({}, base, {
    direction,
    window:{
      x:width * frame.x,
      y:height * frame.y,
      width:pane * frame.columns,
      height:pane * frame.rows,
      columns:frame.columns,
      rows:frame.rows,
      softness:4 + 40 * frame.softness,
      skew:Math.tan((clamp(frame.slant, -35, 35) * Math.PI) / 180)
    }
  });
  const ref = Math.max(0, -direction[2]);
  rig.exposure = ref > 0 ? SETTINGS.intensity / ref : 0;
  return rig;
}

/**
 * 环境光下限。TN 的 ambientFloor 保证墨/纸 ≥ 4.5:1，那只够等宽的终端字；这里的正文是
 * 衬线散文，笔画细、字面小，实测同样的下限会让正文发灰。所以下限抬到 0.64——理由写在
 * docs/nocturne.md「为什么不是照抄 0.55」一节，不是随手调的数字。
 */
function ambientLevel() {
  const p = paper();
  const floor = p.appearance === 'light' ? .64 : .68;
  return Math.min(1, Math.max(floor, 1 - theme().light.shade * (.55 + .45 * SETTINGS.intensity)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · 纸：lib/nocturne/lighting/paper-light.ts 的双通道着色器（GLSL 原样）
   ═══════════════════════════════════════════════════════════════════════ */
const VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const NOISE = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
`;

const SURFACE = `#version 300 es
precision highp float;
uniform vec2 uSize; uniform float uScale; uniform float uSeed; uniform float uFold; uniform float uFelt;
uniform float uAge; uniform float uMottle; uniform float uCrinkle; uniform float uLaid; uniform float uLinen;
uniform float uPaper;
layout(location = 0) out vec4 outAlbedo;
layout(location = 1) out vec4 outNormal;
${NOISE}
const mat2 TURN = mat2(0.8, -0.6, 0.6, 0.8);
float relief(vec2 p) {
  vec2 q = p / uPaper;
  vec2 w = vec2(fbm(q * 0.012 + uSeed), fbm(q * 0.012 + uSeed + 9.2));
  float veins = 1.0 - abs(fbm(q * 0.02 + w * 3.0) * 2.0 - 1.0);
  float r = 0.35 * pow(veins, 6.0) + 0.35 * noise(q * vec2(0.6, 0.18)) + 0.3 * noise(p * 1.9);
  if (uFelt > 0.0) {
    vec2 q = TURN * p;
    float tooth = 0.62 * noise(q * 0.45) + 0.38 * noise(TURN * q * 0.95 + 5.3);
    float felt = 0.7 * tooth + 0.2 * noise(q * 0.11 + 2.1) + 0.1 * noise(q * vec2(0.5, 0.12));
    r = mix(r, felt, uFelt);
  }
  float laidLines = 0.5 + 0.5 * sin(p.y * 6.2831 / 4.2);
  float chain = exp(-pow((mod(p.x, 96.0) - 48.0) / 3.2, 2.0));
  r = mix(r, r * 0.6 + laidLines * 0.18 + chain * 0.35, uLaid);
  float weave = 0.5 + 0.5 * sin(p.x * 6.2831 / 3.4) * sin(p.y * 6.2831 / 3.4);
  float slub = noise(p * vec2(0.07, 1.3));
  return mix(r, r * 0.3 + weave * 0.5 + slub * 0.35, uLinen);
}
vec3 albedo(vec2 p) {
  vec2 uv = p / uSize;
  vec2 q = p / uPaper;
  float mottle = fbm(q * 0.006 + uSeed) * 0.65 + fbm(q * 0.022 + uSeed * 2.0) * 0.35;
  vec3 tint = mix(vec3(1.0, 0.985, 0.95), vec3(0.86, 0.74, 0.55), smoothstep(0.35, 0.8, mottle) * 0.85);
  vec3 base = mix(vec3(1.0), tint, uMottle);
  vec3 tone = vec3(1.0);
  float edge = min(min(uv.x, 1.0 - uv.x) * uSize.x, uv.y * uSize.y);
  float ragged = edge + (fbm(q * 0.05 + 3.0) - 0.5) * 26.0;
  tone *= mix(vec3(1.0), vec3(0.62, 0.45, 0.28), (1.0 - smoothstep(0.0, 46.0, ragged)) * 0.85);
  vec2 cell = floor(p / 70.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      if (hash12(c + uSeed) > 0.16) continue;
      vec2 centre = (c + vec2(hash12(c + 1.7), hash12(c + 4.1))) * 70.0;
      float radius = mix(1.5, 6.5, hash12(c + 8.3));
      float spot = 1.0 - smoothstep(radius * 0.4, radius * 2.4, length(p - centre));
      tone *= mix(vec3(1.0), vec3(0.8, 0.62, 0.45), spot * 0.7);
    }
  }
  float tide = smoothstep(0.015, 0.0, abs(fbm(q * 0.004 + uSeed + 31.0) - 0.58));
  tone *= mix(vec3(1.0), vec3(0.82, 0.7, 0.52), tide * 0.35);
  float fold = (p.y - uFold) / 2.5;
  tone *= 1.0 - 0.08 * exp(-fold * fold) + 0.03 * exp(-(fold - 2.2) * (fold - 2.2));
  float chainTone = exp(-pow((mod(p.x, 96.0) - 48.0) / 3.2, 2.0));
  base *= 1.0 - uLaid * (0.03 * chainTone + 0.005 * (0.5 + 0.5 * sin(p.y * 6.2831 / 4.2)));
  base *= 1.0 - uLinen * 0.02 * (0.5 + 0.5 * sin(p.x * 6.2831 / 3.4) * sin(p.y * 6.2831 / 3.4));
  if (uFelt > 0.0) {
    vec2 q = TURN * p;
    float threads = smoothstep(0.86, 0.97, noise(q * vec2(0.06, 1.1) + uSeed));
    threads += smoothstep(0.86, 0.97, noise(TURN * q * vec2(1.1, 0.06) + 3.0));
    base *= 1.0 - uFelt * 0.035 * min(1.0, threads);
  }
  return base * mix(vec3(1.0), tone, uAge);
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  float e = 0.9;
  float h0 = relief(p);
  float slope = 1.2 + 3.0 * uCrinkle;
  vec3 n = normalize(vec3(-(relief(p + vec2(e, 0.0)) - h0) * slope, -(relief(p + vec2(0.0, e)) - h0) * slope, 1.0));
  outAlbedo = vec4(albedo(p), 1.0);
  outNormal = vec4(n.xy * 0.5 + 0.5, 0.0, 1.0);
}`;

const LIGHT = `#version 300 es
precision highp float;
uniform sampler2D uAlbedo; uniform sampler2D uNormal;
uniform vec2 uSize; uniform float uScale; uniform int uSource;
uniform vec3 uLightPos; uniform vec3 uLightDir; uniform vec2 uCone; uniform float uExposure;
uniform vec4 uWindow; uniform vec4 uPanes; uniform vec3 uTint; uniform float uLamp;
uniform float uAmbient; uniform vec3 uAmbientTint; uniform float uRelief; uniform float uCrinkle;
uniform float uGrain; uniform float uTime; uniform float uSoft;
out vec4 outColor;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float between(float offset, float cell, float bar, float soft) {
  float t = offset / cell;
  return smoothstep(bar - soft, bar + soft, abs(t - round(t)) * cell);
}
float gobo(vec2 p) {
  float soft = max(0.5, uPanes.z);
  p.x -= (p.y - uWindow.y) * uPanes.w;
  vec2 d = p - uWindow.xy;
  vec2 inside = smoothstep(-soft, soft, uWindow.zw * 0.5 - abs(d));
  vec2 pane = uWindow.zw / uPanes.xy;
  float bar = clamp(0.04 * min(pane.x, pane.y), 4.0, 16.0);
  float open = between(d.x + uWindow.z * 0.5, pane.x, bar, soft) * between(d.y + uWindow.w * 0.5, pane.y, bar, soft);
  return inside.x * inside.y * (0.3 + 0.7 * open);
}
const float BULB = 30.0;
float irradiance(vec3 P, vec3 n) {
  if (uSource == 2) return max(0.0, dot(n, -uLightDir)) * gobo(P.xy);
  vec3 d = P - uLightPos; float d2 = max(1.0, dot(d, d)); vec3 r = d * inversesqrt(d2);
  float near = uSoft * (1.0 - smoothstep(0.0, 260.0, sqrt(d2)));
  float cone = smoothstep(uCone.x - 0.3 * near, uCone.y, dot(r, uLightDir));
  return cone * max(0.0, -dot(n, r)) / (d2 + uSoft * BULB * BULB);
}
void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec3 albedo = texelFetch(uAlbedo, texel, 0).rgb;
  vec2 nxy = texelFetch(uNormal, texel, 0).xy * 2.0 - 1.0;
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  float lit = (1.0 - exp(-irradiance(vec3(p, 0.0), vec3(0.0, 0.0, 1.0)) * uExposure)) * uLamp;
  vec2 uv = p / uSize;
  float vignette = smoothstep(0.15, 1.1, length((uv - vec2(0.5, 0.55)) * vec2(1.0, 1.15)));
  float ambient = mix(1.0, uAmbient * (1.0 - 0.3 * vignette), uLamp);
  vec3 irr = uAmbientTint * ambient + (1.0 - ambient) * lit * uTint;
  float relief = uRelief * (1.0 - 0.4 * lit);
  float bound = (0.16 * uCrinkle + 0.04) * relief;
  irr *= clamp(1.0 + (-nxy.x * 0.35 - nxy.y * 0.55) * (0.6 + 2.2 * uCrinkle) * relief, 1.0 - bound, 1.0 + bound);
  irr *= mix(0.9, 1.0, smoothstep(0.0, 28.0, min(uv.x, 1.0 - uv.x) * uSize.x));
  float g = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5;
  outColor = vec4(clamp(albedo * irr + g * (uGrain * 0.045 + 1.5 / 255.0), 0.0, 1.0), 1.0);
}`;

class PaperLight {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {premultipliedAlpha:false, antialias:false});
    this.state = this.gl ? 'ready' : 'failed';
    this.spec = null;
    this.textures = [];
    this.framebuffer = null;
    if (!this.gl) return;
    try {
      this.surfaceProgram = this.program(SURFACE);
      this.lightProgram = this.program(LIGHT);
      const buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), this.gl.STATIC_DRAW);
      this.gl.enableVertexAttribArray(0);
      this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
      this.su = this.locate(this.surfaceProgram, ['uSize','uScale','uSeed','uFold','uFelt','uAge','uMottle','uCrinkle','uLaid','uLinen','uPaper']);
      this.lu = this.locate(this.lightProgram, ['uAlbedo','uNormal','uSize','uScale','uSource','uLightPos','uLightDir','uCone','uExposure','uWindow','uPanes','uTint','uLamp','uAmbient','uAmbientTint','uRelief','uCrinkle','uGrain','uTime','uSoft']);
    } catch (error) {
      console.warn('paper light disabled:', error.message);
      this.state = 'failed';
    }
  }
  program(fragment) {
    const gl = this.gl;
    const program = gl.createProgram();
    const sources = [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]];
    for (const pair of sources) {
      const shader = gl.createShader(pair[0]);
      gl.shaderSource(shader, pair[1]);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader);
    }
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }
  locate(program, names) {
    const out = {};
    for (const name of names) out[name] = this.gl.getUniformLocation(program, name);
    return out;
  }
  build(spec) {
    const gl = this.gl;
    if (this.state !== 'ready') return;
    const paperDef = spec.p;
    const width = Math.max(1, Math.round(spec.width * spec.pixelRatio));
    const height = Math.max(1, Math.round(spec.height * spec.pixelRatio));
    this.canvas.width = width;
    this.canvas.height = height;
    this.spec = spec;
    this.release();
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    for (let i = 0; i < 2; i++) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
      this.textures.push(texture);
    }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    this.framebuffer = framebuffer;

    const u = this.su;
    gl.useProgram(this.surfaceProgram);
    gl.viewport(0, 0, width, height);
    gl.uniform2f(u.uSize, spec.width, spec.height);
    gl.uniform1f(u.uScale, spec.pixelRatio);
    gl.uniform1f(u.uSeed, 3.7);
    gl.uniform1f(u.uFold, spec.height * 0.38);
    // 纸纹的低频结构按纸的物理尺寸缩放：TN 的着色器是按 ~660×620 的纸调的，
    // 同样的频率铺到 1200px 的纸上，斑块就碎成了噪点。
    gl.uniform1f(u.uPaper, clamp(Math.sqrt(spec.width * spec.height) / 700, 0.9, 1.9));
    gl.uniform1f(u.uFelt, paperDef.surface.felt);
    gl.uniform1f(u.uAge, paperDef.surface.age);
    gl.uniform1f(u.uMottle, paperDef.surface.mottle);
    gl.uniform1f(u.uCrinkle, paperDef.surface.crinkle * SETTINGS.texture);
    gl.uniform1f(u.uLaid, paperDef.surface.laid * Math.min(1, SETTINGS.texture));
    gl.uniform1f(u.uLinen, paperDef.surface.linen * Math.min(1, SETTINGS.texture));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  render(rig, paperDef, time) {
    const gl = this.gl;
    const u = this.lu;
    if (!this.spec || this.state !== 'ready' || gl.isContextLost()) return;
    const lightColor = toUnit(theme().light.color);
    const peak = Math.max(lightColor[0], lightColor[1], lightColor[2], 1e-6);
    const room = toUnit(theme().palette.room);
    const strength = rig.source === 'moonlight' ? .75 : .4;
    const tintChannel = (c) => 1 + ((.6 + c * 1.5) - 1) * strength;

    gl.useProgram(this.lightProgram);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    gl.uniform1i(u.uAlbedo, 0);
    gl.uniform1i(u.uNormal, 1);
    gl.uniform2f(u.uSize, this.spec.width, this.spec.height);
    gl.uniform1f(u.uScale, this.spec.pixelRatio);
    gl.uniform1i(u.uSource, {carriage:0, 'desk-lamp':1, moonlight:2}[rig.source]);
    gl.uniform3fv(u.uLightPos, rig.position);
    gl.uniform3fv(u.uLightDir, rig.direction);
    gl.uniform2f(u.uCone, rig.cosOuter, rig.cosInner);
    gl.uniform1f(u.uExposure, rig.exposure);
    gl.uniform4f(u.uWindow, rig.window.x, rig.window.y, rig.window.width, rig.window.height);
    gl.uniform4f(u.uPanes, rig.window.columns, rig.window.rows, rig.window.softness, rig.window.skew);
    gl.uniform3f(u.uTint, lightColor[0] / peak, lightColor[1] / peak, lightColor[2] / peak);
    gl.uniform1f(u.uLamp, SETTINGS.lamp && SETTINGS.enabled ? 1 : 0);
    gl.uniform1f(u.uAmbient, ambientLevel());
    gl.uniform3f(u.uAmbientTint, tintChannel(room[0]), tintChannel(room[1]), tintChannel(room[2]));
    gl.uniform1f(u.uRelief, 2 * SETTINGS.paperIllumination);
    gl.uniform1f(u.uSoft, SETTINGS.beam === 'soft' ? 1 : 0);
    gl.uniform1f(u.uCrinkle, paperDef.surface.crinkle * SETTINGS.texture);
    gl.uniform1f(u.uGrain, reduceMotion ? 0 : SETTINGS.grain);
    gl.uniform1f(u.uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  release() {
    if (!this.gl) return;
    this.textures.forEach((texture) => this.gl.deleteTexture(texture));
    this.textures = [];
    if (this.framebuffer) { this.gl.deleteFramebuffer(this.framebuffer); this.framebuffer = null; }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · 辉光：lighting/glow-layer.ts
   ═══════════════════════════════════════════════════════════════════════ */
const MOTE_HASH = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const MOTES = Array.from({length:110}, (_, i) => ({
  x:MOTE_HASH(i*3.1), y:MOTE_HASH(i*7.7), z:MOTE_HASH(i*1.9),
  phase:MOTE_HASH(i*5.3)*100, size:.5 + MOTE_HASH(i*9.1)*1.6
}));
const wrap01 = (v) => ((v % 1) + 1) % 1;
const POOL_COLUMNS = 192;

function poolStrength(rig, appearance) {
  if (appearance === 'dark') return 1;
  if (rig.source === 'moonlight') return .2;
  return rig.source === 'desk-lamp' ? .1 : 0;
}

/**
 * screen 层的池色。亮纸上纸光已经把灯画出来了，池只负责月光与台灯的余温，用灯色即可；
 * 暗纸上池是唯一有光的地方，若照搬灯色 × 纸色，screen 会直接烧成一片白（实测过），
 * 所以取灯色的 34%——暖，但不刺眼。
 */
function poolColor(appearance) {
  const light = toUnit(theme().light.color).map((c) => Math.round(c * 255));
  return appearance === 'dark' ? light.map((c) => Math.round(c * 0.34)) : light;
}

class GlowLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = 0; this.height = 0; this.pixelRatio = 1;
    this.pool = document.createElement('canvas');
    this.soft = document.createElement('canvas');
    this.bloom = document.createElement('canvas');
    this.poolKey = '';
    this.sprite = document.createElement('canvas');
    this.sprite.width = this.sprite.height = 32;
    const s = this.sprite.getContext('2d');
    const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.22, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    s.fillStyle = g;
    s.fillRect(0, 0, 32, 32);
  }
  resize(width, height, pixelRatio) {
    this.width = width; this.height = height; this.pixelRatio = pixelRatio;
    this.canvas.width = Math.max(1, Math.round(width * pixelRatio));
    this.canvas.height = Math.max(1, Math.round(height * pixelRatio));
    this.poolKey = '';
  }
  ensurePool(rig, rgb) {
    const key = JSON.stringify([rig.position, rig.direction, rig.cosOuter, rig.cosInner, rig.exposure, rig.window, rgb, this.width, this.height]);
    if (key === this.poolKey) return;
    this.poolKey = key;
    const columns = POOL_COLUMNS;
    const rows = Math.max(8, Math.round((columns * this.height) / Math.max(1, this.width)));
    const channels = rgb.split(',').map(Number);
    for (const target of [this.pool, this.soft, this.bloom]) { target.width = columns; target.height = rows; }
    const poolCtx = this.pool.getContext('2d');
    const softCtx = this.soft.getContext('2d');
    const bloomCtx = this.bloom.getContext('2d');
    const image = poolCtx.createImageData(columns, rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < columns; i++) {
        const lit = lightAmount(rig, ((i + .5) / columns) * this.width, ((j + .5) / rows) * this.height);
        const k = (j * columns + i) * 4;
        image.data[k] = channels[0];
        image.data[k+1] = channels[1];
        image.data[k+2] = channels[2];
        image.data[k+3] = Math.round(Math.min(1, lit) * 255);
      }
    }
    poolCtx.putImageData(image, 0, 0);
    softCtx.filter = 'blur(1px)'; softCtx.drawImage(this.pool, 0, 0); softCtx.filter = 'none';
    bloomCtx.filter = 'blur(6px)'; bloomCtx.drawImage(this.pool, 0, 0); bloomCtx.filter = 'none';
  }
  clear() {
    const c = this.context;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  render(frame) {
    const c = this.context;
    if (!c) return;
    c.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    c.clearRect(0, 0, this.width, this.height);
    if (!frame.lamp) return;
    const rig = frame.rig;
    const pool = poolStrength(rig, frame.appearance);
    if (pool > 0) {
      this.ensurePool(rig, frame.poolRgb);
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      c.globalAlpha = pool;
      c.drawImage(this.soft, 0, 0, this.width, this.height);
      c.globalAlpha = pool * (frame.appearance === 'dark' ? .4 : .8);
      c.drawImage(this.bloom, 0, 0, this.width, this.height);
      c.globalAlpha = 1;
    }
    if (rig.source === 'desk-lamp') {
      const x = rig.position[0], y = rig.position[1];
      const radius = Math.max(1, this.height * .55);
      const spill = c.createRadialGradient(x, y, 0, x, y, radius);
      spill.addColorStop(0, 'rgba(' + frame.rgb + ', ' + (frame.appearance === 'light' ? .1 : .16) + ')');
      spill.addColorStop(1, 'rgba(' + frame.rgb + ', 0)');
      c.fillStyle = spill;
      c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    if (frame.particles > 0) {
      const count = Math.round(MOTES.length * frame.particles);
      const strength = frame.appearance === 'light' ? .5 : .9;
      for (let i = 0; i < count; i++) {
        const m = MOTES[i];
        const speed = .4 + m.z;
        const drift = Math.sin(frame.time * .05 * speed + m.phase) * .04 + frame.time * .004 * (m.z - .5);
        const fall = -frame.time * .006 * speed + Math.cos(frame.time * .07 + m.phase) * .03;
        const x = wrap01(m.x + drift) * this.width;
        const y = wrap01(m.y + fall) * this.height;
        const lit = lightAmount(rig, x, y);
        if (lit < .05) continue;
        const twinkle = .5 + .5 * Math.sin(frame.time * (.8 + m.z * 2.2) + m.phase);
        const size = m.size * (1 + m.z * 1.6);
        c.globalAlpha = Math.min(1, lit * twinkle * strength);
        c.drawImage(this.sprite, x - size * 2, y - size * 2, size * 4, size * 4);
      }
      c.globalAlpha = 1;
    }
    if (rig.source === 'carriage') {
      const x = rig.position[0], y = rig.position[1];
      const radius = Math.max(1, 110 * frame.intensity);
      const glare = c.createRadialGradient(x, y, 0, x, y, radius);
      glare.addColorStop(0, 'rgba(' + frame.rgb + ', ' + (frame.appearance === 'light' ? .26 : .45) + ')');
      glare.addColorStop(1, 'rgba(' + frame.rgb + ', 0)');
      c.fillStyle = glare;
      c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    if (frame.cursor && frame.cursorGlow > 0) {
      const x = frame.cursor.x, y = frame.cursor.y;
      const glow = c.createRadialGradient(x, y, 0, x, y, 34);
      glow.addColorStop(0, 'rgba(' + frame.rgb + ', ' + (.4 * frame.cursorGlow).toFixed(3) + ')');
      glow.addColorStop(1, 'rgba(' + frame.rgb + ', 0)');
      c.fillStyle = glow;
      c.fillRect(x - 34, y - 34, 68, 68);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   5.5 · 墨迹光标：lib/nocturne/components/block-cursor.tsx 的移植
   一块洇进纸里的墨：边缘软、边上稍深（墨积在那里）、底下那个字用纸色反白。
   它躺在纸光之下，所以灯把它和字一起照亮。等的时候往纸里沉再涌上来，
   沉下去时一圈淡淡的光晕散开；每敲一下，墨重新压进格子。
   ═══════════════════════════════════════════════════════════════════════ */
const BREATH_MS = 1700;
const REST_MS = 650;

/** 一口气：停住 → 沉进纸里 → 淡着躺一会 → 涌回来 */
const SINK = [
  {opacity: 1, offset: 0},
  {opacity: 1, offset: 0.36, easing: 'cubic-bezier(0.4, 0, 0.6, 1)'},
  {opacity: 0.08, offset: 0.62},
  {opacity: 0.08, offset: 0.74, easing: 'cubic-bezier(0.3, 0, 0.3, 1)'},
  {opacity: 1, offset: 1}
];
/** 墨往下沉的同时，一圈光晕散开、被纸吸走 */
const SPREAD = [
  {opacity: 0, transform: 'scale(1)', offset: 0},
  {opacity: 0, transform: 'scale(1)', offset: 0.36, easing: 'ease-out'},
  {opacity: 0.3, transform: 'scale(1.2)', offset: 0.52, easing: 'ease-in'},
  {opacity: 0, transform: 'scale(1.55)', offset: 0.74},
  {opacity: 0, transform: 'scale(1)', offset: 1}
];
/** 一次击键：新墨压进格子 */
const FRESH = [{transform: 'scale(1.12)'}, {transform: 'scale(1)'}];
const FRESH_HALO = [{opacity: 0.35, transform: 'scale(1.3)'}, {opacity: 0, transform: 'scale(1)'}];

/**
 * 光标下的那个字。
 *
 * 早先用 firstChild / nextSibling / parentNode 手工爬树，输入框删到空的时候锚点会变成
 * 编辑器元素本身，那套逻辑就爬出了编辑器、开始遍历整页——单帧卡 1.1 秒，界面直接假死。
 * 现在只做一件事：把"光标到编辑器末尾"这段文本取出来读第一个字。原地完成，永远出不去。
 */
function glyphAfter(editor, range) {
  try {
    if (!editor || !range || !editor.contains(range.startContainer)) return '';
    if (!editor.textContent) return '';
    const rest = document.createRange();
    rest.setStart(range.startContainer, range.startOffset);
    rest.setEnd(editor, editor.childNodes.length);
    const text = rest.toString();
    return text ? text.charAt(0) : '';
  } catch (error) {
    return '';
  }
}

/** 一个字的自然宽度：中日韩约 1em，拉丁约半 em。墨块按它取宽，字才不会挤出格子。 */
function advanceOf(context, char) {
  if (!char) return 0;
  const width = context.measureText(char).width;
  return Number.isFinite(width) ? width : 0;
}

function isEditor(element) {
  if (!element || element.nodeType !== 1) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || element.isContentEditable;
}

/** 当前该跟的那个输入框：优先焦点元素，其次选区所在的编辑区。 */
function activeEditor() {
  const focused = document.activeElement;
  if (isEditor(focused)) return focused;
  const selection = window.getSelection();
  let node = selection && selection.anchorNode;
  while (node && node !== document.body) {
    if (node.nodeType === 1 && node.isContentEditable) return node;
    node = node.parentNode;
  }
  return null;
}

class InkCaret {
  constructor() {
    this.enabled = true;
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.element = document.createElement('div');
    this.element.className = 'dn-caret';
    this.element.setAttribute('aria-hidden', 'true');
    this.halo = document.createElement('div');
    this.halo.className = 'dn-ink-halo';
    this.blot = document.createElement('div');
    this.blot.className = 'dn-ink-blot';
    this.glyph = document.createElement('span');
    this.glyph.className = 'dn-ink-glyph';
    this.element.append(this.halo, this.blot, this.glyph);
    this.breathing = [];
    this.inComposition = false;
    this.shown = false;
    this.editor = null;
    this.lastInkAt = 0;
    this.dirty = true;
    this.lastMeasure = 0;
    this.point = {x: 0, y: 0, height: 18};
  }

  /** 挂到 body 上。调用方负责把它插在两个纸层之前——它必须躺在纸光之下。 */
  mount(before) {
    this.quillEl = buildQuill();
    this.mode = 'ink';
    if (before && before.parentNode) {
      // 两件器物都要躺在纸光之下：插在纸层之前，z-index 也只差一档。
      before.parentNode.insertBefore(this.quillEl, before);
      before.parentNode.insertBefore(this.element, before);
    } else {
      document.body.appendChild(this.quillEl);
      document.body.appendChild(this.element);
    }
    this.onSelection = () => { this.dirty = true; this.sync(); };
    this.onKey = () => { this.dirty = true; this.ink(); };
    this.onAny = () => { this.dirty = true; };
    this.onScroll = () => { this.dirty = true; };
    this.onCompositionStart = () => { this.inComposition = true; this.releaseNative(); };
    this.onCompositionEnd = () => { this.inComposition = false; this.sync(); };
    this.onBlur = () => { this.hide(); };
    document.addEventListener('selectionchange', this.onSelection);
    document.addEventListener('keydown', this.onKey, true);
    document.addEventListener('input', this.onAny, true);
    document.addEventListener('compositionstart', this.onCompositionStart, true);
    document.addEventListener('compositionend', this.onCompositionEnd, true);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('resize', this.onAny);
    window.addEventListener('scroll', this.onScroll, true);
    this.breathe();
  }

  destroy() {
    document.removeEventListener('selectionchange', this.onSelection);
    document.removeEventListener('keydown', this.onKey, true);
    document.removeEventListener('input', this.onAny, true);
    document.removeEventListener('compositionstart', this.onCompositionStart, true);
    document.removeEventListener('compositionend', this.onCompositionEnd, true);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('resize', this.onAny);
    window.removeEventListener('scroll', this.onScroll, true);
    this.releaseNative();
    this.breathing.forEach((animation) => animation.cancel());
    if (this.element.parentNode) this.element.remove();
    if (this.quillEl && this.quillEl.parentNode) this.quillEl.remove();
  }

  /** 呼吸：停 REST_MS，再花 BREATH_MS 沉下去、涌回来，循环。 */
  breathe() {
    this.breathing.forEach((animation) => animation.cancel());
    this.breathing = [];
    if (this.reduce.matches) return;
    const timing = {duration: BREATH_MS, delay: REST_MS, iterations: Infinity};
    this.breathing = [
      this.blot.animate(SINK, timing),
      this.glyph.animate(SINK, timing),
      this.halo.animate(SPREAD, timing)
    ];
  }

  /** 一次击键：墨重新压进格子，呼吸从头开始。 */
  ink() {
    const now = performance.now();
    if (now - this.lastInkAt < 24) return;
    this.lastInkAt = now;
    this.breathe();
    if (this.reduce.matches || !this.shown) return;
    this.blot.animate(FRESH, {duration: 160, easing: 'ease-out'});
    this.halo.animate(FRESH_HALO, {duration: 240, easing: 'ease-out'});
  }

  /** 换形态（墨迹 / 羽毛 / 原生）。要立刻生效，所以顺手把下一次测量标记为脏。 */
  setMode(mode) {
    if (mode !== 'ink' && mode !== 'quill' && mode !== 'none') return;
    this.mode = mode;
    this.hide();
    this.dirty = true;
    this.lastMeasure = 0;
  }

  /** 把宿主的原生光标藏起来之前先确认我们的墨块在场，否则用户会看不到光标。 */
  claimNative() {
    if (!this.editor || this.editor.__dnNativeClaimed) return;
    this.editor.__dnNativeClaimed = true;
    this.editor.style.setProperty('caret-color', 'transparent', 'important');
  }

  releaseNative() {
    if (!this.editor || !this.editor.__dnNativeClaimed) return;
    this.editor.style.removeProperty('caret-color');
    this.editor.__dnNativeClaimed = false;
  }

  hide() {
    if (!this.shown) return;
    this.shown = false;
    this.element.style.display = 'none';
    if (this.quillEl) this.quillEl.style.display = 'none';
    this.releaseNative();
    this.editor = null;
  }

  measure(editor) {
    try {
      return this.measureInner(editor);
    } catch (error) {
      return null;
    }
  }

  measureInner(editor) {
    const style = getComputedStyle(editor);
    const fontSize = parseFloat(style.fontSize) || 16;
    if (editor.tagName === 'INPUT' || editor.tagName === 'TEXTAREA') {
      const box = editor.getBoundingClientRect();
      measureCanvas.font = style.fontStyle + ' ' + style.fontWeight + ' ' + fontSize + 'px ' + style.fontFamily;
      const caret = editor.selectionStart == null ? String(editor.value || '').length : editor.selectionStart;
      const textWidth = measureCanvas.measureText(String(editor.value || '').slice(0, caret)).width;
      const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.4;
      const char = String(editor.value || '').charAt(caret);
      return {
        x: box.left + textWidth - (editor.scrollLeft || 0),
        y: box.top + (box.height - lineHeight) / 2,
        height: lineHeight,
        fontSize,
        char,
        cellWidth: char ? advanceOf(measureCanvas, char) : 0,
        focused: document.hasFocus()
      };
    }
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!range.collapsed) return null;
    const rects = range.getClientRects();
    let rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    if ((!rect || (!rect.height && !rect.width)) && selection.focusNode) {
      const probe = document.createRange();
      probe.selectNodeContents(selection.focusNode);
      rect = probe.getBoundingClientRect();
    }
    if (!rect || !rect.height) return null;
    // 字宽要按光标所在那一层的字算，不能拿编辑区根节点的字号顶替：
    // 引用块、代码块、标题里的字号都可能不同。
    const anchor = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const anchorStyle = anchor ? getComputedStyle(anchor) : style;
    const anchorSize = parseFloat(anchorStyle.fontSize) || fontSize;
    measureCanvas.font = anchorStyle.fontStyle + ' ' + anchorStyle.fontWeight + ' ' + anchorSize + 'px ' + anchorStyle.fontFamily;
    const char = glyphAfter(editor, range);
    return {
      x: rect.left,
      y: rect.top,
      height: rect.height,
      fontSize: anchorSize,
      char,
      cellWidth: char ? advanceOf(measureCanvas, char) : 0,
      focused: document.hasFocus()
    };
  }

  /** 每帧调一次：位置、字、焦点。量不出来就老实藏起来，交给原生光标。 */
  sync() {
    try {
      return this.syncInner();
    } catch (error) {
      this.hide();
      return null;
    }
  }

  syncInner() {
    if (!this.enabled) { this.hide(); return null; }
    const editor = activeEditor();
    if (!editor) { this.hide(); return null; }
    if (editor !== this.editor) {
      this.releaseNative();
      this.editor = editor;
      this.dirty = true;
    }
    // 量一次选区要强制回流。每帧都量，长会话里就是每秒 60 次强制布局。
    // 所以只在"确实动了"或每 250ms 兜底时才量。
    const now = performance.now();
    if (!this.dirty && now - this.lastMeasure < 250) return this.shown ? this.point : null;
    this.dirty = false;
    this.lastMeasure = now;
    const info = this.measure(editor);
    if (!info || this.inComposition) { this.hide(); return null; }
    if (info.y + info.height < 0 || info.y > window.innerHeight) { this.hide(); return null; }
    if (this.mode === 'none') { this.hide(); return null; }
    if (this.mode === 'quill') this.paintQuill(info);
    else this.paintInk(info);
    if (!this.shown) {
      this.shown = true;
      this.breathe();
    }
    this.claimNative();
    this.point = {x: info.x, y: info.y, height: info.height, cellWidth: info.cellWidth || info.fontSize * 0.52};
    return this.point;
  }

  /** 墨块：一格见方的洇墨，字用纸色反白。 */
  paintInk(info) {
    const width = Math.max(6, Math.min(info.fontSize * 1.25, info.cellWidth || info.fontSize * 0.52));
    if (this.quillEl) this.quillEl.style.display = 'none';
    this.element.style.display = 'block';
    this.element.style.width = width.toFixed(2) + 'px';
    this.element.style.height = info.height.toFixed(2) + 'px';
    this.element.style.transform = 'translate(' + info.x.toFixed(2) + 'px, ' + info.y.toFixed(2) + 'px)';
    this.element.style.setProperty('--dn-ink-size', info.fontSize.toFixed(1) + 'px');
    this.element.dataset.focused = String(info.focused);
    this.element.dataset.appearance = paper().appearance;
    if (this.glyph.textContent !== info.char) this.glyph.textContent = info.char;
  }

  /** 羽毛笔：笔尖落在基线上，整支按行高缩放，向右倾 35°。 */
  paintQuill(info) {
    if (!this.quillEl) return;
    const height = info.height * Q_LINES;
    const scale = height / Q_VIEW.height;
    const nibX = info.x + (info.cellWidth || info.fontSize * 0.5) * Q_NIB.x;
    const nibY = info.y + info.height * Q_NIB.y;
    const x = nibX - Q_VIEW.left * scale;
    const y = nibY - Q_VIEW.top * scale;
    this.element.style.display = 'none';
    this.quillEl.style.display = 'block';
    this.quillEl.style.width = (Q_VIEW.width * scale).toFixed(2) + 'px';
    this.quillEl.style.height = height.toFixed(2) + 'px';
    this.quillEl.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px)';
    this.quillEl.dataset.focused = String(info.focused);
    this.quillEl.dataset.appearance = paper().appearance;
  }
}

const measureCanvas = document.createElement('canvas').getContext('2d');


/* ═══════════════════════════════════════════════════════════════════════════
   5.6 · 羽毛笔光标：lib/nocturne/components/quill-cursor.tsx 的移植
   笔尖落在插入点、整支向右倾 35°：鎏金笔尖装在笔箍里，裸露的角质笔杆，
   两侧羽枝一窄一宽、带两道分叉，笔脊上有一道光跑过。几何全是算出来的，没有位图。
   ═══════════════════════════════════════════════════════════════════════ */
const Q_VIEW = {left: 4, top: 74, width: 64, height: 78};
const Q_LINES = 1.15;
const Q_NIB = {x: 0.15, y: 0.84};
const Q_LEAN = 35;

const qRound = (value) => Number(value.toFixed(2));

function curveThrough(points) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [qRound(p1[0] + (p2[0] - p0[0]) / 6), qRound(p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [qRound(p2[0] - (p3[0] - p1[0]) / 6), qRound(p2[1] - (p3[1] - p1[1]) / 6)];
    d += ' C' + c1[0] + ' ' + c1[1] + ' ' + c2[0] + ' ' + c2[1] + ' ' + p2[0] + ' ' + p2[1];
  }
  return d;
}
const pathThrough = (points) => 'M' + points[0][0] + ' ' + points[0][1] + curveThrough(points);

const Q_RACHIS = [[0, -24], [0.4, -46], [2.4, -70], [5.6, -90]];

function qAlong(t) {
  const p0 = Q_RACHIS[0], p1 = Q_RACHIS[1], p2 = Q_RACHIS[2], p3 = Q_RACHIS[3];
  const u = 1 - t;
  const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  const at = [0, 0];
  Q_RACHIS.forEach((p, i) => { at[0] += weights[i] * p[0]; at[1] += weights[i] * p[1]; });
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  const length = Math.hypot(dx, dy) || 1;
  const tangent = [dx / length, dy / length];
  return {at, tangent, normal: [-tangent[1], tangent[0]]};
}

const Q_VANE_FROM = 0.05;
const qGauss = (s, at, width) => Math.exp(-Math.pow((s - at) / width, 2));
const qTrailing = (s) => 8.4 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.75)), 0.85) * (1 - 0.3 * qGauss(s, 0.42, 0.018) - 0.24 * qGauss(s, 0.67, 0.016));
const qLeading = (s) => 3.4 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.65)), 0.9) * (1 - 0.32 * qGauss(s, 0.56, 0.02));

function qEdge(s, side, reach) {
  const t = Q_VANE_FROM + (1 - Q_VANE_FROM) * s;
  const curve = qAlong(t);
  const width = (side > 0 ? qTrailing(s) : qLeading(s)) * (reach == null ? 1 : reach);
  return [
    qRound(curve.at[0] + curve.normal[0] * width * side + curve.tangent[0] * width * 0.38),
    qRound(curve.at[1] + curve.normal[1] * width * side + curve.tangent[1] * width * 0.38)
  ];
}

const Q_SAMPLES = Array.from({length: 61}, (_, i) => i / 60);
const Q_VANE = (() => {
  const leading = Q_SAMPLES.map((s) => qEdge(s, -1));
  const trailing = Q_SAMPLES.slice().reverse().map((s) => qEdge(s, 1));
  return pathThrough(leading.concat(trailing.slice(1))) + ' Z';
})();

function qBarbs(side, count) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const s = 0.04 + (i / (count - 1)) * 0.9;
    const curve = qAlong(Q_VANE_FROM + (1 - Q_VANE_FROM) * s);
    const end = qEdge(Math.min(1, s + 0.05), side, 0.94);
    const width = side > 0 ? qTrailing(s) : qLeading(s);
    const control = [
      qRound(curve.at[0] + curve.normal[0] * width * side * 0.55),
      qRound(curve.at[1] + curve.normal[1] * width * side * 0.55)
    ];
    d += 'M' + qRound(curve.at[0]) + ' ' + qRound(curve.at[1]) + ' Q' + control[0] + ' ' + control[1] + ' ' + end[0] + ' ' + end[1] + ' ';
  }
  return d.trim();
}

const Q_TRAILING_BARBS = qBarbs(1, 30);
const Q_LEADING_BARBS = qBarbs(-1, 22);

const Q_RACHIS_SHAPE = (() => {
  const steps = Array.from({length: 25}, (_, i) => (i / 24) * 0.98);
  const side = (sign) => steps.map((t) => {
    const curve = qAlong(t);
    const half = 0.62 * (1 - t) + 0.08;
    return [qRound(curve.at[0] + curve.normal[0] * half * sign), qRound(curve.at[1] + curve.normal[1] * half * sign)];
  });
  return pathThrough(side(-1).concat(side(1).reverse())) + ' Z';
})();

const Q_RACHIS_LINE = 'M-0.15 -24 C0.25 -46 2.25 -70 5.6 -90';
const Q_CALAMUS = 'M-1.15 -10.4 C-1.2 -15 -1.05 -20 -0.82 -24.6 L0.82 -24.6 C1.05 -20 1.2 -15 1.15 -10.4 Z';
const Q_DOWN = 'M0 -25.2 q-2.6 0.5 -4.6 -1.4 M0 -26.6 q-3 -0.2 -4.8 -3.2 M0.1 -28 q-2.4 -0.9 -3.6 -4.2 '
  + 'M0.2 -25.4 q2.8 0.7 4.8 -0.8 M0.2 -27 q3.3 -0.1 5.2 -2.9 M0.3 -28.6 q2.7 -0.8 4 -4';
const Q_FERRULE = 'M-1.55 -9 L1.55 -9 L1.4 -11.2 L-1.4 -11.2 Z';
const Q_NIB_PATH = 'M0 0.3 C-0.6 -2 -1.9 -5.4 -1.7 -9.1 L1.7 -9.1 C1.9 -5.4 0.6 -2 0 0.3 Z';
const Q_SLIT = 'M0 -0.2 L0 -5.4';
const Q_SHOULDERS = 'M-1.5 -7.6 Q0 -8.3 1.5 -7.6';

/** 笔的 SVG。整支先在原点画好，再整体右倾 35°。 */
function buildQuill() {
  const svg = [
    '<svg viewBox="', -Q_VIEW.left, ' ', -Q_VIEW.top, ' ', Q_VIEW.width, ' ', Q_VIEW.height, '">',
    '<defs>',
    '<linearGradient id="dn-quill-vane" x1="0" x2="1" y1="0" y2="0">',
    '<stop offset="0" stop-color="var(--dn-quill-edge)"/>',
    '<stop offset="0.3" stop-color="var(--dn-quill-sheen)"/>',
    '<stop offset="0.5" stop-color="var(--dn-quill-body)"/>',
    '<stop offset="1" stop-color="var(--dn-quill-edge)"/>',
    '</linearGradient>',
    '<linearGradient id="dn-quill-gilt" x1="0" x2="1" y1="0" y2="0">',
    '<stop offset="0" stop-color="var(--dn-metal-lo)"/>',
    '<stop offset="0.35" stop-color="var(--dn-metal-hi)"/>',
    '<stop offset="0.6" stop-color="var(--dn-metal)"/>',
    '<stop offset="1" stop-color="var(--dn-metal-lo)"/>',
    '</linearGradient>',
    '<linearGradient id="dn-quill-horn" x1="0" x2="1" y1="0" y2="0">',
    '<stop offset="0" stop-color="#8c7651"/><stop offset="0.35" stop-color="#f3e6c6"/><stop offset="1" stop-color="#a58d61"/>',
    '</linearGradient>',
    '<clipPath id="dn-quill-clip"><path d="', Q_VANE, '"/></clipPath>',
    '</defs>',
    '<g class="dn-quill-sway"><g transform="rotate(', Q_LEAN, ')">',
    '<path d="', Q_DOWN, '" class="dn-quill-down"/>',
    '<path d="', Q_VANE, '" class="dn-quill-vane"/>',
    '<g clip-path="url(#dn-quill-clip)">',
    '<path d="', Q_TRAILING_BARBS, '" class="dn-quill-barbs"/>',
    '<path d="', Q_LEADING_BARBS, '" class="dn-quill-barbs"/>',
    '<rect class="dn-quill-shine" x="-8" y="-32" width="22" height="8"/>',
    '</g>',
    '<path d="', Q_RACHIS_SHAPE, '" class="dn-quill-rachis"/>',
    '<path d="', Q_RACHIS_LINE, '" class="dn-quill-rachis-light"/>',
    '<path d="', Q_CALAMUS, '" fill="url(#dn-quill-horn)"/>',
    '<path d="', Q_FERRULE, '" fill="url(#dn-quill-gilt)"/>',
    '<path d="', Q_NIB_PATH, '" fill="url(#dn-quill-gilt)"/>',
    '<path d="', Q_SHOULDERS, '" class="dn-quill-engraving"/>',
    '<path d="', Q_SLIT, '" class="dn-quill-engraving"/>',
    '<circle cx="0" cy="-6" r="0.5" class="dn-quill-hole"/>',
    '<circle class="dn-quill-glint" cx="0.4" cy="-1.8" r="0.9"/>',
    '</g></g></svg>'
  ].join('');
  const element = document.createElement('div');
  element.className = 'dn-quill';
  element.setAttribute('aria-hidden', 'true');
  element.innerHTML = svg;
  return element;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5.7 · 缮写室 Studio：纸、房间、灯、器物
   形状照上游 Studio（深色玻璃面板 + 斜体标题 + 描金细边），控件是原生的，
   所以键盘、读屏、缩放都按系统来。
   ═══════════════════════════════════════════════════════════════════════ */
const STUDIO_THEMES = [
  {id: 'paper-and-ink', name: '纸与墨'},
  {id: 'midnight-study', name: '子夜书斋'},
  {id: 'moonlit-poetry', name: '月下诗稿'}
];
const STUDIO_PAPERS = [
  {id: 'onionskin', name: '葱皮'},
  {id: 'cotton', name: '棉浆'},
  {id: 'laid', name: '帘纹'},
  {id: 'linen', name: '亚麻'},
  {id: 'parchment', name: '羊皮'},
  {id: 'night', name: '夜纸'}
];
const STUDIO_COEXIST = [
  {id: 'auto', name: '自动'},
  {id: 'material', name: '只叠材质'},
  {id: 'full', name: '接管配色'}
];
const STUDIO_CURSORS = [
  {id: 'ink', name: '墨迹'},
  {id: 'quill', name: '羽毛'},
  {id: 'none', name: '原生'}
];
const STUDIO_SCROLL = [
  {id: 'clip', name: '纸夹'},
  {id: 'bar', name: '细杆'},
  {id: 'native', name: '原生'}
];
/** 四种金属：高光 → 本体 → 暗边，直接做成色片给按钮用。 */
const STUDIO_FINISHES = [
  {id: 'silver', name: '银', swatch: 'linear-gradient(140deg,#ffffff,#b9bfc7 55%,#4d535b)'},
  {id: 'brass', name: '黄铜', swatch: 'linear-gradient(140deg,#fff1c6,#c19a52 55%,#4f3712)'},
  {id: 'gold', name: '金', swatch: 'linear-gradient(140deg,#fff6cf,#d9ad4c 55%,#6a4a0c)'},
  {id: 'black', name: '黑', swatch: 'linear-gradient(140deg,#9a9a9e,#2e2e31 55%,#060607)'}
];
const STUDIO_SLIDERS = [
  {key: 'intensity', label: '灯强', min: 0, max: 2, step: 0.05, format: (v) => Math.round(v * 100) + '%'},
  {key: 'spread', label: '光锥', min: 20, max: 160, step: 1, format: (v) => Math.round(v) + '°'},
  {key: 'softness', label: '柔边', min: 0, max: 1, step: 0.01, format: (v) => Math.round(v * 100) + '%'},
  {key: 'grain', label: '胶片颗粒', min: 0, max: 1, step: 0.01, format: (v) => Math.round(v * 100) + '%'},
  {key: 'particles', label: '光里尘埃', min: 0, max: 1, step: 0.01, format: (v) => Math.round(v * 100) + '%'},
  {key: 'texture', label: '纸纹深度', min: 0, max: 1.6, step: 0.02, format: (v) => Math.round(v * 100) + '%'}
];

function buildStudio(options) {
  const onChange = options.onChange;
  const state = options.state();

  const root = document.createElement('div');
  root.className = 'dn-studio';
  root.dataset.open = 'false';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '缮写室');

  const part = [];
  part.push('<button class="close" type="button" aria-label="关闭">×</button>');
  part.push('<div class="eyebrow">Nocturne Studio</div>');
  part.push('<h2>灯、纸与墨</h2>');
  part.push('<div class="group"><h3>房间</h3><div class="grid" data-group="theme"></div></div>');
  part.push('<div class="group"><h3>纸</h3><div class="grid" data-group="paper"></div></div>');
  part.push('<div class="group"><div class="switch"><span class="label">台灯</span>'
    + '<button class="toggle" type="button" role="switch" aria-checked="true" aria-label="台灯"></button></div></div>');
  part.push('<div class="group" data-group="sliders"></div>');
  part.push('<div class="group"><h3>光标</h3><div class="grid" data-group="cursor"></div></div>');
  part.push('<div class="group"><h3>滚条</h3><div class="grid" data-group="scroll"></div>'
    + '<div class="grid" data-group="finish" hidden></div>'
    + '<div data-group="bar-slider" hidden></div>'
    + '<p class="note" data-group="scroll-hint">纸夹是 Gem 夹，夹在纸的右缘：外圈在纸前、'
    + '内舌压在纸上、弯头探出纸外。拖动它就能卷动正文。</p></div>');
  part.push('<div class="group"><h3>共存</h3><div class="grid" data-group="coexist"></div>'
    + '<p class="note" data-group="coexist-hint" hidden></p></div>');
  part.push('<div class="group"><button class="reset" type="button">回到标定值</button></div>');
  part.push('<div class="group"><p class="note">纸、灯、墨的色值与纸面参数取自 Typewriter-Nocturne（MIT）。'
    + '这里的每一项都直接改渲染参数，改完即见。</p></div>');
  root.innerHTML = part.join('');

  const groupOf = (name) => root.querySelector('[data-group="' + name + '"]');

  function choiceButton(id, label, swatch) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.value = id;
    button.setAttribute('aria-pressed', 'false');
    if (swatch) {
      const chip = document.createElement('span');
      chip.className = 'swatch';
      chip.style.background = swatch;
      button.appendChild(chip);
    }
    const text = document.createElement('span');
    text.textContent = label;
    button.appendChild(text);
    return button;
  }

  for (const item of STUDIO_THEMES) {
    const theme = THEMES[item.id];
    const swatch = 'linear-gradient(140deg, ' + theme.palette.room + ' 0 52%, ' + theme.light.color + ' 52% 100%)';
    groupOf('theme').appendChild(choiceButton(item.id, item.name, swatch));
  }
  for (const item of STUDIO_PAPERS) {
    groupOf('paper').appendChild(choiceButton(item.id, item.name, PAPERS[item.id].paper));
  }
  for (const item of STUDIO_CURSORS) {
    groupOf('cursor').appendChild(choiceButton(item.id, item.name, null));
  }
  for (const item of STUDIO_COEXIST) {
    groupOf('coexist').appendChild(choiceButton(item.id, item.name, null));
  }
  for (const item of STUDIO_SCROLL) {
    groupOf('scroll').appendChild(choiceButton(item.id, item.name, null));
  }
  for (const item of STUDIO_FINISHES) {
    groupOf('finish').appendChild(choiceButton(item.id, item.name, item.swatch));
  }

  const reads = [];

  /** 组内的小滑杆：值落在嵌套对象里，所以读和写都走取值函数。 */
  function miniSlider(host, spec) {
    const wrap = document.createElement('div');
    wrap.className = 'slider';
    const head = document.createElement('div');
    head.className = 'head';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = spec.label;
    const value = document.createElement('span');
    value.className = 'value';
    head.append(label, value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.setAttribute('aria-label', spec.label);
    input.addEventListener('input', () => {
      const next = Number(input.value);
      value.textContent = spec.format(next);
      onChange(spec.key, next);
    });
    wrap.append(head, input);
    host.appendChild(wrap);
    reads.push(() => {
      const current = spec.value();
      input.value = String(current);
      value.textContent = spec.format(current);
    });
  }

  miniSlider(groupOf('bar-slider'), {
    key: 'scrollBarWidth', label: '杆宽', min: 3, max: 14, step: 1,
    format: (v) => Math.round(v) + 'px', value: () => state.scrollbar.barWidth
  });
  miniSlider(groupOf('bar-slider'), {
    key: 'scrollBarOpacity', label: '杆不透明度', min: 0.1, max: 1, step: 0.05,
    format: (v) => Math.round(v * 100) + '%', value: () => state.scrollbar.barOpacity
  });

  for (const slider of STUDIO_SLIDERS) {
    const wrap = document.createElement('div');
    wrap.className = 'slider';
    const head = document.createElement('div');
    head.className = 'head';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = slider.label;
    const value = document.createElement('span');
    value.className = 'value';
    head.append(label, value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.setAttribute('aria-label', slider.label);
    input.addEventListener('input', () => {
      const next = Number(input.value);
      value.textContent = slider.format(next);
      onChange(slider.key, next);
    });
    wrap.append(head, input);
    groupOf('sliders').appendChild(wrap);
    reads.push(() => {
      input.value = String(state[slider.key]);
      value.textContent = slider.format(state[slider.key]);
    });
  }

  const toggle = root.querySelector('.toggle');
  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', String(next));
    onChange('lamp', next);
  });

  root.querySelector('.reset').addEventListener('click', () => {
    onChange('preset', 'calibrated');
    sync();
  });

  root.querySelector('.close').addEventListener('click', () => {
    root.dataset.open = 'false';
    handle.setAttribute('aria-expanded', 'false');
  });

  // 组名不等于设置键：光标那组叫 cursor，设置里叫 cursorMode。
  const KEY_OF = {
    theme: 'theme', paper: 'paper', cursor: 'cursor', coexist: 'coexist',
    scroll: 'scrollStyle', finish: 'scrollFinish'
  };
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button.choice');
    if (!button) return;
    const group = button.parentElement.dataset.group;
    onChange(KEY_OF[group] || group, button.dataset.value);
    sync();
  });

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'dn-handle';
  handle.setAttribute('aria-expanded', 'false');
  handle.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 4h10M3 8h10M3 12h6"/></svg><span>缮写室</span>';
  handle.addEventListener('click', () => {
    const open = root.dataset.open !== 'true';
    root.dataset.open = String(open);
    handle.setAttribute('aria-expanded', String(open));
  });

  function sync() {
    const mark = (group, active) => {
      for (const button of root.querySelectorAll('[data-group="' + group + '"] button.choice')) {
        button.setAttribute('aria-pressed', String(button.dataset.value === active));
      }
    };
    mark('theme', state.theme);
    mark('paper', state.paper);
    mark('cursor', state.cursorMode);
    mark('coexist', state.coexist);
    mark('scroll', state.scrollbar.style);
    mark('finish', state.scrollbar.finish);
    // 金属只在"纸夹"下有意义，杆宽只在"细杆"下有意义——没有的项不显示。
    groupOf('finish').hidden = state.scrollbar.style !== 'clip';
    groupOf('bar-slider').hidden = state.scrollbar.style !== 'bar';
    // 探测到别的皮肤在改同一批 token 时，明说一句，并给出一键切换。
    const hint = root.querySelector('[data-group="coexist-hint"]');
    const foreign = typeof options.foreign === 'function' ? options.foreign() : null;
    const resolved = typeof options.resolvedCoexist === 'function'
      ? options.resolvedCoexist()
      : (state.coexist === 'auto' ? (foreign ? 'material' : 'full') : state.coexist);
    if (hint) {
      if (foreign) {
        hint.hidden = false;
        const why = state.coexist === 'auto' ? '已自动让位：' : '';
        hint.textContent = '检测到 ' + foreign + ' 正在覆盖同一批配色 token。'
          + (resolved === 'material'
            ? why + '只叠纸与灯，两套皮肤可以叠着用。'
            : why + '本皮肤接管配色——两套同时改同一批 token，谁后加载谁赢。');
      } else {
        hint.hidden = true;
      }
    }
    toggle.setAttribute('aria-checked', String(state.lamp));
    for (const read of reads) read();
  }
  sync();

  return {element: root, handle, sync};
}

/* ═══════════════════════════════════════════════════════════════════════════
   5.9 · 纸夹滚条
   上游（lib/nocturne/components/scroll-clip.tsx）：一枚 Gem 夹夹在纸的右缘——
   外圈在纸前，内舌在纸后（只留下压住纸面的一道痕），弯头探出纸外。它跟着滚动
   位置走弹簧（5Hz / 阻尼 0.72），移动时朝反方向微微歪一下（3.2Hz / 0.35）。

   这里没有终端，所以"滚动"换成任意滚动容器：从视口中线上那一点往上找。
   整棵树可能上万节点，逐元素问 overflow 会把主线程按住——elementFromPoint
   只走一条祖先链，代价与树的大小无关。
   ═══════════════════════════════════════════════════════════════════════ */
/** 画布 100 × 31 单位；屏幕上 84 × 26，纸边落在 88 单位处，所以弯头刚好探出去。 */
const CLIP_WIDTH = 84;
const CLIP_HEIGHT = 26;
const CLIP_EDGE = 88;
const CLIP_ON_PAPER = (CLIP_WIDTH * CLIP_EDGE) / 100;
/** 手夹上去的夹子从来不会完全摆正。 */
const CLIP_REST_TILT = -0.1;
const CLIP_TRACK_MARGIN = 18;
const CLIP_GLIDE = {frequency: 5, damping: 0.72};
const CLIP_TILT = {frequency: 3.2, damping: 0.35};
const CLIP_TILT_REST = {distance: 0.001, speed: 0.002};
const CLIP_PIXEL_REST = {distance: 0.4, speed: 12};
/** 夹子的握点离纸缘这么远：再远弯头就悬空，再近弯头会被窗口裁掉。 */
const CLIP_RIGHT_INSET = 12;
const SPRING_SUBSTEP = 1 / 480;

/** 每种金属：高光、本体、暗边。 */
const CLIP_FINISHES = {
  silver: ['#ffffff', '#b9bfc7', '#4d535b'],
  brass: ['#fff1c6', '#c19a52', '#4f3712'],
  gold: ['#fff6cf', '#d9ad4c', '#6a4a0c'],
  black: ['#9a9a9e', '#2e2e31', '#060607']
};

/** 金属丝的走线：外圈在纸前，内舌在纸后，中间的弯把两者接起来。 */
const CLIP_FRONT = 'M90 3 H14 A12 12 0 0 0 14 27 H70';
const CLIP_HINGE = 'M90 21 A9 9 0 0 0 90 3';
const CLIP_TONGUE = 'M76 9 H26 A6 6 0 0 0 26 21 H90';

/** 一段金属丝：暗边、金属本体、朝光的一侧高光。 */
function clipWire(d, colors) {
  const light = colors[0];
  const body = colors[1];
  const edge = colors[2];
  return '<g>'
    + '<path d="' + d + '" class="dn-clip-edge" stroke="' + edge + '"/>'
    + '<path d="' + d + '" class="dn-clip-body" stroke="' + body + '"/>'
    + '<path d="' + d + '" class="dn-clip-light" stroke="' + light
    + '" transform="translate(-0.3 -0.55)"/>'
    + '<path d="' + d + '" class="dn-clip-glint" transform="translate(-0.35 -0.6)"/>'
    + '</g>';
}

/** 与上游同一份弹簧：substep 定步长，所以帧慢也不会炸。 */
function stepSpring(body, target, params, dt, rest) {
  const omega = 2 * Math.PI * params.frequency;
  const stiffness = omega * omega;
  const damping = 2 * params.damping * omega;
  const limits = rest || {distance: 0.5, speed: 10};
  let position = body.position;
  let velocity = body.velocity;
  let remaining = Math.max(0, Math.min(dt, 0.1));
  while (remaining > 0) {
    const h = Math.min(SPRING_SUBSTEP, remaining);
    remaining -= h;
    const acceleration = -stiffness * (position - target) - damping * velocity;
    velocity += acceleration * h;
    position += velocity * h;
  }
  if (Math.abs(position - target) < limits.distance && Math.abs(velocity) < limits.speed) {
    return {position: target, velocity: 0};
  }
  return {position: position, velocity: velocity};
}

class ScrollClip {
  constructor() {
    this.element = null;
    this.target = null;
    this.shape = '';
    this.y = {position: -1, velocity: 0};
    this.tilt = {position: 0, velocity: 0};
    this.trackTop = 0;
    this.trackLeft = 0;
    this.trackHeight = 0;
    this.thumbHeight = CLIP_HEIGHT;
    this.targetY = 0;
    this.last = 0;
    this.dragging = false;
    this.needLayout = true;
    this.placeDirty = true;
    this.appearance = 'light';
    this.listeners = [];
    this.padded = null;
    this.paddingBefore = '';
    this.preferred = null;
  }

  mount(options) {
    const option = options || {};
    const element = document.createElement('div');
    element.className = 'dn-scroll dn-scroll-clip';
    element.hidden = true;
    element.setAttribute('role', 'scrollbar');
    element.setAttribute('aria-orientation', 'vertical');
    element.setAttribute('aria-label', '滚动正文');
    element.setAttribute('aria-valuemin', '0');
    element.style.zIndex = String(option.zIndex == null ? 6 : option.zIndex);
    element.dataset.appearance = 'light';
    (option.parent || document.body).appendChild(element);
    this.element = element;
    this.preferred = option.preferred || null;
    this.bindPointer();
    this.apply();
    return element;
  }

  /** 设置变了就重来一遍：形状（纸夹/细杆/原生）与金属都可能换了。 */
  apply() {
    if (!this.element) return;
    const settings = SETTINGS.scrollbar || {};
    const style = settings.style === 'bar' || settings.style === 'native' ? settings.style : 'clip';
    if (style === 'native') {
      this.detach();
      this.element.hidden = true;
      this.y = {position: -1, velocity: 0};
      return;
    }
    const shape = style === 'clip' ? 'clip:' + (settings.finish || 'silver') : 'bar';
    if (shape !== this.shape) {
      this.shape = shape;
      this.build(shape);
      this.y = {position: -1, velocity: 0};
    }
    this.needLayout = true;
    this.layout();
  }

  build(shape) {
    const element = this.element;
    const clip = shape.indexOf('clip:') === 0;
    element.className = 'dn-scroll ' + (clip ? 'dn-scroll-clip' : 'dn-scroll-bar');
    if (clip) {
      const finish = shape.slice(5);
      const colors = CLIP_FINISHES[finish] || CLIP_FINISHES.silver;
      const id = 'dn-clip-' + finish;
      element.style.transformOrigin = CLIP_ON_PAPER + 'px 50%';
      element.innerHTML = '<svg viewBox="0 -0.5 100 31" aria-hidden="true">'
        + '<defs>'
        + '<clipPath id="' + id + '-paper"><rect x="-20" y="-20" width="'
        + (CLIP_EDGE + 20) + '" height="70"/></clipPath>'
        + '<clipPath id="' + id + '-beyond"><rect x="' + CLIP_EDGE
        + '" y="-20" width="40" height="70"/></clipPath>'
        + '<filter id="' + id + '-blur" x="-20%" y="-60%" width="140%" height="220%">'
        + '<feGaussianBlur stdDeviation="1.1"/></filter>'
        + '</defs>'
        // 纸面上：内舌压出的痕，和夹子投下的影。
        + '<g clip-path="url(#' + id + '-paper)">'
        + '<path d="' + CLIP_TONGUE + '" class="dn-clip-pressed"/>'
        + '<path d="' + CLIP_FRONT + ' ' + CLIP_HINGE + '" class="dn-clip-shadow" filter="url(#'
        + id + '-blur)"/>'
        + '</g>'
        // 纸外：探出去的那一段内舌，只有弯头以外才看得见。
        + '<g clip-path="url(#' + id + '-beyond)">' + clipWire(CLIP_TONGUE, colors) + '</g>'
        + clipWire(CLIP_HINGE, colors)
        + clipWire(CLIP_FRONT, colors)
        + '</svg>';
    } else {
      element.style.transformOrigin = '50% 50%';
      element.innerHTML = '';
    }
  }

  /** 几何：找到滚动容器，把轨道、滑块长度、当前位置一次算出来。 */
  layout() {
    if (!this.element) return;
    if (!this.target || !this.target.isConnected) {
      this.attach();
      if (!this.target) {
        this.element.hidden = true;
        return;
      }
    }
    const target = this.target;
    const base = target.scrollHeight - target.clientHeight;
    if (base <= 8) {
      this.element.hidden = true;
      return;
    }
    this.element.hidden = false;
    const rect = target.getBoundingClientRect();
    const settings = SETTINGS.scrollbar || {};
    const clip = this.shape.indexOf('clip:') === 0;
    this.trackTop = rect.top + CLIP_TRACK_MARGIN;
    this.trackHeight = Math.max(40, rect.height - CLIP_TRACK_MARGIN * 2);
    // 挂在纸缘上，而不是正文栏的右缘：正文栏右缘上有字，夹子本身有 74px 长，
    // 挂上去就会压住最后几个字。整扇窗就是这张纸，所以取窗口右缘。
    this.trackLeft = window.innerWidth - CLIP_RIGHT_INSET;
    this.thumbHeight = clip
      ? CLIP_HEIGHT
      : Math.max(28, (this.trackHeight * target.clientHeight) / target.scrollHeight);
    const travel = Math.max(1, this.trackHeight - this.thumbHeight);
    this.targetY = this.trackTop + clamp(target.scrollTop / base, 0, 1) * travel;
    if (this.appearance !== paper().appearance) {
      this.appearance = paper().appearance;
      this.element.dataset.appearance = this.appearance;
    }
    if (clip) {
      this.element.style.left = (this.trackLeft - CLIP_ON_PAPER) + 'px';
      this.element.style.width = CLIP_WIDTH + 'px';
      this.element.style.height = CLIP_HEIGHT + 'px';
      this.element.style.opacity = '';
    } else {
      const width = Math.max(2, Number(settings.barWidth) || 6);
      this.element.style.left = (this.trackLeft - width - 3) + 'px';
      this.element.style.width = width + 'px';
      this.element.style.height = this.thumbHeight + 'px';
      this.element.style.opacity = String(clamp(
        settings.barOpacity == null ? 0.45 : Number(settings.barOpacity), 0, 1));
    }
    this.element.setAttribute('aria-valuemax', String(Math.round(base)));
    this.element.setAttribute('aria-valuenow', String(Math.round(target.scrollTop)));
    // 第一帧直接落位：不从屏幕顶上滑进来。
    if (this.y.position < 0 || reduceMotion) {
      this.y = {position: this.targetY, velocity: 0};
      this.tilt = {position: 0, velocity: 0};
    }
    this.placeDirty = true;
  }

  place() {
    if (!this.element) return;
    const clip = this.element.classList.contains('dn-scroll-clip');
    const tilt = clip ? CLIP_REST_TILT + this.tilt.position : 0;
    this.element.style.transform = 'translateY(' + this.y.position.toFixed(2)
      + 'px) rotate(' + tilt.toFixed(4) + 'rad)';
  }

  /** 滚动位置每帧推进弹簧；返回是否还在动。 */
  step(now) {
    if (!this.element) return false;
    // 找不到滚动容器就隔 500ms 再找一次：正文栏、会话列表都可能比插件晚挂上。
    const stale = !this.target || !this.target.isConnected;
    if (this.needLayout || (stale && now - (this.lastProbe || 0) > 500)) {
      this.needLayout = false;
      this.lastProbe = now;
      this.layout();
    }
    if (!this.target || this.element.hidden) return false;
    let last = this.last;
    let remaining = last ? Math.min(0.5, (now - last) / 1000) : 1 / 60;
    this.last = now;
    const clip = this.shape.indexOf('clip:') === 0;
    while (remaining > 0) {
      const dt = Math.min(1 / 60, remaining);
      remaining -= dt;
      const previous = this.y.velocity;
      if (!this.dragging) this.y = stepSpring(this.y, this.targetY, CLIP_GLIDE, dt, CLIP_PIXEL_REST);
      // 被推着走的轻东西会朝相反方向歪，然后荡回来。
      const lean = -this.y.velocity * 0.0009
        - ((this.y.velocity - previous) / Math.max(dt, 1 / 240)) * 0.00002;
      this.tilt = stepSpring(this.tilt, clamp(lean, -0.22, 0.22), CLIP_TILT, dt, CLIP_TILT_REST);
    }
    const moving = Math.abs(this.y.position - this.targetY) > 0.05
      || this.y.velocity !== 0 || this.tilt.velocity !== 0;
    if (moving || this.dragging || this.placeDirty) {
      this.place();
      this.placeDirty = false;
    }
    if (!moving && !this.dragging) this.last = 0;
    return moving || clip;
  }

  bindPointer() {
    const element = this.element;
    element.addEventListener('pointerdown', (event) => {
      // 不让拖动把焦点从输入框抢走。
      event.preventDefault();
      try { element.setPointerCapture(event.pointerId); } catch (error) { /* 旧内核 */ }
      this.dragging = true;
      this.grab = event.clientY - this.y.position;
    });
    element.addEventListener('pointermove', (event) => {
      if (!this.dragging || !this.target) return;
      const travel = Math.max(1, this.trackHeight - this.thumbHeight);
      const y = clamp(event.clientY - this.grab, this.trackTop, this.trackTop + travel);
      this.y = {position: y, velocity: (y - this.y.position) * 60};
      const base = Math.max(0, this.target.scrollHeight - this.target.clientHeight);
      this.target.scrollTop = ((y - this.trackTop) / travel) * base;
      this.placeDirty = true;
    });
    const stop = (event) => {
      if (!this.dragging) return;
      this.dragging = false;
      if (event.pointerId != null) {
        try { element.releasePointerCapture(event.pointerId); } catch (error) { /* 已经释放 */ }
      }
      this.placeDirty = true;
    };
    element.addEventListener('pointerup', stop);
    element.addEventListener('pointercancel', stop);
  }

  /** 从视口中线那一点往上找可滚动容器：只走一条祖先链，代价与树的大小无关。 */
  findScroller() {
    if (this.preferred) {
      const node = document.querySelector(this.preferred);
      if (node && this.canScroll(node)) return node;
    }
    const canScroll = (node) => this.canScroll(node);
    let node = document.elementFromPoint(
      Math.round(window.innerWidth * 0.5), Math.round(window.innerHeight * 0.45));
    let best = null;
    let bestHeight = 0;
    let guard = 0;
    while (node && guard < 40) {
      guard += 1;
      if (canScroll(node)) {
        const height = node.getBoundingClientRect().height;
        if (height > window.innerHeight * 0.55) return node;
        if (height > bestHeight) { best = node; bestHeight = height; }
      }
      node = node.parentElement;
    }
    if (best) return best;
    const root = document.scrollingElement;
    if (root && this.canScroll(root)) return root;
    return null;
  }

  canScroll(node) {
    if (!node || node.nodeType !== 1) return false;
    const overflow = getComputedStyle(node).overflowY;
    if (!/(auto|scroll|overlay)/.test(overflow)) return false;
    return node.scrollHeight - node.clientHeight > 8;
  }

  attach() {
    const next = this.findScroller();
    if (!next) { this.detach(); return; }
    if (next === this.target) return;
    this.detach();
    this.target = next;
    const onScroll = () => { this.needLayout = true; };
    next.addEventListener('scroll', onScroll, {passive: true});
    this.listeners.push({target: next, type: 'scroll', handler: onScroll});
    this.hideNative(next);
    this.needLayout = true;
  }

  /** 容器的原生滚条让位；用内边距补回被让出的宽度，避免正文横向跳一下。 */
  hideNative(element) {
    if (element.dataset.dnScroll === 'custom') return;
    const before = element.clientWidth;
    element.dataset.dnScroll = 'custom';
    const after = element.clientWidth;
    if (after > before + 0.5) {
      const padding = parseFloat(getComputedStyle(element).paddingRight) || 0;
      this.paddingBefore = element.style.paddingRight;
      element.style.paddingRight = (padding + (after - before)) + 'px';
      this.padded = element;
    }
  }

  detach() {
    for (const item of this.listeners) item.target.removeEventListener(item.type, item.handler);
    this.listeners = [];
    if (this.target) {
      if (this.target.dataset) delete this.target.dataset.dnScroll;
      if (this.padded === this.target) this.target.style.paddingRight = this.paddingBefore || '';
      this.target = null;
    }
    this.padded = null;
    this.needLayout = true;
  }

  destroy() {
    this.detach();
    if (this.element && this.element.parentNode) this.element.remove();
    this.element = null;
  }
}

const CSS_TEXT = "/* dsh-nocturne —— 纸的配色由 token 决定，材质由 canvas 决定。\n   这里只做两件事：把 DSH 的语义别名换成纸与墨；给两片 canvas 找位置。\n   颜色取自 Typewriter-Nocturne 的 papers.ts（MIT）。 */\n\nhtml, :root {\n  --dn-paper: #efdfbd;\n  --dn-ink: #2a2019;\n  --dn-ink-muted: #6b5f52;\n  --dn-room: #241a14;\n  --dn-room-edge: #070504;\n  --dn-gilt: #6f5420;\n  --dn-light-rgb: 255 210 154;\n  --dn-metal-lo: #5e431c;\n  --dn-metal-hi: #f3dca4;\n  --dn-metal: #b8904c;\n  /* 缮写室面板用到的字族：宿主不一定有，给出与样张一致的回落链 */\n  --font-ui: \"EB Garamond\", \"Iowan Old Style\", Palatino, Georgia, serif;\n  --font-display: \"Cormorant Garamond\", \"EB Garamond\", Georgia, serif;\n  --font-mono: var(--dsh-font-family-code, ui-monospace, monospace);\n\n  /* 配色 token 不写在这里：运行时由 applyTokens() 内联写入并带 !important。\n     写在这里会反过来压过内联更新，导致换纸只换画布、不换界面底色。 */\n\n  /* 字体：衬线正文，等宽复古代码。字体文件不随包分发，走系统栈回落。 */\n  --dsh-font-family-text: \"EB Garamond\", \"Iowan Old Style\", \"Palatino Linotype\", Palatino,\n    Georgia, \"Source Han Serif SC\", \"Songti SC\", \"Noto Serif CJK SC\", serif !important;\n  --dsh-font-family-code: \"Courier Prime\", \"IBM Plex Mono\", \"Courier New\",\n    \"DejaVu Sans Mono\", ui-monospace, monospace !important;\n}\n\n/* 整扇窗就是这张纸。没被画到的地方也必须落到纸色上——否则留给 `html` 的\n   默认底会把正文区露成黑洞（第一次装载测试就是这么翻车的）。 */\n/* 纸的底色挂在 --dn-sheet 上：接管配色时是纸色，只让位时是 transparent（宿主自己画）。 */\nhtml, body { background: var(--dn-sheet, transparent) !important; }\n\n/* 两片 canvas：直接挂在 body 下，不能包一层带 z-index 的容器——\n   那会给它们造一个隔离栈，multiply 就再也合不到页面上（实测见 docs/nocturne.md）。 */\ncanvas[data-dn=\"paper\"], canvas[data-dn=\"glow\"] {\n  position: fixed;\n  left: 0;\n  top: 0;\n  display: block;\n  pointer-events: none;\n  transform-origin: 0 0;\n}\ncanvas[data-dn=\"paper\"] {\n  mix-blend-mode: multiply;\n  z-index: 2147482000;\n}\ncanvas[data-dn=\"glow\"] {\n  mix-blend-mode: screen;\n  z-index: 2147482001;\n}\n\n/* 纸的四边压暗，给出\"一张纸\"的厚度；比 TN 的 #vignette 更贴边，\n   因为这里的纸是整扇窗。 */\nhtml::after {\n  content: \"\";\n  position: fixed;\n  inset: 0;\n  z-index: 2147482002;\n  pointer-events: none;\n  background: radial-gradient(ellipse 92% 88% at 50% 46%, transparent 52%, rgba(0, 0, 0, .42) 100%);\n}\n\n/* 缮写室是\"器物\"，不是纸上的字：它悬在纸光之上，不被灯压暗——\n   与上游一致，Studio 属于窗框而不属于纸面。 */\n.dn-studio { z-index: 2147483000; }\n.dn-handle { z-index: 2147482999; opacity: .55; }\n\n\n.dn-caret{\n  position:fixed; left:0; top:0; z-index: 2147481999;\n  display:none; pointer-events:none; will-change:transform;\n  --dn-ink-size:16px;\n  --dn-ink-weight:400;\n}\n.dn-ink-blot,\n.dn-ink-halo{\n  position:absolute; inset:7% 0.5px;\n  background:var(--dn-caret-ink, #3a2c20);\n}\n.dn-ink-blot{\n  border-radius:22% 14% 18% 12% / 12% 20% 10% 18%;\n  box-shadow:\n    inset 0 0 0 .5px rgba(0,0,0,.22),\n    inset 0 0 3px rgba(0,0,0,.28),\n    0 0 1.2px var(--dn-caret-ink, #3a2c20);\n  filter:blur(.3px);\n}\n.dn-ink-halo{\n  border-radius:40%;\n  opacity:0;\n  filter:blur(2.5px);\n}\n.dn-ink-glyph{\n  position:absolute; inset:0;\n  display:flex; align-items:center; justify-content:center;\n  color:var(--dsw-alias-bg-base, #efdfbd);\n  font-family:var(--dsh-font-family-code, ui-monospace, monospace);\n  font-size:var(--dn-ink-size);\n  font-weight:var(--dn-ink-weight);\n  line-height:1; white-space:pre;\n  font-variant-ligatures:none;\n}\n/* 失焦时墨退掉，只留一个淡淡的格子轮廓。 */\n.dn-caret[data-focused=\"false\"] .dn-ink-blot,\n.dn-caret[data-focused=\"false\"] .dn-ink-halo,\n.dn-caret[data-focused=\"false\"] .dn-ink-glyph{ display:none }\n.dn-caret[data-focused=\"false\"]::after{\n  content:\"\"; position:absolute; inset:7% .5px;\n  border:1px solid var(--dn-caret-ink, #3a2c20); border-radius:2px; opacity:.45;\n}\n.dn-caret[data-appearance=\"dark\"] .dn-ink-blot{\n  box-shadow:\n    inset 0 0 0 .5px rgba(255,255,255,.25),\n    inset 0 0 3px rgba(255,255,255,.3),\n    0 0 1.2px var(--dn-caret-ink, #3a2c20);\n}\n/* ── 羽毛笔光标：形状、渐变、摆动、光晕都照搬上游 .tn-quill ─────────────── */\n.dn-quill{\n  position:fixed; left:0; top:0; z-index:1;\n  display:none; pointer-events:none; will-change:transform;\n  --dn-quill-edge:#120e0c;\n  --dn-quill-body:#2b2420;\n  --dn-quill-sheen:#5f5753;\n  --dn-quill-barb:rgba(168,152,138,.42);\n  --dn-quill-rachis:#e4d8c0;\n  --dn-quill-down:rgba(70,60,54,.65);\n  filter:drop-shadow(.8px 1.6px 1px rgba(0,0,0,.3));\n  animation:dn-quill-breathe 1.2s ease-in-out infinite alternate;\n}\n.dn-quill[data-appearance=\"dark\"]{\n  --dn-quill-edge:#9d9485;\n  --dn-quill-body:#ebe4d6;\n  --dn-quill-sheen:#fffdf8;\n  --dn-quill-barb:rgba(140,128,108,.5);\n  --dn-quill-rachis:#fffdf6;\n  --dn-quill-down:rgba(236,229,216,.75);\n}\n.dn-quill svg{display:block; width:100%; height:100%; overflow:visible}\n.dn-quill-sway{transform-box:view-box; transform-origin:0 0; animation:dn-quill-sway 3.4s ease-in-out infinite alternate}\n.dn-quill-vane{fill:url(#dn-quill-vane)}\n.dn-quill-barbs{fill:none; stroke:var(--dn-quill-barb); stroke-width:.28; stroke-linecap:round}\n.dn-quill-rachis{fill:var(--dn-quill-rachis)}\n.dn-quill-rachis-light{fill:none; stroke:#fff; stroke-width:.22; opacity:.55}\n.dn-quill-down{fill:none; stroke:var(--dn-quill-down); stroke-width:.35; stroke-linecap:round}\n.dn-quill-engraving{fill:none; stroke:var(--dn-metal-lo); stroke-width:.3}\n.dn-quill-hole{fill:var(--dn-metal-lo)}\n.dn-quill-shine{fill:#fff; opacity:.2; animation:dn-quill-shine 2.8s ease-in-out infinite}\n.dn-quill-glint{fill:#fff; opacity:0; animation:dn-quill-glint 2.8s ease-in-out infinite}\n.dn-quill[data-focused=\"false\"]{opacity:.4; animation:none}\n.dn-quill[data-focused=\"false\"] .dn-quill-sway,\n.dn-quill[data-focused=\"false\"] .dn-quill-shine,\n.dn-quill[data-focused=\"false\"] .dn-quill-glint{animation:none}\n@keyframes dn-quill-breathe{from{opacity:1} to{opacity:.62}}\n@keyframes dn-quill-sway{from{transform:rotate(-1.6deg)} to{transform:rotate(1.6deg)}}\n@keyframes dn-quill-shine{0%{transform:translateY(0)} 100%{transform:translateY(-46px)}}\n@keyframes dn-quill-glint{\n  0%,72%{opacity:0}\n  80%{opacity:.9}\n  88%{opacity:.15}\n  100%{opacity:0}\n}\n\n/* ── 缮写室 Studio：一张悬在桌上的深色玻璃面板 ─────────────────────────── */\n.dn-studio{\n  position:fixed; z-index:40; top:52px; right:18px;\n  width:296px; max-height:calc(100% - 88px); overflow-y:auto;\n  padding:16px 18px 18px;\n  border:1px solid rgba(176,138,74,.35);\n  border-radius:12px;\n  background:rgba(22,16,12,.9);\n  backdrop-filter:blur(12px);\n  box-shadow:0 24px 60px -20px rgba(0,0,0,.8);\n  color:#f1e6cf;\n  font-family:var(--font-ui);\n  display:none;\n}\n.dn-studio[data-open=\"true\"]{display:block}\n.dn-studio .eyebrow{\n  font-variant:small-caps; letter-spacing:.2em; font-size:11px;\n  color:rgba(241,230,207,.62);\n}\n.dn-studio h2{\n  margin:0 0 10px;\n  font-family:var(--font-display); font-style:italic; font-weight:500;\n  font-size:23px; line-height:1.2; text-wrap:balance;\n}\n.dn-studio .group{\n  margin-top:13px; padding-top:11px;\n  border-top:1px solid rgba(176,138,74,.28);\n  display:grid; gap:9px;\n}\n.dn-studio .group h3{\n  margin:0; font-weight:500; font-style:italic; font-size:16px;\n}\n.dn-studio .grid{display:grid; grid-template-columns:repeat(3, 1fr); gap:5px}\n.dn-studio .grid.two{grid-template-columns:repeat(2, 1fr)}\n.dn-studio button.choice{\n  padding:5px 4px 6px;\n  border:1px solid rgba(176,138,74,.3); border-radius:6px;\n  background:transparent; color:#f1e6cf;\n  font-family:var(--font-ui); font-size:12.5px; line-height:1.2;\n  cursor:pointer; display:grid; gap:4px; justify-items:stretch;\n}\n.dn-studio button.choice[aria-pressed=\"true\"]{\n  border-color:#b08a4a;\n  box-shadow:inset 0 0 0 1px #b08a4a;\n}\n.dn-studio button.choice:focus-visible{outline:1px dotted #b08a4a; outline-offset:2px}\n.dn-studio .swatch{\n  height:20px; border-radius:3px;\n  box-shadow:inset 0 0 0 1px rgba(0,0,0,.35);\n}\n.dn-studio .slider{display:grid; gap:2px}\n.dn-studio .head{display:flex; justify-content:space-between; align-items:center}\n.dn-studio .label,\n.dn-studio .value{\n  font-family:var(--dsh-font-family-code, ui-monospace, monospace); font-size:10.5px;\n  letter-spacing:.14em; text-transform:uppercase;\n  color:rgba(241,230,207,.62); font-variant-numeric:tabular-nums;\n}\n.dn-studio .value{color:#f1e6cf; letter-spacing:.04em}\n.dn-studio input[type=\"range\"]{\n  -webkit-appearance:none; appearance:none;\n  width:100%; height:16px; margin:0; cursor:pointer; background:\n    linear-gradient(rgba(241,230,207,.62), rgba(241,230,207,.62)) 0 50% / 100% 1px no-repeat,\n    repeating-linear-gradient(90deg, rgba(241,230,207,.62) 0 1px, transparent 1px 10%) 0 50% / 100% 8px no-repeat;\n}\n.dn-studio input[type=\"range\"]::-webkit-slider-thumb{\n  -webkit-appearance:none; width:9px; height:16px; border-radius:2px;\n  border:1px solid #5e431c;\n  background:linear-gradient(90deg, #f3dca4, #b8904c 55%, #5e431c);\n  box-shadow:0 1px 3px rgba(0,0,0,.5);\n}\n.dn-studio input[type=\"range\"]:focus-visible{outline:1px dotted #b08a4a; outline-offset:3px}\n.dn-studio .switch{display:flex; justify-content:space-between; align-items:center}\n.dn-studio .toggle{\n  position:relative; width:36px; height:19px; flex:none;\n  border-radius:10px; border:1px solid rgba(176,138,74,.3);\n  background:transparent; cursor:pointer; padding:0;\n}\n.dn-studio .toggle::after{\n  content:\"\"; position:absolute; top:2px; left:2px;\n  width:13px; height:13px; border-radius:50%;\n  background:rgba(241,230,207,.62);\n  transition:transform 140ms ease;\n}\n.dn-studio .toggle[aria-checked=\"true\"]{border-color:#b08a4a; background:rgba(255,215,154,.12)}\n.dn-studio .toggle[aria-checked=\"true\"]::after{\n  transform:translateX(17px);\n  background:radial-gradient(circle at 35% 35%, #f3dca4, #b8904c 60%, #5e431c);\n}\n.dn-studio button.reset{\n  width:100%; padding:6px 8px;\n  border:1px solid rgba(176,138,74,.45); border-radius:6px;\n  background:rgba(255,215,154,.1); color:#f3dca4;\n  font-family:var(--font-ui); font-size:13px; cursor:pointer;\n}\n.dn-studio button.reset:hover{background:rgba(255,215,154,.18)}\n.dn-studio button.reset:focus-visible{outline:1px dotted #b08a4a; outline-offset:2px}\n.dn-studio .note{\n  margin:0; font-size:12px; line-height:1.5;\n  color:rgba(241,230,207,.55);\n}\n.dn-studio .close{\n  position:absolute; top:10px; right:10px;\n  width:22px; height:22px; display:grid; place-items:center;\n  border:1px solid transparent; border-radius:5px;\n  background:transparent; color:rgba(241,230,207,.62);\n  font-size:15px; line-height:1; cursor:pointer;\n}\n.dn-studio .close:hover{color:#f1e6cf; border-color:rgba(176,138,74,.4)}\n\n/* 右下角那个把手：平时很淡，悬停才亮起来 */\n.dn-handle{\n  position:fixed; z-index:39; right:18px; bottom:16px;\n  display:flex; align-items:center; gap:7px;\n  padding:7px 11px;\n  border:1px solid rgba(176,138,74,.32); border-radius:8px;\n  background:rgba(22,16,12,.9); backdrop-filter:blur(12px);\n  color:rgba(241,230,207,.66);\n  font-family:var(--dsh-font-family-code, ui-monospace, monospace); font-size:10.5px;\n  letter-spacing:.16em; text-transform:uppercase;\n  cursor:pointer; opacity:.4;\n  transition:opacity 200ms ease;\n}\n.dn-handle:hover,.dn-handle:focus-visible{opacity:1}\n.dn-handle[aria-expanded=\"true\"]{opacity:0; pointer-events:none}\n.dn-handle:focus-visible{outline:1px dotted #b08a4a; outline-offset:2px}\n.dn-handle svg{width:13px; height:13px; fill:none; stroke:currentColor; stroke-width:1.3; stroke-linecap:round}\n\n@media (max-width:720px){\n  .dn-studio{left:14px; right:14px; width:auto; top:auto; bottom:62px; max-height:52%}\n}\n@media (prefers-reduced-motion:reduce){\n  .dn-quill,.dn-quill-sway,.dn-quill-shine,.dn-quill-glint{animation:none}\n  .dn-handle,.dn-studio .toggle::after{transition:none}\n}\n\n\n/* ── 纸夹：一枚 Gem 夹夹在纸的右缘 ────────────────────────────────────\n   外圈在纸前，内舌在纸后（只留下压住纸面的一道痕），弯头探出纸外。\n   金属丝按\"上左受光\"的管状上色：暗边 + 本体 + 沿光侧的高光。 */\n/* 不挂 will-change:transform：纸夹一帧最多动几像素，不值得在这么重的界面里\n   常驻一个合成层。滚动位置由 rAF 直接写 transform，已经够顺。 */\n.dn-scroll{\n  position:fixed; left:0; top:0;\n  touch-action:none; cursor:grab;\n}\n.dn-scroll[hidden]{ display:none }\n.dn-scroll:active{ cursor:grabbing }\n.dn-scroll:focus-visible{ outline:1px dotted var(--dn-metal, #b8904c); outline-offset:3px }\n.dn-scroll-clip svg{ display:block; width:100%; height:100%; overflow:visible }\n.dn-scroll-clip path{ fill:none; stroke-linecap:round; stroke-linejoin:round }\n.dn-clip-edge{ stroke-width:3.3 }\n.dn-clip-body{ stroke-width:2.6 }\n.dn-clip-light{ stroke-width:.9; opacity:.9 }\n.dn-clip-glint{ stroke:#fff; stroke-width:.55; stroke-dasharray:1.6 11 .8 17; opacity:.85 }\n.dn-clip-shadow{ stroke:rgba(28,18,8,.42); stroke-width:3; transform:translate(1px,1.9px) }\n.dn-clip-pressed{ stroke:rgba(40,28,16,.07); stroke-width:2.2 }\n.dn-scroll[data-appearance=\"dark\"] .dn-clip-shadow{ stroke:rgba(0,0,0,.62) }\n.dn-scroll[data-appearance=\"dark\"] .dn-clip-pressed{ stroke:rgba(255,255,255,.05) }\n.dn-scroll-bar{\n  border-radius:999px;\n  background:rgba(255,255,255,.92);\n  box-shadow:0 0 0 1px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.25);\n}\n.dn-scroll[data-appearance=\"dark\"].dn-scroll-bar{ background:rgba(255,255,255,.75) }\n\n/* 容器的原生滚条让位给纸夹；滚轮、键盘、拖动都还在。 */\n[data-dn-scroll=\"custom\"]{ scrollbar-width:none; -ms-overflow-style:none }\n[data-dn-scroll=\"custom\"]::-webkit-scrollbar{ width:0; height:0 }\n";


/* ═══════════════════════════════════════════════════════════════════════════
   DSH 适配层。上面那一大段是样张里的同一份核心，由 tools/build.mjs 从
   sample/nocturne-desk.html 里抽取——不是复制粘贴，所以纸、灯、辉光在
   样张和宿主里永远是同一套代码。
   ═══════════════════════════════════════════════════════════════════════ */
const PAPER_ATTR = 'data-dn';
const STYLE_ID = 'dsh-nocturne-style';
const STORE_KEY = 'dsh-nocturne:settings';
const STORE_VERSION = 1;
/** 宿主半（lib/index.js）在这个路径上读写同一个 JSON 文档。 */
const REMOTE_PATH = '/dsh-nocturne/settings';
const SETTING_KEYS = ['paper', 'theme', 'lamp', 'enabled', 'intensity', 'spread', 'beam', 'aim',
  'reach', 'softness', 'grain', 'cursorGlow', 'paperIllumination', 'particles', 'texture',
  'cursorMode', 'coexist'];
/** 会被本插件改写、卸载时必须逐项还原的 token。 */
const TOKEN_NAMES = ['--dsw-alias-bg-base', '--dsw-alias-bg-module-platform', '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2', '--dsw-alias-label-primary', '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary', '--dn-paper', '--dn-ink', '--dn-caret-ink', '--dn-light-rgb',
  '--dn-metal-lo', '--dn-metal-hi', '--dn-metal', '--dn-sheet'];
let remoteTimer = 0;
let lastDiag = null;
/** 卡顿记录：只留最后 12 条，随设置文档一起落盘，用来在拿不到界面时定位卡死。 */
const hangs = [];
const measure = document.createElement('canvas').getContext('2d');

let teardown = null;

/**
 * 读设置。带版本号：旧版本写进去的键可能已经不认了，所以认不出的值一律回落默认，
 * 而不是让一个脏值把渲染层搞崩。迁移只往前，不回头。
 */
/** 把一份存下来的设置并进来。白名单外的一律不认，脏值也挡在门外。 */
function mergeSettings(saved) {
  if (!saved || typeof saved !== 'object') return;
  for (const key of SETTING_KEYS) {
    if (saved[key] !== undefined && saved[key] !== null) SETTINGS[key] = saved[key];
  }
  if (saved.window && typeof saved.window === 'object') Object.assign(SETTINGS.window, saved.window);
  // 嵌套对象要并进来而不是整块替换：老版本存下的文档里没有这几个键。
  if (saved.scrollbar && typeof saved.scrollbar === 'object') Object.assign(SETTINGS.scrollbar, saved.scrollbar);
}

function normalize() {
  if (!PAPERS[SETTINGS.paper]) SETTINGS.paper = 'parchment';
  if (!THEMES[SETTINGS.theme]) SETTINGS.theme = 'paper-and-ink';
  if (['ink', 'quill', 'none'].indexOf(SETTINGS.cursorMode) < 0) SETTINGS.cursorMode = 'ink';
  if (['auto', 'material', 'full'].indexOf(SETTINGS.coexist) < 0) SETTINGS.coexist = 'auto';
  const bar = SETTINGS.scrollbar;
  if (['clip', 'bar', 'native'].indexOf(bar.style) < 0) bar.style = 'clip';
  if (!CLIP_FINISHES[bar.finish]) bar.finish = 'silver';
  bar.barWidth = Math.min(14, Math.max(3, Number(bar.barWidth) || 6));
  bar.barOpacity = Math.min(1, Math.max(0.1, Number(bar.barOpacity) || 0.45));
}

function snapshot() {
  const saved = {v: STORE_VERSION};
  for (const key of SETTING_KEYS) saved[key] = SETTINGS[key];
  saved.window = SETTINGS.window;
  saved.scrollbar = SETTINGS.scrollbar;
  // 自检记录：桌面版每次启动端口都变，我拿不到界面，只能让客户端自己报一次状态。
  // 键名带下划线，mergeSettings 的白名单不会把它吃回设置。
  if (lastDiag) saved.__diag = lastDiag;
  if (hangs.length) saved.__hangs = hangs.slice();
  return saved;
}

function readSettings() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) mergeSettings(JSON.parse(raw));
  } catch (error) { /* 私密模式或旧数据：用默认值 */ }
  normalize();
}

/**
 * 桌面版每次启动端口都变，origin 跟着变，localStorage 就空了。
 * 所以真源在宿主那边（磁盘），本地只当缓存：启动先读磁盘，读不到再用缓存。
 */
function loadRemote() {
  if (typeof fetch !== 'function') return Promise.resolve(false);
  return fetch(REMOTE_PATH, {headers: {accept: 'application/json'}, credentials: 'same-origin'})
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      const saved = payload && payload.settings;
      if (!saved || typeof saved !== 'object') return false;
      mergeSettings(saved);
      normalize();
      persistLocal();
      return true;
    })
    .catch(() => false);
}

function persistLocal() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(snapshot()));
  } catch (error) { /* 配额或私密模式：不保存也不报错 */ }
}

function saveRemote() {
  if (typeof fetch !== 'function') return;
  clearTimeout(remoteTimer);
  remoteTimer = setTimeout(() => {
    try {
      fetch(REMOTE_PATH, {
        method: 'PUT',
        headers: {'content-type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify(snapshot())
      }).catch(() => { /* 宿主半没装或已被卸载：本地缓存已经写过了 */ });
    } catch (error) { /* ignore */ }
  }, 700);
}

function persist() {
  persistLocal();
  saveRemote();
}

/** 正在输入的那个光标在哪：回给灯与辉光。 */
function findCaret() {
  const active = document.activeElement;
  if (!active) return null;
  const tag = active.tagName;
  if (!(tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable)) return null;
  try {
    if (active.isContentEditable) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return null;
      const box = selection.getRangeAt(0).getClientRects()[0];
      return box ? {x: box.left, y: box.top + box.height / 2} : null;
    }
    const box = active.getBoundingClientRect();
    const style = getComputedStyle(active);
    measure.font = style.fontStyle + ' ' + style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
    const caret = active.selectionStart == null ? active.value.length : active.selectionStart;
    const textWidth = measure.measureText(String(active.value).slice(0, caret)).width;
    return {x: box.left + textWidth - (active.scrollLeft || 0), y: box.top + box.height / 2};
  } catch (error) {
    return null;
  }
}

/**
 * 纸色要同时落到宿主自己的 token 上，否则换纸只换了画布，界面还停在上一张纸上。
 * 只碰语义别名，不碰任何组件的选择器。
 */
/**
 * 探测另一套皮肤在不在场。dsh-claude-style 会定义上百个 --dsh-claude-* 变量
 * （装机版 139 个），这是它留下的、稳定且不依赖 DOM 结构的指纹。
 */
function foreignSkin() {
  try {
    const root = getComputedStyle(document.documentElement);
    if (root.getPropertyValue('--dsh-claude-caret-color').trim() !== '') return 'dsh-claude-style';
    if (root.getPropertyValue('--dsh-claude-blur-soft').trim() !== '') return 'dsh-claude-style';
    const body = getComputedStyle(document.body);
    if (body.getPropertyValue('--dsh-claude-caret-color').trim() !== '') return 'dsh-claude-style';
  } catch (error) { /* 拿不到计算样式就当作没有 */ }
  return null;
}

/** 三种口径：自动（探测到就让位）/ 只叠材质 / 接管配色。 */
function tokenMode() {
  if (SETTINGS.coexist === 'full') return 'full';
  if (SETTINGS.coexist === 'material') return 'material';
  return foreignSkin() ? 'material' : 'full';
}

/**
 * 纸色做成一张 token 表，运行时内联写入并且带 !important。
 *
 * 为什么不能靠样式表：样式表里的 !important 会压过内联的普通声明。
 * 早先那版把默认值写在 style.css 里、运行时用内联去改，结果换纸只换了画布，
 * 界面底色一直停在默认那张纸上——这条是桌面版自检抓到的（bgBase 与 dnPaper 不一致）。
 * 现在样式表只管 canvas / 光标 / 面板这些不会变的东西，配色一律运行时写。
 */
function tokenMap(p) {
  const dark = p.appearance === 'dark';
  return {
    '--dsw-alias-bg-base': p.paper,
    '--dsw-alias-bg-module-platform': p.paper,
    '--dsw-alias-bg-layer-1': dark ? '#242028' : '#eadcb9',
    '--dsw-alias-bg-layer-2': dark ? '#1a171d' : '#e6d5b0',
    '--dsw-alias-label-primary': p.ink,
    '--dsw-alias-label-secondary': p.inkMuted,
    '--dsw-alias-label-tertiary': dark ? '#8f89a6' : '#7d7264',
    '--dn-paper': p.paper,
    '--dn-ink': p.ink,
    '--dn-caret-ink': p.cursor,
    '--dn-metal-lo': '#5e431c',
    '--dn-metal-hi': '#f3dca4',
    '--dn-metal': '#b8904c',
    // 纸的底色：整窗背景挂在它上面，卸载/让位时一并还原
    '--dn-sheet': p.paper,

  };
}

function clearTokens() {
  for (const name of TOKEN_NAMES) document.documentElement.style.removeProperty(name);
}

function applyTokens() {
  // 「只叠材质」：一个宿主配色 token 都不碰，只留纸与灯——两套皮肤可以叠着用。
  if (tokenMode() === 'material') {
    clearTokens();
    const p = paper();
    const root = document.documentElement.style;
    root.setProperty('--dn-sheet', 'transparent');
    for (const name of ['--dn-paper', '--dn-ink', '--dn-caret-ink', '--dn-metal-lo', '--dn-metal-hi', '--dn-metal']) {
      root.setProperty(name, {
        '--dn-paper': p.paper,
        '--dn-ink': p.ink,
        '--dn-caret-ink': p.cursor,
        '--dn-metal-lo': '#5e431c',
        '--dn-metal-hi': '#f3dca4',
        '--dn-metal': '#b8904c'
      }[name]);
    }
    return;
  }
  const root = document.documentElement.style;
  const map = tokenMap(paper());
  for (const name of Object.keys(map)) root.setProperty(name, map[name], 'important');
}

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  (document.head || document.documentElement).appendChild(style);
}

function mount() {
  if (document.querySelector('canvas[' + PAPER_ATTR + ']')) return;
  readSettings();
  injectStyle();

  // 一片纸一层光。两片 canvas 直接挂在 body 下：包一层 z-index 容器会把
  // mix-blend-mode 关进隔离栈里，multiply 就只剩直接覆盖（实测）。
  const paperCanvas = document.createElement('canvas');
  paperCanvas.setAttribute(PAPER_ATTR, 'paper');
  paperCanvas.setAttribute('aria-hidden', 'true');
  const glowCanvas = document.createElement('canvas');
  glowCanvas.setAttribute(PAPER_ATTR, 'glow');
  glowCanvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(paperCanvas);
  document.body.appendChild(glowCanvas);

  // 墨迹光标必须在纸光之下：它插在 canvas 之前，z-index 也只差 1。
  // 上游的做法一样——光标躺在纸上，灯把墨和字一起照亮。
  const caret = new InkCaret();
  caret.mount(paperCanvas);

  // 纸夹压在纸光之上：它是一件器物，不该被灯压暗。
  const scrollClip = new ScrollClip();
  scrollClip.mount({zIndex: 2147482003});

  const paperLight = new PaperLight(paperCanvas);
  const glow = new GlowLayer(glowCanvas);

  let size = {width: 1, height: 1};
  let origin = {left: 0, top: 0};
  let caretPoint = null;
  let needsBuild = true;
  let needsLight = true;
  let lastLightAt = 0;
  let frameId = 0;
  let stopped = false;

  function measureSheet() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(window.innerWidth));
    const height = Math.max(1, Math.round(window.innerHeight));
    for (const canvas of [paperCanvas, glowCanvas]) {
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    glow.resize(width, height, dpr);
    const changed = width !== size.width || height !== size.height;
    size = {width, height};
    origin = {left: 0, top: 0};
    if (changed || needsBuild) {
      paperLight.build({width, height, pixelRatio: dpr, p: paper()});
      needsBuild = false;
      needsLight = true;
      rebuiltThisFrame = true;
    }
    scrollClip.needLayout = true;
  }

  let lastFrameAt = 0;
  let lastGlowAt = 0;
  let lastRgbWritten = '';
  let rebuiltThisFrame = false;
  let lastCaretPoint = null;
  let cursorMovedThisFrame = false;

  function frame(now) {
    if (stopped) return;
    const startedAt = performance.now();
    const time = now / 1000;
    const appearance = paper().appearance;
    // 光标位置交给墨迹光标自己量（contenteditable / input / textarea 都能跟），
    // 它量不出来就返回 null，墨块藏起来，原生光标原样接管。
    caretPoint = caret.sync() || findCaret();
    const caretSheetX = caretPoint ? caretPoint.x - origin.left : size.width / 2;
    const rig = buildRig(size, caretSheetX);
    const animateGrain = SETTINGS.grain > 0 && !reduceMotion;

    let lightFrameRan = false;
    if (needsLight || (animateGrain && now - lastLightAt > 120)) {
      paperLight.render(rig, paper(), animateGrain ? time : 0);
      needsLight = false;
      lastLightAt = now;
      lightFrameRan = true;
      if (diagPending) {
        diagPending = false;
        reportDiag();
      }
    }

    const lightChannels = toUnit(theme().light.color).map((c) => Math.round(c * 255));
    const poolChannels = poolColor(appearance);

    // 辉光层是 "screen" 混合：每重画一次，浏览器就要把整块背景重新合成一遍。
    // 长会话里 DOM 上万节点，每帧重画是秒级代价——所以只在真会变的时候画：
    // 灯变了、光标动了/出现了、或者开了尘埃（那才需要动画）。
    const caretMoved = caretPoint && lastCaretPoint &&
      (Math.abs(caretPoint.x - lastCaretPoint.x) > 0.5 || Math.abs(caretPoint.y - lastCaretPoint.y) > 0.5);
    const caretAppeared = Boolean(caretPoint) !== Boolean(lastCaretPoint);
    const dustDue = SETTINGS.particles > 0 && now - lastGlowAt > 60;
    if (lightFrameRan || caretMoved || caretAppeared || dustDue) {
      glow.render({
        rig,
        lamp: SETTINGS.lamp && SETTINGS.enabled,
        rgb: lightChannels.join(', '),
        poolRgb: poolChannels.join(', '),
        appearance,
        intensity: SETTINGS.intensity,
        particles: SETTINGS.particles,
        cursorGlow: SETTINGS.cursorGlow,
        cursor: caretPoint ? {x: caretPoint.x - origin.left, y: caretPoint.y - origin.top} : null,
        time
      });
      lastGlowAt = now;
    }
    lastCaretPoint = caretPoint ? {x: caretPoint.x, y: caretPoint.y} : null;
    cursorMovedThisFrame = false;

    // 纸夹自带脏标记：静止时只花一次比较。
    scrollClip.step(now);

    // 根元素的 custom property 一改，整篇文档的样式都要重算——只在真的变了才写。
    const rgb = lightChannels.join(' ');
    if (rgb !== lastRgbWritten) {
      document.documentElement.style.setProperty('--dn-light-rgb', rgb);
      lastRgbWritten = rgb;
    }

    // 卡顿看门狗：帧间隔超 200ms 就记一笔，连同本帧自己的耗时，用来分清
    // "卡在我们自己的回调里"还是"卡在别处"。
    const cost = performance.now() - startedAt;
    if (lastFrameAt) {
      const gap = now - lastFrameAt;
      if (gap > 200) {
        hangs.push({
          at: new Date().toISOString().slice(11, 23),
          gap: Math.round(gap),
          cost: Math.round(cost),
          nodes: document.getElementsByTagName('*').length,
          rebuilt: rebuiltThisFrame,
          editorEmpty: caretPoint ? false : true,
          canvases: document.querySelectorAll('canvas[' + PAPER_ATTR + ']').length
        });
        if (hangs.length > 12) hangs.shift();
        persist();
      }
    }
    lastFrameAt = now;
    rebuiltThisFrame = false;
    frameId = requestAnimationFrame(frame);
  }

  function reposition() {
    measureSheet();
    needsLight = true;
  }

  const observer = new ResizeObserver(reposition);
  observer.observe(document.documentElement);

  const onSelection = () => { needsLight = true; };
  // 页面看不见时停掉循环：一张一直重算的纸，在后台没人看，白烧电。
  const onVisibility = () => {
    if (document.hidden) {
      if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    } else if (!frameId && !stopped) {
      needsLight = true;
      frameId = requestAnimationFrame(frame);
    }
  };
  // 显卡被回收（切后台、驱动重置、显存吃紧）时不能白屏：重建 surface 再点灯。
  const onContextLost = (event) => { event.preventDefault(); };
  const onContextRestored = () => {
    paperLight.state = paperLight.gl ? 'ready' : 'failed';
    needsBuild = true;
    needsLight = true;
    measureSheet();
  };
  paperCanvas.addEventListener('webglcontextlost', onContextLost);
  paperCanvas.addEventListener('webglcontextrestored', onContextRestored);

  window.addEventListener('resize', reposition);
  document.addEventListener('selectionchange', onSelection);
  document.addEventListener('visibilitychange', onVisibility);

  measureSheet();
  frameId = requestAnimationFrame(frame);

  // 跑起来 2 秒后报一次自检：WebGL 起没起来、纸画出来没有、token 实际是什么。
  // 像素采样必须在 drawArrays 之后立刻做（默认不保留绘制缓冲），所以由帧循环触发。
  let diagPending = false;
  setTimeout(() => { diagPending = true; }, 2000);

  /** 从真实帧缓冲里按网格取样，算纸面的亮度分布——这是"画出来了没有"的硬证据。 */
  function samplePaper() {
    try {
      const gl = paperCanvas.getContext('webgl2');
      if (!gl || gl.isContextLost()) return null;
      const w = paperCanvas.width;
      const h = paperCanvas.height;
      const cols = 28;
      const rows = 16;
      const pixel = new Uint8Array(4);
      const values = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = Math.min(w - 1, Math.round(((col + 0.5) / cols) * w));
          const y = Math.min(h - 1, Math.round(((row + 0.5) / rows) * h));
          gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          values.push(0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]);
        }
      }
      values.sort((m, n) => m - n);
      const at = (q) => Math.round(values[Math.min(values.length - 1, Math.floor(q * values.length))]);
      return {
        mean: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
        p05: at(0.05), p50: at(0.5), p95: at(0.95), max: Math.round(values[values.length - 1])
      };
    } catch (error) {
      return null;
    }
  }

  function reportDiag() {
    let renderer = '';
    let webgl2 = false;
    try {
      const gl = paperCanvas.getContext('webgl2');
      webgl2 = Boolean(gl);
      const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
      if (gl && info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)).slice(0, 60);
    } catch (error) { /* 拿不到就留空 */ }
    const rect = paperCanvas.getBoundingClientRect();
    lastDiag = {
      at: new Date().toISOString(),
      origin: location.origin,
      dpr: window.devicePixelRatio,
      viewport: [window.innerWidth, window.innerHeight],
      canvas: [paperCanvas.width, paperCanvas.height, Math.round(rect.width), Math.round(rect.height)],
      webgl2: webgl2,
      paperState: paperLight.state,
      renderer: renderer,
      tokenMode: tokenMode(),
      foreign: foreignSkin(),
      bgBase: getComputedStyle(document.documentElement).getPropertyValue('--dsw-alias-bg-base').trim(),
      dnPaper: getComputedStyle(document.documentElement).getPropertyValue('--dn-paper').trim(),
      canvases: document.querySelectorAll('canvas[' + PAPER_ATTR + ']').length,
      caret: caret.shown ? caret.mode : 'hidden',
      scroll: {
        style: SETTINGS.scrollbar.style,
        attached: Boolean(scrollClip.target),
        host: scrollClip.target
          ? scrollClip.target.tagName.toLowerCase() + ':' + String(scrollClip.target.className || '').slice(0, 24)
          : null,
        height: scrollClip.target ? scrollClip.target.clientHeight : 0,
        travel: scrollClip.target
          ? Math.max(0, scrollClip.target.scrollHeight - scrollClip.target.clientHeight)
          : 0,
        shown: scrollClip.element ? !scrollClip.element.hidden : false
      },
      papers: Object.keys(PAPERS).length,
      themes: Object.keys(THEMES).length,
      // 与标定基准同口径：上游参考值 p50≈115 / p95≈178（1440×900、parchment、balanced 灯）
      paperPixels: samplePaper()
    };
    persist();
  }

  // 缮写室：与样张同一份 builder，所以两处的面板不会长歪。
  const studio = buildStudio({
    state: () => SETTINGS,
    foreign: foreignSkin,
    resolvedCoexist: tokenMode,
    onChange(key, value) {
      if (key === 'preset') {
        // 标定值：与样张同一份 NOCTURNE_DEFAULTS，两边不会各有一组"默认"。
        Object.assign(SETTINGS, JSON.parse(JSON.stringify(NOCTURNE_DEFAULTS)));
        caret.setMode(SETTINGS.cursorMode);
        scrollClip.apply();
        applyTokens();
        studio.sync();
        persist();
        needsBuild = true;
        reposition();
        return;
      }
      if (key === 'coexist') {
        SETTINGS.coexist = value;
        studio.sync();
        persist();
        return;
      }
      if (key === 'paper') {
        SETTINGS.paper = value;
        applyTokens();
        needsBuild = true;
        caret.hide();
        studio.sync();
        persist();
        reposition();
        return;
      }
      if (key === 'theme') {
        SETTINGS.theme = value;
        needsBuild = true;
        studio.sync();
        persist();
        reposition();
        return;
      }
      if (key === 'cursor') {
        SETTINGS.cursorMode = value;
        caret.setMode(value);
        studio.sync();
        persist();
        return;
      }
      if (key === 'lamp') {
        SETTINGS.lamp = value;
        needsLight = true;
        persist();
        return;
      }
      if (key === 'scrollStyle' || key === 'scrollFinish') {
        SETTINGS.scrollbar[key === 'scrollStyle' ? 'style' : 'finish'] = value;
        scrollClip.apply();
        studio.sync();
        persist();
        return;
      }
      if (key === 'scrollBarWidth' || key === 'scrollBarOpacity') {
        SETTINGS.scrollbar[key === 'scrollBarWidth' ? 'barWidth' : 'barOpacity'] = value;
        scrollClip.apply();
        persist();
        return;
      }
      SETTINGS[key] = value;
      if (key === 'texture') needsBuild = true;
      needsLight = true;
      persist();
    }
  });
  document.body.appendChild(studio.element);
  document.body.appendChild(studio.handle);
  caret.setMode(SETTINGS.cursorMode);
  scrollClip.apply();
  applyTokens();

  // 磁盘上的设置才是真源：取回来之后要重新落到 token、光标与面板上。
  loadRemote().then((loaded) => {
    if (!loaded || stopped) return;
    caret.setMode(SETTINGS.cursorMode);
    scrollClip.apply();
    applyTokens();
    studio.sync();
    needsBuild = true;
    reposition();
  });

  window.__dshNocturne = {
    settings: SETTINGS,
    papers: Object.keys(PAPERS),
    use(paperId, options) {
      if (PAPERS[paperId]) SETTINGS.paper = paperId;
      if (options) Object.assign(SETTINGS, options);
      persist();
      needsBuild = true;
      reposition();
      return SETTINGS.paper;
    },
    theme(themeId) {
      if (THEMES[themeId]) SETTINGS.theme = themeId;
      persist();
      needsBuild = true;
      reposition();
      return SETTINGS.theme;
    },
    lamp(on) { SETTINGS.lamp = on !== false; persist(); needsLight = true; },
    /** 关掉墨迹光标：宿主自己的光标立刻回来（caret-color 会被还原）。 */
    caret(on) { caret.enabled = on !== false; if (!caret.enabled) caret.hide(); return caret.enabled; },
    /** 滚条形态：'clip' 纸夹 / 'bar' 细杆 / 'native' 原生。 */
    scroll(style) {
      SETTINGS.scrollbar.style = ['clip', 'bar', 'native'].indexOf(style) < 0 ? 'clip' : style;
      scrollClip.apply();
      studio.sync();
      persist();
      return SETTINGS.scrollbar.style;
    },
    /** 选区与纸夹的实时状态：桌面版没有控制台，这是唯一能问的地方。 */
    state() {
      return {
        clip: scrollClip.element ? scrollClip.element.style.transform : null,
        target: scrollClip.target ? String(scrollClip.target.className).slice(0, 40) : null
      };
    },
    /** 纸上有什么在滚动：查不到滚动容器时用它诊断。 */
    where() {
      return scrollClip.target ? {
        tag: scrollClip.target.tagName,
        className: String(scrollClip.target.className).slice(0, 80),
        height: scrollClip.target.clientHeight,
        scrollable: scrollClip.target.scrollHeight - scrollClip.target.clientHeight
      } : null;
    },
    off() { if (teardown) teardown(); }
  };

  /**
   * 卸载要干净到"从未装过"：
   *   rAF 停掉、监听逐个摘掉（包括匿名的那几个，所以它们必须先有名字）、
   *   WebGL 资源显式释放、两片 canvas 与面板移除、样式表移除、
   *   编辑器上被我们改过的 caret-color 还原、全局句柄删掉。
   * 漏掉任何一件，热重载一次就多留一份。
   */
  teardown = () => {
    if (stopped) return;
    stopped = true;
    if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    observer.disconnect();
    window.removeEventListener('resize', reposition);
    document.removeEventListener('selectionchange', onSelection);
    document.removeEventListener('visibilitychange', onVisibility);
    paperCanvas.removeEventListener('webglcontextlost', onContextLost);
    paperCanvas.removeEventListener('webglcontextrestored', onContextRestored);
    caret.destroy();
    scrollClip.destroy();
    paperLight.release();
    glow.clear();
    if (studio.element.parentNode) studio.element.remove();
    if (studio.handle.parentNode) studio.handle.remove();
    if (paperCanvas.parentNode) paperCanvas.remove();
    if (glowCanvas.parentNode) glowCanvas.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    // token 还原：撤掉内联覆盖，宿主的主题立刻回来。
    clearTimeout(remoteTimer);
    for (const name of TOKEN_NAMES) document.documentElement.style.removeProperty(name);
    delete window.__dshNocturne;
  };
}

function unmount() {
  if (teardown) { const run = teardown; teardown = null; run(); }
}

exports.name = 'dsh-nocturne';
exports.inject = [];
/**
 * 宿主调用一次就能挂上；返回值是 cordis 认的卸载函数。
 * 重复调用是无害的：mount() 先看 canvas 是否已经在场。
 */
exports.apply = () => {
  mount();
  return unmount;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('canvas[' + PAPER_ATTR + ']')) mount();
  }, {once: true});
} else if (!document.querySelector('canvas[' + PAPER_ATTR + ']')) {
  mount();
}

    return module.exports;
  }
});
