
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
