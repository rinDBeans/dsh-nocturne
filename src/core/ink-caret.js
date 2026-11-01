import {clamp} from './math.js';
import {paper} from './state.js';
import {buildQuill, Q_VIEW, Q_LINES, Q_NIB} from './quill.js';

// 文字与字形测量只服务于 InkCaret；模块化后必须与使用者同寿命、同作用域。
const measureCanvas = document.createElement('canvas').getContext('2d');

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
    this.onCompositionStart = () => { this.inComposition = true; this.hide(); };
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
    if (!this.enabled || this.inComposition) { this.hide(); return null; }
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

export {InkCaret};
