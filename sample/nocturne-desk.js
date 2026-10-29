import {SETTINGS, NOCTURNE_DEFAULTS, PAPERS, THEMES, theme, paper, washColor, surfaceColor, clamp, smoothstep, toUnit, norm, dot3, spreadToCosine, reduceMotion, barHalfWidth, between, windowGobo, irradiance, toneMap, lightAmount, referenceExposure, buildRig, ambientLevel, VERTEX, SURFACE, LIGHT, PaperLight, GlowLayer, poolColor, InkCaret, buildQuill, buildStudio, ScrollClip, CLIP_FINISHES, stepSpring} from '../packages/dsh-nocturne/src/core/index.js';

/* ═══════════════════════════════════════════════════════════════════════════
   6 · 装配与主循环
   ═══════════════════════════════════════════════════════════════════════ */
const sheetEl = document.getElementById('sheet');
const paperCanvas = document.getElementById('paper');
const glowCanvas = document.getElementById('glow');
const inputEl = document.getElementById('input');
const rootStyle = document.documentElement.style;

/* 深链：?paper=cotton&lamp=0&theme=moonlit-poetry —— 样张要能被逐个参数抓起截图 */
try {
  const params = new URLSearchParams(location.search);
  const wantedPaper = params.get('paper');
  if (wantedPaper && PAPERS[wantedPaper]) SETTINGS.paper = wantedPaper;
  const wantedTheme = params.get('theme');
  if (wantedTheme && THEMES[wantedTheme]) SETTINGS.theme = wantedTheme;
  if (params.get('lamp') === '0') SETTINGS.lamp = false;
  if (params.get('intensity')) SETTINGS.intensity = Number(params.get('intensity'));
  if (params.get('grain')) SETTINGS.grain = Number(params.get('grain'));
  const wantedCursor = params.get('cursor');
  if (wantedCursor === 'ink' || wantedCursor === 'quill' || wantedCursor === 'none') SETTINGS.cursorMode = wantedCursor;
  if (params.get('studio') === '1') {
    // 截图用：直接把缮写室打开
    window.__openStudio = true;
  }
  if (params.get('caret')) {
    // 截图用：填一段字并把光标放到末尾，好让墨迹光标有东西可反白
    inputEl.value = params.get('caret');
    inputEl.focus();
    const at = Math.min(inputEl.value.length, Number(params.get('caretAt') || inputEl.value.length));
    inputEl.setSelectionRange(at, at);
  }
} catch (error) { /* 老浏览器：走默认 */ }

const paperLight = new PaperLight(paperCanvas);
const glow = new GlowLayer(glowCanvas);
const measure = document.createElement('canvas').getContext('2d');

let sheetSize = {width: 1, height: 1};
let sheetOrigin = {left: 0, top: 0};
let needsBuild = true;
let needsLight = true;
let lastLightAt = 0;

/** 墨迹光标。它躺在纸光之下，所以灯把它和字一起照亮——这正是上游的语义。 */
const inkCaret = new InkCaret();
inkCaret.mount(paperCanvas);
inkCaret.mode = SETTINGS.cursorMode;


/** 纸夹：夹在正文栏的右缘。样张里正文栏自己滚，所以挂上就有东西可夹。 */
const scrollClip = new ScrollClip();
scrollClip.mount({zIndex: 6, preferred: '.scroll'});


/** 选区底色跟着纸与房间走。 */
function setWash() {
  rootStyle.setProperty('--dn-selection', washColor());
}
setWash();

function relayout() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = sheetEl.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const changed = width !== sheetSize.width || height !== sheetSize.height;
  sheetSize = {width, height};
  paperCanvas.style.width = width + 'px';
  paperCanvas.style.height = height + 'px';
  glowCanvas.style.width = width + 'px';
  glowCanvas.style.height = height + 'px';
  glow.resize(width, height, dpr);
  if (changed || needsBuild) {
    paperLight.build({width, height, pixelRatio: dpr, p: paper()});
    needsBuild = false;
    needsLight = true;
  }
  sheetOrigin = {left: rect.left, top: rect.top};
  scrollClip.needLayout = true;
  syncRoomLight(inkCaret.point);
}

/** 房间里的光位跟着灯走——灯跟着墨迹光标走。 */
function syncRoomLight(point) {
  const pageX = point ? point.x : sheetOrigin.left + sheetSize.width / 2;
  rootStyle.setProperty('--light-x', Math.round(clamp(pageX / window.innerWidth, .1, .9) * 100) + '%');
}

function frame(now) {
  // 渲染循环是这条皮肤的命：任何异常都不许把它掐断，否则纸会停在最后一帧。
  try {
    paintFrame(now);
  } catch (error) {
    if (!frame.__warned) { frame.__warned = true; console.warn('nocturne frame skipped:', error); }
  }
  requestAnimationFrame(frame);
}

function paintFrame(now) {
  const time = now / 1000;
  const appearance = paper().appearance;
  const point = inkCaret.sync();
  if (point) syncRoomLight(point);
  const caretSheetX = point ? point.x - sheetOrigin.left : sheetSize.width / 2;
  const rig = buildRig(sheetSize, caretSheetX);
  const lightOn = SETTINGS.lamp && SETTINGS.enabled;
  const animateGrain = SETTINGS.grain > 0 && !reduceMotion;

  if (needsLight || (animateGrain && now - lastLightAt > 90)) {
    paperLight.render(rig, paper(), animateGrain ? time : 0);
    needsLight = false;
    lastLightAt = now;
  }

  const lightChannels = toUnit(theme().light.color).map((c) => Math.round(c * 255));
  const poolChannels = poolColor(appearance);

  glow.render({
    rig,
    lamp: lightOn,
    rgb: lightChannels.join(', '),
    poolRgb: poolChannels.join(', '),
    appearance,
    intensity: SETTINGS.intensity,
    particles: SETTINGS.particles,
    cursorGlow: SETTINGS.cursorGlow,
    cursor: point
      ? {x: point.x - sheetOrigin.left + 4, y: point.y - sheetOrigin.top + point.height / 2}
      : null,
    time: reduceMotion ? 0 : time
  });

  rootStyle.setProperty('--light-rgb', lightChannels.join(' '));

  // 纸夹是压在纸上的器物，最后画。
  scrollClip.step(now);
}

/** 换纸：纸色、墨色、描边、强调色一起换。 */
function applyPaper(id) {
  SETTINGS.paper = id;
  const p = paper();
  rootStyle.setProperty('--paper', p.paper);
  rootStyle.setProperty('--ink', p.ink);
  rootStyle.setProperty('--ink-muted', p.inkMuted);
  rootStyle.setProperty('--ink-faint', p.inkMuted);
  rootStyle.setProperty('--cursor', p.cursor);
  rootStyle.setProperty('--selection', p.selection);
  setWash();
  const dark = p.appearance === 'dark';
  rootStyle.setProperty('--border', dark ? 'rgba(230,225,234,.16)' : 'rgba(42,32,25,.16)');
  rootStyle.setProperty('--border-strong', dark ? 'rgba(230,225,234,.30)' : 'rgba(42,32,25,.30)');
  rootStyle.setProperty('--gilt', dark ? '#c9a45c' : '#b08a4a');
  rootStyle.setProperty('--gilt-text', dark ? '#e3c48a' : '#6f5420');
  rootStyle.setProperty('--gilt-soft', dark ? '#efdfb2' : '#d9c08a');
  rootStyle.setProperty('--accent', dark ? '#8ea8e0' : '#2f5277');
  rootStyle.setProperty('--prose-ink', dark ? '#ded8e6' : '#241b14');
  rootStyle.setProperty('--prose-strong', dark ? '#f2eef8' : '#1d1610');
  rootStyle.setProperty('--ink-muted', dark ? '#9a94a6' : '#6b5f52');
  document.body.style.color = p.ink;
  sheetEl.style.boxShadow = dark
    ? '0 0 0 1px rgba(0,0,0,.5), 0 34px 70px -24px rgba(0,0,0,.9)'
    : '0 0 0 1px rgba(0,0,0,.18), 0 34px 70px -24px rgba(0,0,0,.75)';
  if (studio) studio.sync();
  updateLeaf();
  needsBuild = true;
  relayout();
}

/**
 * 换房间：主题管「桌面与灯」（房间色、装饰金、渐晕、光色），纸管「纸与墨」。
 * 上游的纸与主题是正交的——子夜书斋可以配棉浆，月下诗稿可以配帘纹。
 */
function applyTheme(id) {
  if (!THEMES[id]) return;
  SETTINGS.theme = id;
  const t = theme();
  rootStyle.setProperty('--room', t.palette.room);
  rootStyle.setProperty('--room-edge', t.palette.roomEdge);
  rootStyle.setProperty('--gilt', t.appearance === 'dark' ? '#c9a45c' : t.palette.accent);
  rootStyle.setProperty('--gilt-soft', t.palette.accentSoft);
  rootStyle.setProperty('--gilt-text', t.appearance === 'dark' ? '#e3c48a' : '#6f5420');
  rootStyle.setProperty('--vignette', String(t.atmosphere.vignette));
  setWash();
  rootStyle.setProperty('--light-rgb', toUnit(t.light.color).map((c) => Math.round(c * 255)).join(' '));
  if (studio) studio.sync();
  updateLeaf();
  needsLight = true;
}

/** 页眉那一行：房间名 + 纸名。它也在纸的受光里，所以必须跟着换。 */
function updateLeaf() {
  const leaf = document.getElementById('sheet-where');
  if (!leaf) return;
  const names = {
    'paper-and-ink': 'Paper & Ink',
    'midnight-study': 'Midnight Study',
    'moonlit-poetry': 'Moonlit Poetry'
  };
  leaf.textContent = (names[SETTINGS.theme] || SETTINGS.theme) + ' · ' + paper().name;
}

/**
 * 缮写室。每一项都直通渲染参数：纸与房间走 apply*，灯与颗粒只重画光，
 * 纸纹深度要重建 surface pass（那是唯一有代价的一项）。
 */
let studio = null;
studio = buildStudio({
  state: () => SETTINGS,
  onChange(key, value) {
    if (key === 'preset') {
      Object.assign(SETTINGS, JSON.parse(JSON.stringify(NOCTURNE_DEFAULTS)));
      scrollClip.apply();
      applyTheme(SETTINGS.theme);
      applyPaper(SETTINGS.paper);
      inkCaret.setMode(SETTINGS.cursorMode);
      lampButton.setAttribute('aria-pressed', String(SETTINGS.lamp));
      needsBuild = true;
      needsLight = true;
      studio.sync();
      return;
    }
    if (key === 'paper') { applyPaper(value); return; }
    if (key === 'theme') { applyTheme(value); return; }
    if (key === 'cursor') {
      SETTINGS.cursorMode = value;
      inkCaret.setMode(value);
      studio.sync();
      return;
    }
    if (key === 'lamp') {
      SETTINGS.lamp = value;
      lampButton.setAttribute('aria-pressed', String(value));
      needsLight = true;
      return;
    }
    if (key === 'scrollStyle' || key === 'scrollFinish') {
      SETTINGS.scrollbar[key === 'scrollStyle' ? 'style' : 'finish'] = value;
      scrollClip.apply();
      studio.sync();
      return;
    }
    if (key === 'scrollBarWidth' || key === 'scrollBarOpacity') {
      SETTINGS.scrollbar[key === 'scrollBarWidth' ? 'barWidth' : 'barOpacity'] = value;
      scrollClip.apply();
      return;
    }
    SETTINGS[key] = value;
    if (key === 'texture') needsBuild = true;
    needsLight = true;
  }
});
document.body.appendChild(studio.element);
document.body.appendChild(studio.handle);
if (window.__openStudio) {
  studio.element.dataset.open = 'true';
  studio.handle.setAttribute('aria-expanded', 'true');
}

const lampButton = document.getElementById('lamp-toggle');
lampButton.addEventListener('click', () => {
  SETTINGS.lamp = !SETTINGS.lamp;
  lampButton.setAttribute('aria-pressed', String(SETTINGS.lamp));
  needsLight = true;
});

/* 敲字、点击、滚动都会移动灯——灯跟着墨走，所以要重新打光。 */
for (const type of ['input', 'keyup', 'click', 'select', 'focus']) {
  inputEl.addEventListener(type, () => { needsLight = true; });
}

new ResizeObserver(relayout).observe(sheetEl);
window.addEventListener('resize', relayout);

lampButton.setAttribute('aria-pressed', String(SETTINGS.lamp));
applyTheme(SETTINGS.theme);
applyPaper(SETTINGS.paper);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
requestAnimationFrame(frame);
