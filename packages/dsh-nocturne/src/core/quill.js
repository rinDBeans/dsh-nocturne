

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

export {buildQuill, Q_VIEW, Q_LINES, Q_NIB};
