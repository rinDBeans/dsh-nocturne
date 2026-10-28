
/* ═══════════════════════════════════════════════════════════════════════════
   DSH 适配层。上面那一大段是样张里的同一份核心，由 tools/build.mjs 从
   sample/nocturne-desk.html 里抽取——不是复制粘贴，所以纸、灯、辉光在
   样张和宿主里永远是同一套代码。
   ═══════════════════════════════════════════════════════════════════════ */
const PAPER_ATTR = 'data-dn';
const STYLE_ID = 'dsh-nocturne-style';
const STORE_KEY = 'dsh-nocturne:settings';
const STORE_VERSION = 1;
const measure = document.createElement('canvas').getContext('2d');

let teardown = null;

/**
 * 读设置。带版本号：旧版本写进去的键可能已经不认了，所以认不出的值一律回落默认，
 * 而不是让一个脏值把渲染层搞崩。迁移只往前，不回头。
 */
function readSettings() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const known = ['paper', 'theme', 'lamp', 'enabled', 'intensity', 'spread', 'beam', 'aim',
        'reach', 'softness', 'grain', 'cursorGlow', 'paperIllumination', 'particles', 'texture', 'cursorMode'];
      for (const key of known) {
        if (saved[key] !== undefined && saved[key] !== null) SETTINGS[key] = saved[key];
      }
      if (saved.window && typeof saved.window === 'object') Object.assign(SETTINGS.window, saved.window);
    }
  } catch (error) { /* 私密模式或旧数据：用默认值 */ }
  if (!PAPERS[SETTINGS.paper]) SETTINGS.paper = 'parchment';
  if (!THEMES[SETTINGS.theme]) SETTINGS.theme = 'paper-and-ink';
  if (['ink', 'quill', 'none'].indexOf(SETTINGS.cursorMode) < 0) SETTINGS.cursorMode = 'ink';
  SETTINGS.particleCount = SETTINGS.particleCount || 0;
}

function persist() {
  try {
    const saved = {v: STORE_VERSION};
    for (const key of Object.keys(SETTINGS)) {
      if (typeof SETTINGS[key] !== 'function') saved[key] = SETTINGS[key];
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  } catch (error) { /* 配额或私密模式：不保存也不报错 */ }
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
function applyTokens() {
  const p = paper();
  const dark = p.appearance === 'dark';
  const root = document.documentElement.style;
  root.setProperty('--dsw-alias-bg-base', p.paper);
  root.setProperty('--dsw-alias-bg-module-platform', p.paper);
  root.setProperty('--dsw-alias-bg-layer-1', dark ? '#242028' : '#eadcb9');
  root.setProperty('--dsw-alias-bg-layer-2', dark ? '#1a171d' : '#e6d5b0');
  root.setProperty('--dsw-alias-label-primary', p.ink);
  root.setProperty('--dsw-alias-label-secondary', p.inkMuted);
  root.setProperty('--dn-paper', p.paper);
  root.setProperty('--dn-ink', p.ink);
  root.setProperty('--dn-caret-ink', p.cursor);
  host_cursor(p);
}

function host_cursor(p) {
  const root = document.documentElement.style;
  root.setProperty('--dsw-alias-label-tertiary', p.appearance === 'dark' ? '#8f89a6' : '#7d7264');
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
    }
  }

  function frame(now) {
    if (stopped) return;
    const time = now / 1000;
    const appearance = paper().appearance;
    // 光标位置交给墨迹光标自己量（contenteditable / input / textarea 都能跟），
    // 它量不出来就返回 null，墨块藏起来，原生光标原样接管。
    caretPoint = caret.sync() || findCaret();
    const caretSheetX = caretPoint ? caretPoint.x - origin.left : size.width / 2;
    const rig = buildRig(size, caretSheetX);
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
    document.documentElement.style.setProperty('--dn-light-rgb', lightChannels.join(' '));
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

  // 缮写室：与样张同一份 builder，所以两处的面板不会长歪。
  const studio = buildStudio({
    state: () => SETTINGS,
    onChange(key, value) {
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
        caret.mode = value;
        caret.hide();
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
      SETTINGS[key] = value;
      if (key === 'texture') needsBuild = true;
      needsLight = true;
      persist();
    }
  });
  document.body.appendChild(studio.element);
  document.body.appendChild(studio.handle);
  caret.mode = SETTINGS.cursorMode;
  applyTokens();

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
    paperLight.release();
    glow.clear();
    if (studio.element.parentNode) studio.element.remove();
    if (studio.handle.parentNode) studio.handle.remove();
    if (paperCanvas.parentNode) paperCanvas.remove();
    if (glowCanvas.parentNode) glowCanvas.remove();
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    // token 还原：撤掉内联覆盖，宿主的主题立刻回来。
    for (const name of ['--dsw-alias-bg-base', '--dsw-alias-bg-module-platform', '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2', '--dsw-alias-label-primary', '--dsw-alias-label-secondary',
      '--dsw-alias-label-tertiary', '--dn-paper', '--dn-ink', '--dn-caret-ink', '--dn-light-rgb',
      '--dn-metal-lo', '--dn-metal-hi', '--dn-metal']) {
      document.documentElement.style.removeProperty(name);
    }
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
