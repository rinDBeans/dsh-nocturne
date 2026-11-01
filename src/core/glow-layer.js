import {clamp, toUnit} from './math.js';
import {SETTINGS, theme, paper} from './state.js';
import {lightAmount} from './light-model.js';

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
    if (this.width === width && this.height === height && this.pixelRatio === pixelRatio) return;
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

export {GlowLayer, poolStrength, poolColor};
