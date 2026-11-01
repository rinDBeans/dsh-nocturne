import {toUnit} from './math.js';

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
const LIGHT_INK = {
  ink:'#2a2019', inkMuted:'#6b5f52', inkFaint:'#8a7d6b', cursor:'#3a2c20',
  selection:'rgba(52, 64, 112, 0.2)'
};
const DARK_INK = {
  ink:'#ece6db', inkMuted:'#aaa193', inkFaint:'#7a7165', cursor:'#f2eadb',
  selection:'rgba(196, 188, 255, 0.20)'
};

function paperVariant(id, name, appearance, paper, ink, surface) {
  return {id, name, appearance, paper, surface, ansi:appearance === 'dark' ? NIGHT_ANSI : LIGHT_ANSI, ...ink};
}
function paperEntry(id, name, nativeAppearance, surface, light, dark) {
  const lightVariant = paperVariant(id, name, 'light', light.paper, {...LIGHT_INK, ...light}, surface);
  const darkVariant = paperVariant(id, name, 'dark', dark.paper, {...DARK_INK, ...dark}, surface);
  return {
    ...(nativeAppearance === 'dark' ? darkVariant : lightVariant),
    id, name, nativeAppearance,
    variants:{light:lightVariant, dark:darkVariant}
  };
}

const PAPERS = {
  cotton: paperEntry('cotton', 'Cotton', 'light',
    {crinkle:.3, felt:1, laid:0, linen:0, mottle:.08, age:0},
    {paper:'#eee6d5'},
    {paper:'#26231e', ink:'#eee6d8', inkMuted:'#aaa08f', inkFaint:'#796f61'}),
  laid: paperEntry('laid', 'Laid', 'light',
    {crinkle:.22, felt:0, laid:1, linen:0, mottle:.18, age:0},
    {paper:'#f1e9d6'},
    {paper:'#29251d', ink:'#efe6d4', inkMuted:'#ad9f87', inkFaint:'#796d5b'}),
  linen: paperEntry('linen', 'Linen', 'light',
    {crinkle:.2, felt:0, laid:0, linen:1, mottle:.08, age:0},
    {paper:'#ebe5d8'},
    {paper:'#24231f', ink:'#ebe7da', inkMuted:'#a7a191', inkFaint:'#716b5f'}),
  onionskin: paperEntry('onionskin', 'Onionskin', 'light',
    {crinkle:.08, felt:0, laid:0, linen:0, mottle:.04, age:0},
    {paper:'#f2f1ea'},
    {paper:'#232325', ink:'#e9e7e2', inkMuted:'#a8a49e', inkFaint:'#74716c'}),
  parchment: paperEntry('parchment', 'Parchment', 'light',
    {crinkle:.25, felt:0, laid:0, linen:0, mottle:1, age:.75},
    {paper:'#efdfbd'},
    {paper:'#2d2419', ink:'#efe2c8', inkMuted:'#b29c7b', inkFaint:'#7d6b53'}),
  night: paperEntry('night', 'Night', 'dark',
    {crinkle:.3, felt:0, laid:0, linen:0, mottle:.1, age:0},
    {paper:'#e9e6f0', ink:'#282435', inkMuted:'#655f78', inkFaint:'#948da5', cursor:'#312b45', selection:'rgba(112,96,160,.22)'},
    {paper:'#1d1a20', ink:'#e6e1ea', inkMuted:'#9a94a6', inkFaint:'#6f7192', cursor:'#e9e7ff', selection:'rgba(196,188,255,.20)'})
};

let PAPER_APPEARANCE = 'light';
function setPaperAppearance(appearance) {
  PAPER_APPEARANCE = appearance === 'dark' ? 'dark' : 'light';
}
function paperFor(id) {
  const base = PAPERS[id] || PAPERS.parchment;
  return base.variants[PAPER_APPEARANCE];
}

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
  // 诊断默认关闭；显式开启后才扫描 DOM、记录卡顿和采样 GPU。
  diagnostics:false,
  // 环境颗粒与尘埃默认静态；需要连续动画时再显式开启。
  ambientMotion:false,
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
const paper = () => paperFor(SETTINGS.paper);

/**
 * 选区的底色：纸自己的调子，不是浏览器的蓝。
 * 浅色纸用房间的描金（与细边、页码同源），深色纸用纸自带的月白。
 * 上游的规则是"主题选色优先、纸选色兜底"；这里的纸与房间是正交的，所以按纸的明暗分流。
 */
function washColor() {
  const p = paper();
  const t = theme();
  return p.appearance === 'dark' ? p.selection : (t.selection || p.selection);
}

/**
 * 纸面上的"另一层纸"：把纸色朝墨色调一点。
 * 气泡、输入框、菜单、侧栏都用它——整扇窗是一张纸，这些是纸上压出来的一层，
 * 不是浮在纸上的一张白卡片。深色纸上 ink 是浅的，所以这条在夜纸上会自动变成"略亮"。
 */
function surfaceColor(amount) {
  const base = toUnit(paper().paper);
  const ink = toUnit(paper().ink);
  const mixed = [0, 1, 2].map((i) => Math.round((base[i] * (1 - amount) + ink[i] * amount) * 255));
  return '#' + mixed.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

/**
 * 标定值：这一组是亮度分布对到上游官方截图（p50≈115 / p95≈178）的那一套。
 * 把滑杆推散之后还能一键回家——"复刻"得有个可回的基准。
 */
const NOCTURNE_DEFAULTS = JSON.parse(JSON.stringify(SETTINGS));

/* ═══════════════════════════════════════════════════════════════════════════
   2 · 小工具
   ═══════════════════════════════════════════════════════════════════════ */

export {LIGHT_ANSI, NIGHT_ANSI, PAPERS, THEMES, SETTINGS, NOCTURNE_DEFAULTS, theme, paper, paperFor, setPaperAppearance, washColor, surfaceColor};
