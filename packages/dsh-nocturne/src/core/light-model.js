import {clamp, smoothstep, norm, dot3, spreadToCosine} from './math.js';
import {SETTINGS, theme, paper} from './state.js';

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

export {barHalfWidth, between, windowGobo, irradiance, toneMap, lightAmount, referenceExposure, buildRig, ambientLevel};
