
/* DSH 适配层：共享渲染核心、官方设置槽、持久化、共存与生命周期。 */
import {
  SETTINGS, NOCTURNE_DEFAULTS, PAPERS, THEMES, CLIP_FINISHES,
  paper, paperFor, setPaperAppearance, theme, washColor, surfaceColor, toUnit, buildRig, reduceMotion,
  poolColor, PaperLight, GlowLayer, InkCaret, ScrollClip
} from './core/index.js';
import {createNocturneSettings} from './settings-page.js';
import {SETTING_KEYS, isRecord} from './settings-contract.js';

const PAPER_ATTR = 'data-dn';
const STYLE_ID = 'dsh-nocturne-style';
const STORE_KEY = 'dsh-nocturne:settings';
const STORE_VERSION = 1;
/** 宿主半（lib/index.js）在这个路径上读写同一个 JSON 文档。 */
const REMOTE_PATH = '/dsh-nocturne/settings';
/** 会被本插件改写、卸载时必须逐项还原的 token。 */
const TOKEN_NAMES = ['--dsw-alias-bg-base', '--dsw-alias-bg-module-platform', '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2', '--dsw-alias-label-primary', '--dsw-alias-label-secondary',
  '--dsw-alias-label-tertiary', '--dn-paper', '--dn-ink', '--dn-caret-ink', '--dn-light-rgb',
  '--dn-metal-lo', '--dn-metal-hi', '--dn-metal', '--dn-sheet', '--dn-selection',
  '--dsh-font-family-text', '--dsh-font-family-code'];
/** 宿主/别家皮肤在 body 上定义的组件表面：气泡、输入框、菜单、选择器、侧栏。 */
const SURFACE_NAMES = ['--dsw-specific-bubble', '--dsw-specific-input-major', '--dsw-specific-menu',
  '--dsw-specific-selector', '--dsw-specific-sidebar-fill'];
/** 每一层要往墨色里压多少：气泡最实，侧栏最淡。 */
const SURFACE_MIX = {
  '--dsw-specific-bubble': 0.07,
  '--dsw-specific-input-major': 0.05,
  '--dsw-specific-menu': 0.04,
  '--dsw-specific-selector': 0.06,
  '--dsw-specific-sidebar-fill': 0.03
};

let remoteTimer = 0;
let lastDiag = null;
/** 卡顿记录：只留最后 12 条，随设置文档一起落盘，用来在拿不到界面时定位卡死。 */
const hangs = [];
/** 帧里的第一个异常。桌面版没有控制台，所以它必须跟着设置落盘。 */
let selfCheckError = '';
const measure = document.createElement('canvas').getContext('2d');

let teardown = null;
let settingsPageComponent = null;

/**
 * 读设置。带版本号：旧版本写进去的键可能已经不认了，所以认不出的值一律回落默认，
 * 而不是让一个脏值把渲染层搞崩。迁移只往前，不回头。
 */
/** 把一份存下来的设置并进来。白名单外的一律不认，脏值也挡在门外。 */
function mergeSettings(saved) {
  if (!isRecord(saved)) return;
  for (const key of SETTING_KEYS) {
    if (saved[key] !== undefined && saved[key] !== null) SETTINGS[key] = saved[key];
  }
  if (isRecord(saved.window)) Object.assign(SETTINGS.window, saved.window);
  // 嵌套对象要并进来而不是整块替换：老版本存下的文档里没有这几个键。
  if (isRecord(saved.scrollbar)) Object.assign(SETTINGS.scrollbar, saved.scrollbar);
}

function boundedNumber(value, fallback, min, max, integer = false) {
  const number = typeof value === 'number' ? value : NaN;
  const safe = Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  return integer ? Math.round(safe) : safe;
}
function normalize() {
  const defaults = NOCTURNE_DEFAULTS;
  if (!PAPERS[SETTINGS.paper]) SETTINGS.paper = defaults.paper;
  if (!THEMES[SETTINGS.theme]) SETTINGS.theme = defaults.theme;
  if (['ink', 'quill', 'none'].indexOf(SETTINGS.cursorMode) < 0) SETTINGS.cursorMode = defaults.cursorMode;
  if (['auto', 'material', 'full'].indexOf(SETTINGS.coexist) < 0) SETTINGS.coexist = defaults.coexist;
  if (['pointed', 'soft'].indexOf(SETTINGS.beam) < 0) SETTINGS.beam = defaults.beam;
  for (const key of ['lamp', 'enabled', 'diagnostics', 'ambientMotion']) {
    if (typeof SETTINGS[key] !== 'boolean') SETTINGS[key] = defaults[key];
  }
  const limits = {
    intensity: [0, 2], spread: [20, 160], aim: [-1, 1], reach: [0.1, 3],
    softness: [0, 1], bloom: [0, 1], grain: [0, 1], cursorGlow: [0, 1],
    paperIllumination: [0, 1], particles: [0, 1], texture: [0, 1.6]
  };
  for (const [key, range] of Object.entries(limits)) {
    SETTINGS[key] = boundedNumber(SETTINGS[key], defaults[key], range[0], range[1]);
  }
  if (!isRecord(SETTINGS.scrollbar)) SETTINGS.scrollbar = {...defaults.scrollbar};
  const bar = SETTINGS.scrollbar;
  if (['clip', 'bar', 'native'].indexOf(bar.style) < 0) bar.style = defaults.scrollbar.style;
  if (!CLIP_FINISHES[bar.finish]) bar.finish = defaults.scrollbar.finish;
  bar.barWidth = boundedNumber(bar.barWidth, defaults.scrollbar.barWidth, 3, 14);
  bar.barOpacity = boundedNumber(bar.barOpacity, defaults.scrollbar.barOpacity, 0.1, 1);
  if (!isRecord(SETTINGS.window)) SETTINGS.window = {...defaults.window};
  const win = SETTINGS.window;
  const windowDefaults = defaults.window;
  win.x = boundedNumber(win.x, windowDefaults.x, 0, 1);
  win.y = boundedNumber(win.y, windowDefaults.y, 0, 1);
  win.columns = boundedNumber(win.columns, windowDefaults.columns, 1, 6, true);
  win.rows = boundedNumber(win.rows, windowDefaults.rows, 1, 8, true);
  win.softness = boundedNumber(win.softness, windowDefaults.softness, 0, 1);
  win.slant = boundedNumber(win.slant, windowDefaults.slant, -1, 1);
}

function snapshot() {
  const saved = {v: STORE_VERSION};
  for (const key of SETTING_KEYS) saved[key] = SETTINGS[key];
  saved.window = {...SETTINGS.window};
  saved.scrollbar = {...SETTINGS.scrollbar};
  // 自检记录：桌面版每次启动端口都变，我拿不到界面，只能让客户端自己报一次状态。
  // 键名带下划线，mergeSettings 的白名单不会把它吃回设置。
  if (lastDiag) saved.__diag = lastDiag;
  if (hangs.length) saved.__hangs = hangs.slice();
  if (selfCheckError) saved.__error = selfCheckError;
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

/** 自动模式按宿主明暗完整适配；只有显式选择“只叠材质”才让出宿主配色。 */
function tokenMode() {
  if (SETTINGS.coexist === 'material') return 'material';
  return 'full';
}

/** DSH 的明暗模式；优先读主题属性，再读 color-scheme，最后跟随系统。 */
function detectHostAppearance() {
  try {
    for (const node of [document.documentElement, document.body]) {
      if (!node) continue;
      for (const name of ['data-ds-dark-theme', 'data-dark-theme']) {
        if (!node.hasAttribute(name)) continue;
        const value = node.getAttribute(name);
        if (value !== 'false' && value !== 'light') return 'dark';
      }
      const theme = node.getAttribute('data-theme') || node.getAttribute('data-appearance');
      if (theme && /dark/i.test(theme)) return 'dark';
      if (theme && /light/i.test(theme)) return 'light';
      if (node.classList && (node.classList.contains('dark') || node.classList.contains('theme-dark'))) return 'dark';
    }
    const rootScheme = getComputedStyle(document.documentElement).colorScheme || '';
    const bodyScheme = document.body ? getComputedStyle(document.body).colorScheme || '' : '';
    const scheme = bodyScheme || rootScheme;
    if (/dark/i.test(scheme) && !/light/i.test(scheme)) return 'dark';
    if (/light/i.test(scheme) && !/dark/i.test(scheme)) return 'light';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch (error) { /* 读不到宿主主题时按浅色处理 */ }
  return 'light';
}

/**
 * 白面探针：发送消息那一刻如果冒出一个近白的表面（气泡、卡片），把它记下来。
 * 记的是"它是谁、谁上的色、有没有被提成合成层"，随设置一起落盘——
 * 桌面版拿不到控制台，只能让客户端自己取证。
 */
function watchWhite() {
  const hits = [];
  let total = 0;
  let budget = 0;
  let windowStart = 0;
  /** 回车之后的一小段是"闪白"的现场：这段时间里凡是有底色的新元素都记。 */
  let armedUntil = 0;
  const arm = () => { armedUntil = performance.now() + 2500; };
  const near = (value) => {
    const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(value);
    if (!match) return false;
    if (match[4] !== undefined && Number(match[4]) < 0.6) return false;
    return Number(match[1]) > 228 && Number(match[2]) > 226 && Number(match[3]) > 224;
  };
  const label = (node) => {
    if (!node || node.nodeType !== 1) return '';
    const cls = String(node.className || '').split(' ').filter(Boolean).slice(0, 2).join('.');
    return node.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  const record = (node) => {
    if (!SETTINGS.diagnostics) return;
    // 整场最多记 40 次，只留最近 12 条：流式输出时新节点很多，不能无限记账。
    if (node.nodeType !== 1 || total >= 40) return;
    const style = getComputedStyle(node);
    // 平时只记近白（可疑的卡片）；发送窗口里凡是有底色的都记——
    // 因为气泡的底色未必是白的，光靠"找白色"会漏掉它。
    const inWindow = performance.now() < armedUntil;
    if (!near(style.backgroundColor)) {
      if (!inWindow) return;
      const alpha = /rgba?\([^)]*,\s*([\d.]+)\)$/.exec(style.backgroundColor);
      if (style.backgroundColor === 'rgba(0, 0, 0, 0)') return;
      if (alpha && Number(alpha[1]) < 0.5) return;
    }
    // 不按尺寸筛：入场动画第一帧常常是 scale(0)，那一帧的盒子就是 0×0，
    // 而"闪白"恰恰发生在那一帧——按尺寸筛会把最该抓的那一次筛掉。
    const box = node.getBoundingClientRect();
    hits.push({
      at: new Date().toISOString().slice(11, 23),
      el: label(node),
      parent: label(node.parentElement),
      grand: label(node.parentElement && node.parentElement.parentElement),
      bg: style.backgroundColor,
      radius: style.borderRadius,
      z: style.zIndex,
      transform: style.transform.slice(0, 20),
      willChange: style.willChange,
      anim: style.animationName.slice(0, 24),
      box: [Math.round(box.width), Math.round(box.height)]
    });
    total += 1;
    if (hits.length >= 12) hits.shift();
    if (lastDiag) lastDiag.white = hits.slice();
    persist();
  };
  const scan = (node) => {
    if (!node || node.nodeType !== 1) return;
    const now = performance.now();
    if (now - windowStart > 1000) { windowStart = now; budget = 0; }
    record(node);
    for (const child of node.children) {
      if (++budget > 60) return;
      record(child);
    }
  };
  const observer = new MutationObserver((records) => {
    if (!SETTINGS.diagnostics) return;
    for (const mutation of records) {
      for (const node of mutation.addedNodes) scan(node);
    }
  });
  if (document.body) observer.observe(document.body, {childList: true, subtree: true});
  return {observer: observer, hits: hits, arm: arm};
}

/** 把一个颜色字符串拆成 0–1 的通道与 alpha；认 #hex、rgb()、color(srgb …)。 */
function parseColor(value) {
  const text = String(value || '').trim();
  let match = /^#([0-9a-f]{6})$/i.exec(text);
  if (match) {
    return [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255).concat(1);
  }
  match = /^rgba?\(([^)]+)\)$/.exec(text);
  if (match) {
    const parts = match[1].split(/[,/]/).map((v) => v.trim()).filter(Boolean);
    if (parts.length >= 3) {
      return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255,
        parts[3] === undefined ? 1 : Number(parts[3])];
    }
  }
  match = /^color\(srgb\s+([^)]+)\)$/.exec(text);
  if (match) {
    const parts = match[1].split(/[\s/]+/).filter(Boolean);
    if (parts.length >= 3) {
      return [Number(parts[0]), Number(parts[1]), Number(parts[2]),
        parts[3] === undefined ? 1 : Number(parts[3])];
    }
  }
  return null;
}

/** 实心且近白：这类表面在 multiply 之下会比纸亮一档，正是"闪白"的来源。 */
function isBrightSurface(value) {
  const rgba = parseColor(value);
  if (!rgba) return false;
  if (rgba[3] < 0.85) return false;
  return Math.min(rgba[0], rgba[1], rgba[2]) > 0.88;
}

/**
 * 层级审计：谁被画在纸层之上？
 *
 * "闪白"的机理只可能是那一个——白 × 纸 = 纸，所以纸层下面的任何白色都不可能显白。
 * 于是不必猜元素，直接扫所有带 z-index 的定位元素，凡层级高于纸层的都记下来。
 * 一次全表扫描约几十毫秒，只在发送那一刻跑一次，不进帧循环。
 */
function auditStacking() {
  const floor = 2147482000;
  const found = [];
  const label = (el) => {
    const cls = String(el.className || '').split(' ').filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  let scanned = 0;
  for (const el of document.querySelectorAll('body *')) {
    if (scanned > 12000 || found.length >= 10) break;
    scanned += 1;
    const style = getComputedStyle(el);
    if (style.position === 'static') continue;
    const z = Number(style.zIndex);
    if (!isFinite(z) || z <= floor) continue;
    if (el.hasAttribute && el.hasAttribute(PAPER_ATTR)) continue;
    found.push({
      el: label(el),
      z: z,
      position: style.position,
      bg: style.backgroundColor,
      opacity: style.opacity,
      pointer: style.pointerEvents,
      blend: style.mixBlendMode,
      anim: style.animationName.slice(0, 20),
      box: [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)]
    });
  }
  // 第二遍：实心近白的表面（按面积从大到小）。气泡就在这一类里。
  const bright = [];
  for (const el of document.querySelectorAll('body *')) {
    if (bright.length >= 8) break;
    if (el.hasAttribute && el.hasAttribute(PAPER_ATTR)) continue;
    const box = el.getBoundingClientRect();
    if (box.width * box.height < 400) continue;
    const style = getComputedStyle(el);
    if (!isBrightSurface(style.backgroundColor)) continue;
    bright.push({
      el: label(el),
      bg: style.backgroundColor,
      z: style.zIndex,
      radius: style.borderRadius,
      parent: el.parentElement ? label(el.parentElement) : '',
      box: [Math.round(box.width), Math.round(box.height)],
      area: Math.round(box.width * box.height)
    });
  }
  bright.sort((a, b) => b.area - a.area);
  return {scanned: scanned, above: found, bright: bright};
}

/** 宿主那套 token 里仍然是近白的——这些是能直接改的东西。 */
function auditTokens() {
  const names = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (error) { continue; }
    if (!rules) continue;
    for (const rule of rules) {
      const text = rule.cssText;
      if (!text || text.indexOf('--dsw') < 0) continue;
      const found = text.match(/--dsw-[a-z0-9-]+/g);
      if (found) for (const name of found) names.add(name);
      if (names.size > 300) break;
    }
    if (names.size > 300) break;
  }
  const body = getComputedStyle(document.body);
  const bright = [];
  for (const name of names) {
    const value = body.getPropertyValue(name).trim();
    if (!value || !isBrightSurface(value)) continue;
    bright.push(name + '=' + value.slice(0, 40));
    if (bright.length >= 30) break;
  }
  return {total: names.size, bright: bright};
}

/**
 * 纸色做成一张 token 表，运行时内联写入并且带 !important。
 *
 * 为什么不能靠样式表：样式表里的 !important 会压过内联的普通声明。
 * 早先那版把默认值写在 style.css 里、运行时用内联去改，结果换纸只换了画布，
 * 界面底色一直停在默认那张纸上——这条是桌面版自检抓到的（bgBase 与 dnPaper 不一致）。
 * 现在样式表只管 canvas / 光标 / 面板这些不会变的东西，配色一律运行时写。
 */
function mixHex(from, to, amount) {
  const a = toUnit(from);
  const b = toUnit(to);
  const channels = [0, 1, 2].map((i) => Math.round((a[i] * (1 - amount) + b[i] * amount) * 255));
  return '#' + channels.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
function rgbaHex(hex, alpha) {
  const channels = toUnit(hex).map((v) => Math.round(v * 255));
  return 'rgba(' + channels.join(', ') + ', ' + alpha + ')';
}
function tokenMap(p) {
  const dark = p.appearance === 'dark';
  const layers = {
    one: dark ? mixHex(p.paper, '#ffffff', .045) : mixHex(p.paper, '#000000', .035),
    two: dark ? mixHex(p.paper, '#000000', .035) : mixHex(p.paper, '#000000', .07),
    three: dark ? mixHex(p.paper, '#ffffff', .075) : mixHex(p.paper, '#ffffff', .025),
    four: dark ? mixHex(p.paper, '#ffffff', .105) : mixHex(p.paper, '#ffffff', .05)
  };
  const state = dark ? {
    brand:'#c9a45c', brandHover:'#d9b878', error:'#d88a9a', success:'#9cc3a4',
    warn:'#e2cf9a', business:'#8ea8e0', idle:'#8f89a6'
  } : {
    brand:'#8a6529', brandHover:'#a27b3b', error:'#9c3a2a', success:'#4c6b2f',
    warn:'#8a6a1c', business:'#2f5277', idle:'#7d7264'
  };
  const ink = p.ink;
  const primaryForeground = p.paper;
  const overlayText = dark ? p.ink : '#f7efdd';
  return {
    '--dsw-alias-bg-base': p.paper,
    '--dsw-alias-bg-module-platform': layers.one,
    '--dsw-alias-bg-layer-1': layers.one,
    '--dsw-alias-bg-layer-2': layers.two,
    '--dsw-alias-bg-layer-3': layers.three,
    '--dsw-alias-bg-layer-4': layers.four,
    '--dsw-alias-bg-overlay': layers.three,
    '--dsw-alias-bg-mask-1': dark ? 'rgba(0, 0, 0, .58)' : 'rgba(32, 24, 16, .28)',
    '--dsw-alias-bg-document-selection': p.selection,
    '--dsw-alias-label-primary': ink,
    '--dsw-alias-label-secondary': p.inkMuted,
    '--dsw-alias-label-tertiary': p.inkFaint,
    '--dsw-alias-label-dimmed': p.inkFaint,
    '--dsw-alias-label-caption': p.inkFaint,
    '--dsw-alias-label-shimmer': rgbaHex(ink, .18),
    '--dsw-alias-label-error': state.error,
    '--dsw-alias-label-primary-foreground': primaryForeground,
    '--dsw-alias-link': state.business,
    '--dsw-alias-menu-icon': p.inkMuted,
    '--dsw-alias-border-l1': rgbaHex(ink, dark ? .10 : .12),
    '--dsw-alias-border-l2': rgbaHex(ink, dark ? .18 : .18),
    '--dsw-alias-border-l3': rgbaHex(ink, dark ? .28 : .26),
    '--dsw-alias-border-l4': rgbaHex(ink, dark ? .38 : .34),
    '--dsw-alias-border-l2-darkmode-thin': rgbaHex(ink, dark ? .12 : .16),
    '--dsw-alias-brand-primary': state.brand,
    '--dsw-alias-button-primary-fill': state.brand,
    '--dsw-alias-button-primary-hover': state.brandHover,
    '--dsw-alias-button-ghost-active-fill': rgbaHex(state.brand, .16),
    '--dsw-alias-button-ghost-active-border': rgbaHex(state.brand, .46),
    '--dsw-alias-button-tool-bar-fill': layers.two,
    '--dsw-alias-interactive-bg-hover': rgbaHex(ink, .06),
    '--dsw-alias-interactive-bg-active': rgbaHex(ink, .11),
    '--dsw-alias-interactive-bg-hover-danger': rgbaHex(state.error, .12),
    '--dsw-alias-state-success-primary': state.success,
    '--dsw-alias-state-success-tertiary': rgbaHex(state.success, .16),
    '--dsw-alias-state-warn-primary': state.warn,
    '--dsw-alias-state-warn-tertiary': rgbaHex(state.warn, .16),
    '--dsw-alias-state-warn-label': state.warn,
    '--dsw-alias-state-error-primary': state.error,
    '--dsw-alias-state-business-primary': state.business,
    '--dsw-alias-state-idle-primary': state.idle,
    '--dsw-alias-markdown-code-block': layers.two,
    '--dsw-alias-markdown-code-block-banner': layers.one,
    '--dsw-alias-markdown-inline-code': layers.two,
    '--dsw-alias-markdown-tag': rgbaHex(state.brand, .16),
    '--dsw-alias-code-diff-added': rgbaHex(state.success, .15),
    '--dsw-alias-code-diff-deleted': rgbaHex(state.error, .14),
    '--dsw-alias-scrollbar-bg-l2': rgbaHex(ink, dark ? .16 : .18),
    '--dsw-alias-scrollbar-hover-l2': rgbaHex(ink, dark ? .30 : .30),
    '--dsw-alias-switch-thumb': dark ? mixHex(p.paper, '#ffffff', .78) : p.paper,
    '--dsw-alias-tooltip-bg': dark ? layers.four : '#2b231c',
    '--dsw-alias-tooltip-key-bg': dark ? layers.three : '#3a2f27',
    '--dsw-alias-toast-bg': dark ? layers.four : '#2b231c',
    '--dsw-alias-toast-label': overlayText,
    '--dsw-alias-menu-group-header-fill': rgbaHex(p.paper, .94),
    '--dn-paper': p.paper,
    '--dn-ink': p.ink,
    '--dn-caret-ink': p.cursor,
    '--dn-metal-lo': '#5e431c',
    '--dn-metal-hi': '#f3dca4',
    '--dn-metal': '#b8904c',
    '--dn-sheet': p.paper,
    '--dn-selection': washColor(),
    '--dsh-font-family-text': '"EB Garamond", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Source Han Serif SC", "Songti SC", "Noto Serif CJK SC", serif',
    '--dsh-font-family-code': '"Courier Prime", "IBM Plex Mono", "Courier New", "DejaVu Sans Mono", ui-monospace, monospace'
  };
}

/**
 * 表面色单独写一份，而且写在 body 上：
 * claude-style 把这些 token 定义在 body[data-dsh-claude-style] 上，
 * 只写根元素的话会被它自己的声明盖住（继承输给本地声明）。
 * 气泡不该是浮在纸上的白卡片——它就是纸上压出来的一层。
 */
/**
 * 只回滚自己写入的内联样式。首次覆盖前记录原值与优先级；若别家后来改过，
 * 当前值不再等于我们的写入值，就不抢回去。material 与 full 切换也走同一套恢复。
 */
const ownedStyles = new Map();
function ownedStyleKey(element, name) {
  return (element === document.documentElement ? 'root:' : 'body:') + name;
}
function setOwnedStyle(element, name, value, priority = '') {
  const key = ownedStyleKey(element, name);
  let owned = ownedStyles.get(key);
  if (!owned) {
    owned = {
      element, name,
      valueBefore: element.style.getPropertyValue(name),
      priorityBefore: element.style.getPropertyPriority(name)
    };
    ownedStyles.set(key, owned);
  }
  const text = String(value);
  element.style.setProperty(name, text, priority);
  owned.valueWritten = text;
  owned.priorityWritten = priority;
}
function restoreOwnedStyles(includeLight = true) {
  for (const [key, owned] of ownedStyles) {
    if (!includeLight && owned.name === '--dn-light-rgb') continue;
    const style = owned.element.style;
    if (style.getPropertyValue(owned.name) === owned.valueWritten
      && style.getPropertyPriority(owned.name) === owned.priorityWritten) {
      if (owned.valueBefore) style.setProperty(owned.name, owned.valueBefore, owned.priorityBefore);
      else style.removeProperty(owned.name);
    }
    ownedStyles.delete(key);
  }
}

function applySurfaces() {
  const body = document.body;
  if (!body) return;
  for (const name of SURFACE_NAMES) {
    setOwnedStyle(body, name, surfaceColor(SURFACE_MIX[name]), 'important');
  }
}

function applyTokens() {
  // 先撤掉上一模式的覆盖；光照变量独立连续，不因换纸而闪一下。
  restoreOwnedStyles(false);
  const root = document.documentElement;
  const p = paper();
  // 「只叠材质」：宿主 alias 与 specific 一概不写，只保留自己的 dn-*。
  if (tokenMode() === 'material') {
    const own = {
      '--dn-sheet': 'transparent',
      '--dn-selection': washColor(),
      '--dn-paper': p.paper,
      '--dn-ink': p.ink,
      '--dn-caret-ink': p.cursor,
      '--dn-metal-lo': '#5e431c',
      '--dn-metal-hi': '#f3dca4',
      '--dn-metal': '#b8904c'
    };
    for (const [name, value] of Object.entries(own)) setOwnedStyle(root, name, value);
    return;
  }
  applySurfaces();
  const map = tokenMap(p);
  // 配色必须写在宿主声明它的那一层上。
  //
  // DSH 自己把整张 alias 表声明在 body 上（body{--dsw-alias-bg-base:…}、
  // body[data-ds-dark-theme]{…}）。自定义属性只要在 body 上有一处本地声明，
  // 就不再接受 html 继承下来的值——只写根元素的话，会话列和右侧栏永远是宿主
  // 的白底/黑底，只有走 --dsw-specific-* 的侧栏和输入框换上了纸。
  // 所以两处都写：根上留给 :root 规则，body 上压住宿主的表。
  const body = document.body;
  for (const [name, value] of Object.entries(map)) {
    setOwnedStyle(root, name, value, 'important');
    if (body) setOwnedStyle(body, name, value, 'important');
  }
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
  let hostAppearance = detectHostAppearance();
  setPaperAppearance(hostAppearance);
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

  const white = watchWhite();

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
    const width = Math.max(1, Math.round(window.innerWidth));
    const height = Math.max(1, Math.round(window.innerHeight));
    // 限制两片全屏画布的总像素成本；DOM 文字仍按系统 DPR 清晰渲染。
    // 预留取整余量，确保最终画布不超过约 200 万像素。
    const pixelBudgetDpr = Math.sqrt(1950000 / (width * height));
    const dpr = Math.max(0.5, Math.min(2, window.devicePixelRatio || 1, pixelBudgetDpr));
    for (const canvas of [paperCanvas, glowCanvas]) {
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    glow.resize(width, height, dpr);
    const changed = width !== size.width || height !== size.height || dpr !== size.pixelRatio;
    size = {width, height, pixelRatio: dpr};
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
  let thisFrameActive = false;

  function paintFrame(now) {
    const startedAt = performance.now();
    const time = now / 1000;
    const appearance = paper().appearance;
    // 光标位置交给墨迹光标自己量（contenteditable / input / textarea 都能跟），
    // 它量不出来就返回 null，墨块藏起来，原生光标原样接管。
    caretPoint = caret.sync() || findCaret();
    const caretSheetX = caretPoint ? caretPoint.x - origin.left : size.width / 2;
    const rig = buildRig(size, caretSheetX);
    const animateGrain = SETTINGS.ambientMotion && SETTINGS.grain > 0 && !reduceMotion;

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
    const dustDue = SETTINGS.ambientMotion && !reduceMotion && SETTINGS.particles > 0 && now - lastGlowAt > 60;
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
        time: SETTINGS.ambientMotion && !reduceMotion ? time : 0
      });
      lastGlowAt = now;
    }
    lastCaretPoint = caretPoint ? {x: caretPoint.x, y: caretPoint.y} : null;
    cursorMovedThisFrame = false;

    // 纸夹自带脏标记：静止时只花一次比较。
    const scrollMoving = scrollClip.step(now);
    thisFrameActive = (SETTINGS.ambientMotion && (SETTINGS.grain > 0 || SETTINGS.particles > 0)) || scrollMoving;

    // 根元素的 custom property 一改，整篇文档的样式都要重算——只在真的变了才写。
    const rgb = lightChannels.join(' ');
    if (rgb !== lastRgbWritten) {
      setOwnedStyle(document.documentElement, '--dn-light-rgb', rgb);
      lastRgbWritten = rgb;
    }

    // 卡顿看门狗：帧间隔超 200ms 就记一笔，连同本帧自己的耗时，用来分清
    // "卡在我们自己的回调里"还是"卡在别处"。
    const cost = performance.now() - startedAt;
    if (lastFrameAt) {
      const gap = now - lastFrameAt;
      if (SETTINGS.diagnostics && gap > 200) {
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
  }

  /**
   * 一帧的壳：里面出任何异常都不许把循环掐断。
   * 之前 reportDiag 里一处抛错就把整个循环带走（纸停在最后一帧、自检也再没写过），
   * 桌面版又没有控制台，所以这里把错误存进 selfCheckError，随自检落盘。
   */
  let lastPaintAt = 0;
  function frame(now) {
    if (stopped) return;
    const interval = thisFrameActive && !reduceMotion ? 1000 / 30 : 1000 / 8;
    if (now - lastPaintAt >= interval) {
      lastPaintAt = now;
      try {
        paintFrame(now);
      } catch (error) {
        if (!selfCheckError) {
          selfCheckError = String((error && error.stack) || error).slice(0, 240);
          if (lastDiag) lastDiag.error = selfCheckError;
          persist();
        }
      }
    }
    frameId = requestAnimationFrame(frame);
  }

  function reposition() {
    lastPaintAt = 0;
    measureSheet();
    needsLight = true;
  }

  const observer = new ResizeObserver(reposition);
  observer.observe(document.documentElement);

  /** 宿主切换明暗时，同步选用另一套纸面变体，并重建纸与辉光。 */
  const onHostAppearanceChange = () => {
    const next = detectHostAppearance();
    if (next === hostAppearance || stopped) return;
    hostAppearance = next;
    setPaperAppearance(hostAppearance);
    applyTokens();
    scrollClip.apply();
    caret.hide();
    needsBuild = true;
    needsLight = true;
    lastPaintAt = 0;
    notifySettings();
    reposition();
  };
  const appearanceObserver = new MutationObserver(onHostAppearanceChange);
  for (const node of [document.documentElement, document.body]) {
    if (node) appearanceObserver.observe(node, {
      attributes: true,
      attributeFilter: ['data-ds-dark-theme', 'data-dark-theme', 'data-theme', 'data-appearance', 'class']
    });
  }
  const colorSchemeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (colorSchemeQuery) {
    if (typeof colorSchemeQuery.addEventListener === 'function') colorSchemeQuery.addEventListener('change', onHostAppearanceChange);
    else if (typeof colorSchemeQuery.addListener === 'function') colorSchemeQuery.addListener(onHostAppearanceChange);
  }

  const onSelection = () => { needsLight = true; };
  // 页面看不见时停掉循环：一张一直重算的纸，在后台没人看，白烧电。
  const onVisibility = () => {
    if (document.hidden) {
      if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    } else if (!frameId && !stopped) {
      lastPaintAt = 0;
      needsLight = true;
      frameId = requestAnimationFrame(frame);
    }
  };
  // 显卡被回收（切后台、驱动重置、显存吃紧）时不能白屏：重建 surface 再点灯。
  const onContextLost = (event) => {
    event.preventDefault();
    paperLight.invalidate();
  };
  const onContextRestored = () => {
    paperLight.restore();
    needsBuild = true;
    needsLight = true;
    measureSheet();
  };
  paperCanvas.addEventListener('webglcontextlost', onContextLost);
  paperCanvas.addEventListener('webglcontextrestored', onContextRestored);

  window.addEventListener('resize', reposition);
  document.addEventListener('selectionchange', onSelection);
  document.addEventListener('visibilitychange', onVisibility);

  /**
   * 发送窗口：回车之后 1.5 秒内是"闪白"的现场，只在这时候做一次层级审计。
   * 不做常驻轮询——一次全表 getComputedStyle 是几十毫秒。
   */
  const onKeyForAudit = (event) => {
    if (!SETTINGS.diagnostics || event.key !== 'Enter' || event.shiftKey) return;
    white.arm();
    setTimeout(() => {
      try {
        const audit = auditStacking();
        lastDiag = lastDiag || {};
        lastDiag.above = audit.above;
        lastDiag.scanned = audit.scanned;
        lastDiag.bright = audit.bright;
        lastDiag.tokens = auditTokens();
        persist();
      } catch (error) {
        lastDiag = lastDiag || {};
        lastDiag.auditError = String(error).slice(0, 160);
        persist();
      }
    }, 900);
  };
  document.addEventListener('keydown', onKeyForAudit, true);

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

  function reportDiag(includePixels = false) {
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
      version: DN_VERSION,
      white: white.hits.slice(),
      surfaces: (function () {
        const body = document.body;
        return body ? [
          getComputedStyle(body).getPropertyValue('--dsw-specific-bubble').trim(),
          getComputedStyle(body).getPropertyValue('--dsw-specific-input-major').trim()
        ] : null;
      })(),
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
      paperPixels: includePixels || SETTINGS.diagnostics ? samplePaper() : null
    };
    persist();
  }

  /**
   * 面板与控制台唯一的设置入口：先合并/规范化，再统一执行副作用。
   * 新增设置时不再靠记住"哪个分支还要刷 token、哪个分支还要重建纸"。
   */
  const settingsListeners = new Set();
  let settingsRevision = 0;
  function notifySettings() {
    settingsRevision += 1;
    for (const listener of settingsListeners) listener();
  }
  function updateSettings(patch, reset = false) {
    const keys = new Set(reset ? [...SETTING_KEYS, 'window', 'scrollbar'] : Object.keys(patch || {}));
    if (reset) Object.assign(SETTINGS, JSON.parse(JSON.stringify(NOCTURNE_DEFAULTS)));
    else mergeSettings(patch);
    normalize();
    lastPaintAt = 0;
    const changed = (...names) => reset || names.some((name) => keys.has(name));

    if (changed('paper', 'theme', 'coexist')) applyTokens();
    if (changed('cursorMode')) caret.setMode(SETTINGS.cursorMode);
    if (changed('scrollbar')) scrollClip.apply();
    if (changed('paper')) caret.hide();
    needsLight = true;
    if (changed('paper', 'theme', 'texture')) {
      needsBuild = true;
      reposition();
    }
    notifySettings();
    persist();
  }

  // 官方设置槽使用同一个 React 快照；不再创建上游悬浮 Studio。
  settingsPageComponent = createNocturneSettings({
    state: () => SETTINGS,
    foreign: foreignSkin,
    resolvedCoexist: tokenMode,
    appearance: () => paper().appearance,
    paperColor: (id) => paperFor(id).paper,
    revision: () => settingsRevision,
    subscribe(listener) {
      settingsListeners.add(listener);
      return () => settingsListeners.delete(listener);
    },
    onChange(key, value) {
      if (key === 'preset') { updateSettings(null, true); return; }
      if (key === 'cursor') { updateSettings({cursorMode: value}); return; }
      if (key === 'scrollStyle' || key === 'scrollFinish') {
        updateSettings({scrollbar: {[key === 'scrollStyle' ? 'style' : 'finish']: value}});
        return;
      }
      if (key === 'scrollBarWidth' || key === 'scrollBarOpacity') {
        updateSettings({scrollbar: {[key === 'scrollBarWidth' ? 'barWidth' : 'barOpacity']: value}});
        return;
      }
      updateSettings({[key]: value});
    }
  });
  caret.setMode(SETTINGS.cursorMode);
  scrollClip.apply();
  applyTokens();

  // 磁盘上的设置才是真源：取回来之后要重新落到 token、光标与面板上。
  loadRemote().then((loaded) => {
    if (!loaded || stopped) return;
    caret.setMode(SETTINGS.cursorMode);
    scrollClip.apply();
    applyTokens();
    notifySettings();
    needsBuild = true;
    reposition();
  });

  window.__dshNocturne = {
    settings: SETTINGS,
    papers: Object.keys(PAPERS),
    use(paperId, options) {
      const patch = Object.assign({}, options || {});
      if (PAPERS[paperId]) patch.paper = paperId;
      updateSettings(patch);
      return SETTINGS.paper;
    },
    theme(themeId) {
      if (THEMES[themeId]) updateSettings({theme: themeId});
      return SETTINGS.theme;
    },
    lamp(on) { updateSettings({lamp: on !== false}); },
    /** 默认只保留轻量自检；开启后才扫描 DOM、记录卡顿并自动采样 GPU。 */
    diagnostics(on) { updateSettings({diagnostics: on !== false}); },
    /** 关掉墨迹光标：宿主自己的光标立刻回来（caret-color 会被还原）。 */
    caret(on) { caret.enabled = on !== false; if (!caret.enabled) caret.hide(); return caret.enabled; },
    /** 滚条形态：'clip' 纸夹 / 'bar' 细杆 / 'native' 原生。 */
    scroll(style) {
      const next = ['clip', 'bar', 'native'].indexOf(style) < 0 ? 'clip' : style;
      updateSettings({scrollbar: {style: next}});
      return SETTINGS.scrollbar.style;
    },
    /** 选区与纸夹的实时状态：桌面版没有控制台，这是唯一能问的地方。 */
    state() {
      return {
        clip: scrollClip.element ? scrollClip.element.style.transform : null,
        target: scrollClip.target ? String(scrollClip.target.className).slice(0, 40) : null,
        dirty: scrollClip.needLayout,
        observed: Boolean(scrollClip.mutationObserver)
      };
    },
    /** 马上写一次自检（含白面探针的结果）——桌面版没有控制台，这是唯一的取证入口。 */
    diag() {
      try {
        reportDiag(true);
      } catch (error) {
        return {error: String(error).slice(0, 200)};
      }
      return lastDiag;
    },
    /** 手动跑一次层级审计（谁在纸层之上）。 */
    above() {
      const audit = auditStacking();
      lastDiag = lastDiag || {};
      lastDiag.above = audit.above;
      lastDiag.scanned = audit.scanned;
      lastDiag.bright = audit.bright;
      lastDiag.tokens = auditTokens();
      persist();
      return audit;
    },
    /** 这次会话里抓到的近白表面。 */
    white() {
      return white.hits.slice();
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
    appearanceObserver.disconnect();
    if (colorSchemeQuery) {
      if (typeof colorSchemeQuery.removeEventListener === 'function') colorSchemeQuery.removeEventListener('change', onHostAppearanceChange);
      else if (typeof colorSchemeQuery.removeListener === 'function') colorSchemeQuery.removeListener(onHostAppearanceChange);
    }
    window.removeEventListener('resize', reposition);
    document.removeEventListener('selectionchange', onSelection);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('keydown', onKeyForAudit, true);
    paperCanvas.removeEventListener('webglcontextlost', onContextLost);
    paperCanvas.removeEventListener('webglcontextrestored', onContextRestored);
    white.observer.disconnect();
    caret.destroy();
    scrollClip.destroy();
    paperLight.destroy();
    glow.clear();
    settingsPageComponent = null;
    settingsListeners.clear();
    if (paperCanvas.parentNode) paperCanvas.remove();
    if (glowCanvas.parentNode) glowCanvas.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    // 只还原仍由本插件持有的内联覆盖，别家后续的修改不受影响。
    clearTimeout(remoteTimer);
    restoreOwnedStyles();
    delete window.__dshNocturne;
  };
}

function unmount() {
  if (teardown) { const run = teardown; teardown = null; run(); }
}

function registerSettingsPage(ctx) {
  if (!ctx || !ctx.slots || !settingsPageComponent) return;
  return ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'nocturne',
    order: 24,
    label: () => '缮写室'
  }, settingsPageComponent));
}

export const name = 'dsh-nocturne';
export const inject = ['slots'];
/**
 * 宿主调用一次就能挂上；返回值是 cordis 认的卸载函数。
 * 重复调用是无害的：mount() 先看 canvas 是否已经在场。
 */
export function apply(ctx) {
  mount();
  if (ctx && typeof ctx.effect === 'function') {
    ctx.effect(() => registerSettingsPage(ctx), 'dsh-nocturne: settings section');
  } else {
    registerSettingsPage(ctx);
  }
  return unmount;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('canvas[' + PAPER_ATTR + ']')) mount();
  }, {once: true});
} else if (!document.querySelector('canvas[' + PAPER_ATTR + ']')) {
  mount();
}
