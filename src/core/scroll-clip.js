import {clamp, reduceMotion} from './math.js';
import {SETTINGS, paper} from './state.js';

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
    this.resizeObserver = null;
    this.mutationObserver = null;
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
    if (this.needLayout && now - (this.lastLayout || 0) >= 66) {
      this.needLayout = false;
      this.lastLayout = now;
      this.layout();
    }
    if (stale && now - (this.lastProbe || 0) > 500) {
      this.needLayout = false;
      this.lastProbe = now;
      this.layout();
    }
    if (!this.target || this.element.hidden) return false;
    let last = this.last;
    let remaining = last ? Math.min(0.5, (now - last) / 1000) : 1 / 60;
    this.last = now;
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
    return moving || this.dragging;
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
    const invalidate = () => { this.needLayout = true; };
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(invalidate);
      this.resizeObserver.observe(next);
    }
    if (typeof MutationObserver === 'function') {
      this.mutationObserver = new MutationObserver(invalidate);
      this.mutationObserver.observe(next, {childList: true, subtree: true, characterData: true, attributes: true});
    }
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
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.mutationObserver) this.mutationObserver.disconnect();
    this.resizeObserver = null;
    this.mutationObserver = null;
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

export {ScrollClip, CLIP_FINISHES, stepSpring};
