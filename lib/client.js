/**
 * dsh-nocturne — 浏览器半。由 ES 模块构建，请勿直接编辑。
 * 上游配方来自 Chaosnap/Typewriter-Nocturne（MIT）。
 */
window.__ModuleLoader__.load({
  id: 'dsh-nocturne',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const CSS_TEXT = "/* dsh-nocturne —— 纸的配色由 token 决定，材质由 canvas 决定。\n   这里只做两件事：把 DSH 的语义别名换成纸与墨；给两片 canvas 找位置。\n   颜色取自 Typewriter-Nocturne 的 papers.ts（MIT）。 */\n\nhtml, :root {\n  --dn-paper: #efdfbd;\n  --dn-ink: #2a2019;\n  --dn-ink-muted: #6b5f52;\n  --dn-room: #241a14;\n  --dn-room-edge: #070504;\n  --dn-gilt: #6f5420;\n  --dn-light-rgb: 255 210 154;\n  --dn-metal-lo: #5e431c;\n  --dn-metal-hi: #f3dca4;\n  --dn-metal: #b8904c;\n  --font-mono: var(--dsh-font-family-code, ui-monospace, monospace);\n\n  /* 配色 token 不写在这里：运行时由 applyTokens() 内联写入并带 !important。\n     写在这里会反过来压过内联更新，导致换纸只换画布、不换界面底色。 */\n\n  /* 字体由 applyTokens() 仅在 full 模式写入；material 保留宿主或 claude-style 字体。 */\n}\n\n/* 整扇窗就是这张纸。没被画到的地方也必须落到纸色上——否则留给 `html` 的\n   默认底会把正文区露成黑洞（第一次装载测试就是这么翻车的）。 */\n/* 纸的底色挂在 --dn-sheet 上：接管配色时是纸色，只让位时是 transparent（宿主自己画）。 */\nhtml, body { background: var(--dn-sheet, transparent) !important; }\n\n/* 两片 canvas：直接挂在 body 下，不能包一层带 z-index 的容器——\n   那会给它们造一个隔离栈，multiply 就再也合不到页面上（实测见 docs/nocturne.md）。 */\ncanvas[data-dn=\"paper\"], canvas[data-dn=\"glow\"] {\n  position: fixed;\n  left: 0;\n  top: 0;\n  display: block;\n  pointer-events: none;\n  transform-origin: 0 0;\n}\ncanvas[data-dn=\"paper\"] {\n  mix-blend-mode: multiply;\n  z-index: 2147482000;\n}\ncanvas[data-dn=\"glow\"] {\n  mix-blend-mode: screen;\n  z-index: 2147482001;\n}\n\n/* 纸的四边压暗，给出\"一张纸\"的厚度；比 TN 的 #vignette 更贴边，\n   因为这里的纸是整扇窗。 */\nhtml::after {\n  content: \"\";\n  position: fixed;\n  inset: 0;\n  z-index: 2147482003;\n  pointer-events: none;\n  background: radial-gradient(ellipse 92% 88% at 50% 46%, transparent 52%, rgba(0, 0, 0, .42) 100%);\n}\n\n.dn-caret{\n  position:fixed; left:0; top:0; z-index: 2147481999;\n  display:none; pointer-events:none; will-change:transform;\n  --dn-ink-size:16px;\n  --dn-ink-weight:400;\n}\n.dn-ink-blot,\n.dn-ink-halo{\n  position:absolute; inset:7% 0.5px;\n  background:var(--dn-caret-ink, #3a2c20);\n}\n.dn-ink-blot{\n  border-radius:22% 14% 18% 12% / 12% 20% 10% 18%;\n  box-shadow:\n    inset 0 0 0 .5px rgba(0,0,0,.22),\n    inset 0 0 3px rgba(0,0,0,.28),\n    0 0 1.2px var(--dn-caret-ink, #3a2c20);\n  filter:blur(.3px);\n}\n.dn-ink-halo{\n  border-radius:40%;\n  opacity:0;\n  filter:blur(2.5px);\n}\n.dn-ink-glyph{\n  position:absolute; inset:0;\n  display:flex; align-items:center; justify-content:center;\n  color:var(--dsw-alias-bg-base, #efdfbd);\n  font-family:var(--dsh-font-family-code, ui-monospace, monospace);\n  font-size:var(--dn-ink-size);\n  font-weight:var(--dn-ink-weight);\n  line-height:1; white-space:pre;\n  font-variant-ligatures:none;\n}\n/* 失焦时墨退掉，只留一个淡淡的格子轮廓。 */\n.dn-caret[data-focused=\"false\"] .dn-ink-blot,\n.dn-caret[data-focused=\"false\"] .dn-ink-halo,\n.dn-caret[data-focused=\"false\"] .dn-ink-glyph{ display:none }\n.dn-caret[data-focused=\"false\"]::after{\n  content:\"\"; position:absolute; inset:7% .5px;\n  border:1px solid var(--dn-caret-ink, #3a2c20); border-radius:2px; opacity:.45;\n}\n.dn-caret[data-appearance=\"dark\"] .dn-ink-blot{\n  box-shadow:\n    inset 0 0 0 .5px rgba(255,255,255,.25),\n    inset 0 0 3px rgba(255,255,255,.3),\n    0 0 1.2px var(--dn-caret-ink, #3a2c20);\n}\n/* ── 羽毛笔光标：形状、渐变、摆动、光晕都照搬上游 .tn-quill ─────────────── */\n.dn-quill{\n  position:fixed; left:0; top:0; z-index:1;\n  display:none; pointer-events:none; will-change:transform;\n  --dn-quill-edge:#120e0c;\n  --dn-quill-body:#2b2420;\n  --dn-quill-sheen:#5f5753;\n  --dn-quill-barb:rgba(168,152,138,.42);\n  --dn-quill-rachis:#e4d8c0;\n  --dn-quill-down:rgba(70,60,54,.65);\n  filter:drop-shadow(.8px 1.6px 1px rgba(0,0,0,.3));\n  animation:dn-quill-breathe 1.2s ease-in-out infinite alternate;\n}\n.dn-quill[data-appearance=\"dark\"]{\n  --dn-quill-edge:#9d9485;\n  --dn-quill-body:#ebe4d6;\n  --dn-quill-sheen:#fffdf8;\n  --dn-quill-barb:rgba(140,128,108,.5);\n  --dn-quill-rachis:#fffdf6;\n  --dn-quill-down:rgba(236,229,216,.75);\n}\n.dn-quill svg{display:block; width:100%; height:100%; overflow:visible}\n.dn-quill-sway{transform-box:view-box; transform-origin:0 0; animation:dn-quill-sway 3.4s ease-in-out infinite alternate}\n.dn-quill-vane{fill:url(#dn-quill-vane)}\n.dn-quill-barbs{fill:none; stroke:var(--dn-quill-barb); stroke-width:.28; stroke-linecap:round}\n.dn-quill-rachis{fill:var(--dn-quill-rachis)}\n.dn-quill-rachis-light{fill:none; stroke:#fff; stroke-width:.22; opacity:.55}\n.dn-quill-down{fill:none; stroke:var(--dn-quill-down); stroke-width:.35; stroke-linecap:round}\n.dn-quill-engraving{fill:none; stroke:var(--dn-metal-lo); stroke-width:.3}\n.dn-quill-hole{fill:var(--dn-metal-lo)}\n.dn-quill-shine{fill:#fff; opacity:.2; animation:dn-quill-shine 2.8s ease-in-out infinite}\n.dn-quill-glint{fill:#fff; opacity:0; animation:dn-quill-glint 2.8s ease-in-out infinite}\n.dn-quill[data-focused=\"false\"]{opacity:.4; animation:none}\n.dn-quill[data-focused=\"false\"] .dn-quill-sway,\n.dn-quill[data-focused=\"false\"] .dn-quill-shine,\n.dn-quill[data-focused=\"false\"] .dn-quill-glint{animation:none}\n@keyframes dn-quill-breathe{from{opacity:1} to{opacity:.62}}\n@keyframes dn-quill-sway{from{transform:rotate(-1.6deg)} to{transform:rotate(1.6deg)}}\n@keyframes dn-quill-shine{0%{transform:translateY(0)} 100%{transform:translateY(-46px)}}\n@keyframes dn-quill-glint{\n  0%,72%{opacity:0}\n  80%{opacity:.9}\n  88%{opacity:.15}\n  100%{opacity:0}\n}\n\n\n@media (prefers-reduced-motion:reduce){\n  .dn-quill,.dn-quill-sway,.dn-quill-shine,.dn-quill-glint{animation:none}\n  \n}\n\n/* ── 选区：纸自己的颜色 ────────────────────────────────────────────────\n   不是系统那种蓝，也压不住系统的行为——只换背景色，拖动、复制、双击选词全归浏览器。\n   不加 !important：宿主若另有口径，让它赢。 */\n::selection{ background:var(--dn-selection, rgba(176,138,74,.28)); color:inherit }\n::-moz-selection{ background:var(--dn-selection, rgba(176,138,74,.28)); color:inherit }\n\n/* ── 纸夹：一枚 Gem 夹夹在纸的右缘 ────────────────────────────────────\n   外圈在纸前，内舌在纸后（只留下压住纸面的一道痕），弯头探出纸外。\n   金属丝按\"上左受光\"的管状上色：暗边 + 本体 + 沿光侧的高光。 */\n/* 不挂 will-change:transform：纸夹一帧最多动几像素，不值得在这么重的界面里\n   常驻一个合成层。滚动位置由 rAF 直接写 transform，已经够顺。 */\n.dn-scroll{\n  position:fixed; left:0; top:0;\n  touch-action:none; cursor:grab;\n}\n.dn-scroll[hidden]{ display:none }\n.dn-scroll:active{ cursor:grabbing }\n.dn-scroll:focus-visible{ outline:1px dotted var(--dn-metal, #b8904c); outline-offset:3px }\n.dn-scroll-clip svg{ display:block; width:100%; height:100%; overflow:visible }\n.dn-scroll-clip path{ fill:none; stroke-linecap:round; stroke-linejoin:round }\n.dn-clip-edge{ stroke-width:3.3 }\n.dn-clip-body{ stroke-width:2.6 }\n.dn-clip-light{ stroke-width:.9; opacity:.9 }\n.dn-clip-glint{ stroke:#fff; stroke-width:.55; stroke-dasharray:1.6 11 .8 17; opacity:.85 }\n.dn-clip-shadow{ stroke:rgba(28,18,8,.42); stroke-width:3; transform:translate(1px,1.9px) }\n.dn-clip-pressed{ stroke:rgba(40,28,16,.07); stroke-width:2.2 }\n.dn-scroll[data-appearance=\"dark\"] .dn-clip-shadow{ stroke:rgba(0,0,0,.62) }\n.dn-scroll[data-appearance=\"dark\"] .dn-clip-pressed{ stroke:rgba(255,255,255,.05) }\n.dn-scroll-bar{\n  border-radius:999px;\n  background:rgba(255,255,255,.92);\n  box-shadow:0 0 0 1px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.25);\n}\n.dn-scroll[data-appearance=\"dark\"].dn-scroll-bar{ background:rgba(255,255,255,.75) }\n\n/* 容器的原生滚条让位给纸夹；滚轮、键盘、拖动都还在。 */\n[data-dn-scroll=\"custom\"]{ scrollbar-width:none; -ms-overflow-style:none }\n[data-dn-scroll=\"custom\"]::-webkit-scrollbar{ width:0; height:0 }\n\n.dn-settings {\n  box-sizing: border-box;\n  width: 100%;\n  color: var(--dsw-alias-label-primary);\n  font-family: var(--dsw-font-family, var(--dsh-font-family-text, Inter, system-ui, sans-serif));\n  font-size: 14px;\n  line-height: 22px;\n}\n.dn-settings *, .dn-settings *::before, .dn-settings *::after { box-sizing: border-box; }\n.dn-settings button, .dn-settings input { font: inherit; }\n.dn-settings button { -webkit-tap-highlight-color: transparent; }\n.dn-settings-header { padding: 4px 0 18px; }\n.dn-settings-title { margin: 0; font-size: 20px; font-weight: 500; line-height: 30px; letter-spacing: normal; }\n.dn-settings-subtitle { margin: 4px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }\n.dn-settings-group { margin: 0; padding: 0; border: 0; min-width: 0; }\n.dn-settings-group-title {\n  margin: 0;\n  padding: 22px 0 6px;\n  border-top: .5px solid var(--dsh-claude-divider, var(--dsw-alias-border-l2));\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  font-weight: 600;\n  line-height: 18px;\n  letter-spacing: .04em;\n}\n.dn-settings-group:first-of-type .dn-settings-group-title { padding-top: 14px; border-top: 0; }\n.dn-settings-row {\n  display: flex;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 12px 16px;\n  min-height: 58px;\n  padding: 14px 0;\n  border-top: .5px solid var(--dsh-claude-divider, var(--dsw-alias-border-l2));\n}\n.dn-settings-group-title + .dn-settings-group-rows > .dn-settings-row:first-child { border-top: 0; }\n.dn-settings-row-text { flex: 1 1 180px; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding-right: 24px; }\n.dn-settings-row-title { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 400; line-height: 22px; }\n.dn-settings-row-desc { max-width: 390px; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; }\n.dn-settings-row-control { flex: none; display: flex; align-items: center; justify-content: flex-end; max-width: 100%; }\n.dn-settings-row-block { align-items: stretch; flex-direction: column; }\n.dn-settings-row-block .dn-settings-row-text { padding-right: 0; }\n.dn-settings-row-block .dn-settings-row-control { width: 100%; justify-content: flex-start; }\n.dn-segments { display: inline-flex; align-items: center; gap: 2px; max-width: 100%; padding: 2px; border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-md, 6px); background: var(--dsw-specific-selector, var(--dsw-alias-bg-layer-1)); }\n.dn-segment {\n  min-height: 28px;\n  margin: 0;\n  padding: 3px 10px;\n  border: 0;\n  border-radius: calc(var(--dsw-radius-md, 6px) - 2px);\n  cursor: pointer;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 20px;\n  white-space: nowrap;\n}\n.dn-segment:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dn-segment[data-active] { background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-3)); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 2px rgba(0,0,0,.08); }\n.dn-segment:focus-visible, .dn-paper-choice:focus-visible, .dn-switch:focus-visible, .dn-reset:focus-visible, .dn-slider input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }\n.dn-paper-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; width: 100%; }\n.dn-paper-choice {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n  min-height: 40px;\n  padding: 6px 8px;\n  border: 1px solid var(--dsw-alias-border-l1);\n  border-radius: var(--dsw-radius-md, 6px);\n  cursor: pointer;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n  text-align: left;\n}\n.dn-paper-choice:hover { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-interactive-bg-hover); }\n.dn-paper-choice[data-active] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary); }\n.dn-paper-swatch { flex: none; width: 24px; height: 24px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }\n.dn-paper-name { min-width: 0; overflow: hidden; font-size: 12px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }\n.dn-switch {\n  appearance: none;\n  flex: none;\n  width: 36px;\n  height: 20px;\n  margin: 0;\n  padding: 2px;\n  border: 0;\n  border-radius: 10px;\n  cursor: pointer;\n  background: var(--dsw-specific-selector, var(--dsw-alias-interactive-bg-active));\n  transition: background-color 140ms ease;\n}\n.dn-switch[data-on] { background: var(--dsw-alias-brand-primary); }\n.dn-switch-knob { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-bg-overlay, #fff); box-shadow: 0 1px 2px rgba(20,20,19,.18); translate: 0 0; transition: translate 140ms ease; }\n.dn-switch[data-on] .dn-switch-knob { translate: 16px 0; }\n.dn-slider { display: flex; align-items: center; gap: 12px; width: min(240px, 42vw); }\n.dn-slider-range {\n  --dn-slider-fill: #574331;\n  --dn-slider-track: #bda98c;\n  --dn-slider-ink: #4b3827;\n  --dn-slider-thumb: #70563c;\n  --dn-slider-tick: #a58f70;\n  position: relative;\n  flex: 1 1 140px;\n  min-width: 80px;\n  height: 28px;\n  display: flex;\n  align-items: center;\n}\n.dn-slider-range::after {\n  content: \"\";\n  position: absolute;\n  z-index: 0;\n  left: 0;\n  right: 0;\n  top: 19px;\n  height: 4px;\n  pointer-events: none;\n  background: repeating-linear-gradient(90deg, var(--dn-slider-tick) 0 1px, transparent 1px 20%);\n}\n.dn-slider-range input {\n  position: relative;\n  z-index: 1;\n  appearance: none;\n  -webkit-appearance: none;\n  width: 100%;\n  height: 28px;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  background: transparent;\n  cursor: pointer;\n}\n.dn-slider-range input::-webkit-slider-runnable-track {\n  width: 100%;\n  height: 2px;\n  border: 0;\n  border-radius: 0;\n  background: linear-gradient(to right,\n    var(--dn-slider-fill) 0 var(--dn-range-progress),\n    var(--dn-slider-track) var(--dn-range-progress) 100%);\n}\n.dn-slider-range input::-webkit-slider-thumb {\n  appearance: none;\n  -webkit-appearance: none;\n  width: 8px;\n  height: 16px;\n  margin-top: -7px;\n  border: 1px solid var(--dn-slider-ink);\n  border-radius: 0;\n  background: var(--dn-slider-thumb);\n  box-shadow: none;\n}\n.dn-slider-range input::-moz-range-track {\n  width: 100%;\n  height: 2px;\n  border: 0;\n  border-radius: 0;\n  background: var(--dn-slider-track);\n}\n.dn-slider-range input::-moz-range-progress { height: 2px; background: var(--dn-slider-fill); }\n.dn-slider-range input::-moz-range-thumb {\n  width: 8px;\n  height: 16px;\n  border: 1px solid var(--dn-slider-ink);\n  border-radius: 0;\n  background: var(--dn-slider-thumb);\n  box-shadow: none;\n}\n.dn-settings[data-appearance=\"dark\"] .dn-slider-range {\n  --dn-slider-fill: #c4b8db;\n  --dn-slider-track: #6f6380;\n  --dn-slider-ink: #27222e;\n  --dn-slider-thumb: #b7a9d1;\n  --dn-slider-tick: #756783;\n}\n.dn-slider-value { flex: none; min-width: 48px; color: var(--dsw-alias-label-secondary); font-family: var(--dsh-claude-font-code, var(--dsh-font-family-code, monospace)); font-size: 12px; line-height: 18px; text-align: right; font-variant-numeric: tabular-nums; }\n.dn-reset {\n  min-height: 32px;\n  padding: 4px 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: var(--dsw-radius-md, 6px);\n  cursor: pointer;\n  background: var(--dsw-alias-button-elevated-fill, var(--dsw-alias-bg-layer-1));\n  color: var(--dsw-alias-label-primary);\n  font-size: 12px;\n  line-height: 20px;\n}\n.dn-reset:hover { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dn-settings-footer { display: flex; justify-content: space-between; gap: 12px; padding: 20px 0 4px; border-top: .5px solid var(--dsh-claude-divider, var(--dsw-alias-border-l2)); color: var(--dsw-alias-label-caption); font-size: 11px; line-height: 16px; }\n@media (max-width: 560px) {\n  .dn-settings-row { align-items: flex-start; }\n  .dn-settings-row-text { flex-basis: 140px; padding-right: 0; }\n  .dn-settings-row-control { flex: 1 1 100%; justify-content: flex-start; }\n  .dn-segments { flex-wrap: wrap; }\n  .dn-slider { width: 100%; }\n}\n@media (prefers-reduced-motion: reduce) {\n  .dn-switch, .dn-switch-knob { transition: none; }\n}\n";
    const DN_VERSION = "0.7.1";

var __DshNocturneModule = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name2 in all)
      __defProp(target, name2, { get: all[name2], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client-entry.js
  var client_entry_exports = {};
  __export(client_entry_exports, {
    apply: () => apply,
    inject: () => inject,
    name: () => name
  });

  // src/core/math.js
  var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  var smoothstep = (e0, e1, x) => {
    if (e0 === e1) return x < e0 ? 0 : 1;
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  var toUnit = (hexColor) => [1, 3, 5].map((i) => parseInt(hexColor.slice(i, i + 2), 16) / 255);
  var norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  var dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  var spreadToCosine = (deg) => Math.cos(clamp(deg, 5, 170) * Math.PI / 360);
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduceMotion = motionQuery.matches;
  var onMotionChange = (event) => {
    reduceMotion = event.matches;
  };
  if (typeof motionQuery.addEventListener === "function") motionQuery.addEventListener("change", onMotionChange);
  else if (typeof motionQuery.addListener === "function") motionQuery.addListener(onMotionChange);

  // src/core/state.js
  var LIGHT_ANSI = {
    black: "#2b231c",
    red: "#9c3a2a",
    green: "#4c6b2f",
    yellow: "#8a6a1c",
    blue: "#2f5277",
    magenta: "#7b3f6e",
    cyan: "#2e6b6a",
    white: "#7d7060",
    lightBlack: "#6e6153",
    lightRed: "#b0452a",
    lightGreen: "#557a33",
    lightYellow: "#94701a",
    lightBlue: "#3a6491",
    lightMagenta: "#8c4a7e",
    lightCyan: "#317876",
    lightWhite: "#5b4f43"
  };
  var NIGHT_ANSI = {
    black: "#2a2b42",
    red: "#d88a9a",
    green: "#9cc3a4",
    yellow: "#e2cf9a",
    blue: "#8ea8e0",
    magenta: "#b79ce0",
    cyan: "#8cc8d6",
    white: "#c9cadf",
    lightBlack: "#6f7192",
    lightRed: "#eba5b3",
    lightGreen: "#b4d8bc",
    lightYellow: "#efdfb2",
    lightBlue: "#aac0ef",
    lightMagenta: "#cbb5ef",
    lightCyan: "#a8dbe6",
    lightWhite: "#f0f0fa"
  };
  var LIGHT_INK = {
    ink: "#2a2019",
    inkMuted: "#6b5f52",
    inkFaint: "#8a7d6b",
    cursor: "#3a2c20",
    selection: "rgba(52, 64, 112, 0.2)"
  };
  var DARK_INK = {
    ink: "#ece6db",
    inkMuted: "#aaa193",
    inkFaint: "#7a7165",
    cursor: "#f2eadb",
    selection: "rgba(196, 188, 255, 0.20)"
  };
  function paperVariant(id, name2, appearance, paper2, ink, surface) {
    return { id, name: name2, appearance, paper: paper2, surface, ansi: appearance === "dark" ? NIGHT_ANSI : LIGHT_ANSI, ...ink };
  }
  function paperEntry(id, name2, nativeAppearance, surface, light, dark) {
    const lightVariant = paperVariant(id, name2, "light", light.paper, { ...LIGHT_INK, ...light }, surface);
    const darkVariant = paperVariant(id, name2, "dark", dark.paper, { ...DARK_INK, ...dark }, surface);
    return {
      ...nativeAppearance === "dark" ? darkVariant : lightVariant,
      id,
      name: name2,
      nativeAppearance,
      variants: { light: lightVariant, dark: darkVariant }
    };
  }
  var PAPERS = {
    cotton: paperEntry(
      "cotton",
      "Cotton",
      "light",
      { crinkle: 0.3, felt: 1, laid: 0, linen: 0, mottle: 0.08, age: 0 },
      { paper: "#eee6d5" },
      { paper: "#26231e", ink: "#eee6d8", inkMuted: "#aaa08f", inkFaint: "#796f61" }
    ),
    laid: paperEntry(
      "laid",
      "Laid",
      "light",
      { crinkle: 0.22, felt: 0, laid: 1, linen: 0, mottle: 0.18, age: 0 },
      { paper: "#f1e9d6" },
      { paper: "#29251d", ink: "#efe6d4", inkMuted: "#ad9f87", inkFaint: "#796d5b" }
    ),
    linen: paperEntry(
      "linen",
      "Linen",
      "light",
      { crinkle: 0.2, felt: 0, laid: 0, linen: 1, mottle: 0.08, age: 0 },
      { paper: "#ebe5d8" },
      { paper: "#24231f", ink: "#ebe7da", inkMuted: "#a7a191", inkFaint: "#716b5f" }
    ),
    onionskin: paperEntry(
      "onionskin",
      "Onionskin",
      "light",
      { crinkle: 0.08, felt: 0, laid: 0, linen: 0, mottle: 0.04, age: 0 },
      { paper: "#f2f1ea" },
      { paper: "#232325", ink: "#e9e7e2", inkMuted: "#a8a49e", inkFaint: "#74716c" }
    ),
    parchment: paperEntry(
      "parchment",
      "Parchment",
      "light",
      { crinkle: 0.25, felt: 0, laid: 0, linen: 0, mottle: 1, age: 0.75 },
      { paper: "#efdfbd" },
      { paper: "#2d2419", ink: "#efe2c8", inkMuted: "#b29c7b", inkFaint: "#7d6b53" }
    ),
    night: paperEntry(
      "night",
      "Night",
      "dark",
      { crinkle: 0.3, felt: 0, laid: 0, linen: 0, mottle: 0.1, age: 0 },
      { paper: "#e9e6f0", ink: "#282435", inkMuted: "#655f78", inkFaint: "#948da5", cursor: "#312b45", selection: "rgba(112,96,160,.22)" },
      { paper: "#1d1a20", ink: "#e6e1ea", inkMuted: "#9a94a6", inkFaint: "#6f7192", cursor: "#e9e7ff", selection: "rgba(196,188,255,.20)" }
    )
  };
  var PAPER_APPEARANCE = "light";
  function setPaperAppearance(appearance) {
    PAPER_APPEARANCE = appearance === "dark" ? "dark" : "light";
  }
  function paperFor(id) {
    const base = PAPERS[id] || PAPERS.parchment;
    return base.variants[PAPER_APPEARANCE];
  }
  var THEMES = {
    "paper-and-ink": {
      selection: "rgba(176,138,74,.30)",
      palette: {
        room: "#241a14",
        roomEdge: "#070504",
        paper: "#f4ecdb",
        paperEdge: "#e1d1b0",
        ink: "#2b231c",
        inkMuted: "#6e6153",
        inkFaint: "#a89a85",
        accent: "#b08a4a",
        accentSoft: "#d9c08a",
        border: "#c9b48e"
      },
      light: { source: "carriage", color: "#ffd29a", position: { x: 0.5, y: 1 }, shade: 0.42 },
      atmosphere: { particles: 0.1, filmGrain: 0.08, vignette: 0.35 }
    },
    "midnight-study": {
      selection: "rgba(201,164,92,.30)",
      palette: {
        room: "#140f0b",
        roomEdge: "#030202",
        paper: "#1c1714",
        paperEdge: "#2c241e",
        ink: "#eadfc8",
        inkMuted: "#a39580",
        inkFaint: "#6b5f52",
        accent: "#c9a45c",
        accentSoft: "#8a6f3d",
        border: "#3a2f27"
      },
      light: { source: "desk-lamp", color: "#ffb35c", position: { x: 0.84, y: 0.04 }, shade: 0.5 },
      atmosphere: { particles: 0.2, filmGrain: 0.12, vignette: 0.6 }
    },
    "moonlit-poetry": {
      selection: "rgba(160,168,214,.28)",
      palette: {
        room: "#0e0e1a",
        roomEdge: "#030307",
        paper: "#171826",
        paperEdge: "#26283e",
        ink: "#dcdcec",
        inkMuted: "#9496b4",
        inkFaint: "#5c5e7c",
        accent: "#b7bdd6",
        accentSoft: "#6e7396",
        border: "#2c2e48"
      },
      light: { source: "moonlight", color: "#c9d4ff", position: { x: 0.14, y: -0.1 }, shade: 0.48 },
      atmosphere: { particles: 0.35, filmGrain: 0.1, vignette: 0.55 }
    }
  };
  var SETTINGS = {
    theme: "paper-and-ink",
    paper: "parchment",
    lamp: true,
    enabled: true,
    // 诊断默认关闭；显式开启后才扫描 DOM、记录卡顿和采样 GPU。
    diagnostics: false,
    // 环境颗粒与尘埃默认静态；需要连续动画时再显式开启。
    ambientMotion: false,
    intensity: 1.1,
    spread: 74,
    beam: "pointed",
    aim: 0,
    reach: 1,
    softness: 0.65,
    bloom: 0.25,
    grain: 0.1,
    cursorGlow: 0.35,
    paperIllumination: 0.72,
    particles: 0.45,
    texture: 1,
    cursorMode: "ink",
    // auto：探测到别的皮肤在改同一批 token 时，只叠纸与灯，不去抢它的配色
    coexist: "auto",
    // 滚条：上游三形态（纸夹 / 细杆 / 原生），纸夹另有四种金属
    scrollbar: { style: "clip", finish: "silver", barWidth: 6, barOpacity: 0.45 },
    // 窗光自成一组：上游的 Studio 里窗格数、斜度、柔边都是独立参数，
    // 不能借台灯的 softness（借了就是一团糊，达不到截图里那种 3×2 的方窗）。
    window: { x: 0.5, y: 0.5, columns: 3, rows: 2, softness: 0.15, slant: 0 }
  };
  var theme = () => THEMES[SETTINGS.theme];
  var paper = () => paperFor(SETTINGS.paper);
  function washColor() {
    const p = paper();
    const t = theme();
    return p.appearance === "dark" ? p.selection : t.selection || p.selection;
  }
  function surfaceColor(amount) {
    const base = toUnit(paper().paper);
    const ink = toUnit(paper().ink);
    const mixed = [0, 1, 2].map((i) => Math.round((base[i] * (1 - amount) + ink[i] * amount) * 255));
    return "#" + mixed.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
  }
  var NOCTURNE_DEFAULTS = JSON.parse(JSON.stringify(SETTINGS));

  // src/core/light-model.js
  var barHalfWidth = (w, h2) => Math.min(16, Math.max(4, 0.04 * Math.min(w, h2)));
  function between(offset, cell, bar, soft) {
    const t = offset / cell;
    return smoothstep(bar - soft, bar + soft, Math.abs(t - Math.round(t)) * cell);
  }
  function windowGobo(rig, x, y) {
    const w = rig.window;
    const soft = Math.max(0.5, w.softness);
    const sx = x - (y - w.y) * w.skew;
    const dx = sx - w.x;
    const dy = y - w.y;
    const across = smoothstep(-soft, soft, w.width / 2 - Math.abs(dx));
    const down = smoothstep(-soft, soft, w.height / 2 - Math.abs(dy));
    const paneW = w.width / w.columns;
    const paneH = w.height / w.rows;
    const bar = barHalfWidth(paneW, paneH);
    const open = between(dx + w.width / 2, paneW, bar, soft) * between(dy + w.height / 2, paneH, bar, soft);
    return across * down * (0.3 + 0.7 * open);
  }
  function irradiance(rig, x, y, normal) {
    const n = normal || [0, 0, 1];
    if (rig.source === "moonlight") {
      return Math.max(0, dot3(n, [-rig.direction[0], -rig.direction[1], -rig.direction[2]])) * windowGobo(rig, x, y);
    }
    const d = [x - rig.position[0], y - rig.position[1], -rig.position[2]];
    const d2 = Math.max(1, dot3(d, d));
    const ray = norm(d);
    const cone = smoothstep(rig.cosOuter, rig.cosInner, dot3(ray, rig.direction));
    const lambert = Math.max(0, -dot3(n, ray));
    return cone * lambert / d2;
  }
  var toneMap = (v) => 1 - Math.exp(-Math.max(0, v));
  var lightAmount = (rig, x, y, n) => toneMap(irradiance(rig, x, y, n) * rig.exposure);
  function referenceExposure(rig, x, y) {
    const E = irradiance(rig, x, y);
    return E > 0 ? SETTINGS.intensity / E : 0;
  }
  function buildRig(sheet, caretSheetX) {
    const width = sheet.width;
    const height = sheet.height;
    const halfAngle = Math.acos(spreadToCosine(SETTINGS.spread));
    const cosOuter = Math.cos(halfAngle);
    const cosInner = Math.cos(halfAngle * (1 - 0.85 * SETTINGS.softness));
    const source = theme().light.source;
    const base = {
      source,
      position: [0, 0, 1],
      direction: [0, 0, -1],
      cosOuter,
      cosInner,
      exposure: 1,
      window: { x: width / 2, y: height / 2, width, height, columns: 3, rows: 2, softness: 8, skew: 0 }
    };
    const swivel = clamp(SETTINGS.aim, -45, 45) * Math.PI / 180;
    if (source === "carriage") {
      const centre = width / 2;
      const lampX = clamp(centre + (caretSheetX - centre) * 0.3, 40, width - 40);
      const lampY = height - Math.max(18, height * 0.03);
      const lamp = [lampX, lampY, 12 + 0.02 * height];
      const throwLength = 0.6 * SETTINGS.reach * height;
      const aim = [lampX + Math.tan(swivel) * throwLength, lampY - throwLength, 0];
      const rig2 = Object.assign({}, base, {
        position: lamp,
        direction: norm([aim[0] - lamp[0], aim[1] - lamp[1], aim[2] - lamp[2]])
      });
      const refLength = 0.5 * SETTINGS.reach * height;
      const ref2 = [lampX + Math.tan(swivel) * refLength, lampY - refLength];
      rig2.exposure = referenceExposure(rig2, ref2[0], ref2[1]);
      return rig2;
    }
    if (source === "desk-lamp") {
      const pos2 = theme().light.position;
      const lamp = [pos2.x * width, pos2.y * height, (0.3 + 0.4 * SETTINGS.reach) * height];
      const dx = width * 0.5 - lamp[0];
      const dy = height * 0.55 - lamp[1];
      const cos = Math.cos(swivel), sin = Math.sin(swivel);
      const aim = [lamp[0] + dx * cos - dy * sin, lamp[1] + dx * sin + dy * cos, 0];
      const rig2 = Object.assign({}, base, {
        position: lamp,
        direction: norm([aim[0] - lamp[0], aim[1] - lamp[1], aim[2] - lamp[2]])
      });
      rig2.exposure = referenceExposure(rig2, aim[0], aim[1]);
      return rig2;
    }
    const pos = theme().light.position;
    const azimuth = Math.atan2(0.5 - pos.y, 0.5 - pos.x) + swivel;
    const elevation = 40 * Math.PI / 180;
    const direction = norm([
      Math.cos(azimuth) * Math.cos(elevation),
      Math.sin(azimuth) * Math.cos(elevation),
      -Math.sin(elevation)
    ]);
    const frame = SETTINGS.window;
    const pane = Math.max(60, Math.min(width * 0.62, height * 0.7) * SETTINGS.reach / 2);
    const rig = Object.assign({}, base, {
      direction,
      window: {
        x: width * frame.x,
        y: height * frame.y,
        width: pane * frame.columns,
        height: pane * frame.rows,
        columns: frame.columns,
        rows: frame.rows,
        softness: 4 + 40 * frame.softness,
        skew: Math.tan(clamp(frame.slant, -35, 35) * Math.PI / 180)
      }
    });
    const ref = Math.max(0, -direction[2]);
    rig.exposure = ref > 0 ? SETTINGS.intensity / ref : 0;
    return rig;
  }
  function ambientLevel() {
    const p = paper();
    const floor = p.appearance === "light" ? 0.64 : 0.68;
    return Math.min(1, Math.max(floor, 1 - theme().light.shade * (0.55 + 0.45 * SETTINGS.intensity)));
  }

  // src/core/shaders.js
  var VERTEX = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
  var NOISE = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
`;
  var SURFACE = `#version 300 es
precision highp float;
uniform vec2 uSize; uniform float uScale; uniform float uSeed; uniform float uFold; uniform float uFelt;
uniform float uAge; uniform float uMottle; uniform float uCrinkle; uniform float uLaid; uniform float uLinen;
uniform float uPaper; uniform float uTexture;
layout(location = 0) out vec4 outAlbedo;
layout(location = 1) out vec4 outNormal;
${NOISE}
const mat2 TURN = mat2(0.8, -0.6, 0.6, 0.8);
float relief(vec2 p) {
  vec2 q = p / uPaper;
  vec2 w = vec2(fbm(q * 0.012 + uSeed), fbm(q * 0.012 + uSeed + 9.2));
  float veins = 1.0 - abs(fbm(q * 0.02 + w * 3.0) * 2.0 - 1.0);
  float r = 0.35 * pow(veins, 6.0) + 0.35 * noise(q * vec2(0.6, 0.18)) + 0.3 * noise(p * 1.9);
  if (uFelt > 0.0) {
    vec2 q = TURN * p;
    float tooth = 0.62 * noise(q * 0.45) + 0.38 * noise(TURN * q * 0.95 + 5.3);
    float felt = 0.7 * tooth + 0.2 * noise(q * 0.11 + 2.1) + 0.1 * noise(q * vec2(0.5, 0.12));
    r = mix(r, felt, uFelt);
  }
  float laidLines = 0.5 + 0.5 * sin(p.y * 6.2831 / 4.2);
  float chain = exp(-pow((mod(p.x, 96.0) - 48.0) / 3.2, 2.0));
  r = mix(r, r * 0.6 + laidLines * 0.18 + chain * 0.35, uLaid);
  float weave = 0.5 + 0.5 * sin(p.x * 6.2831 / 3.4) * sin(p.y * 6.2831 / 3.4);
  float slub = noise(p * vec2(0.07, 1.3));
  return mix(r, r * 0.3 + weave * 0.5 + slub * 0.35, uLinen);
}
vec3 albedo(vec2 p) {
  vec2 uv = p / uSize;
  vec2 q = p / uPaper;
  float mottle = fbm(q * 0.006 + uSeed) * 0.65 + fbm(q * 0.022 + uSeed * 2.0) * 0.35;
  vec3 tint = mix(vec3(1.0, 0.985, 0.95), vec3(0.86, 0.74, 0.55), smoothstep(0.35, 0.8, mottle) * 0.85);
  vec3 base = mix(vec3(1.0), tint, uMottle);
  vec3 tone = vec3(1.0);
  float edge = min(min(uv.x, 1.0 - uv.x) * uSize.x, uv.y * uSize.y);
  float ragged = edge + (fbm(q * 0.05 + 3.0) - 0.5) * 26.0;
  tone *= mix(vec3(1.0), vec3(0.62, 0.45, 0.28), (1.0 - smoothstep(0.0, 46.0, ragged)) * 0.85);
  vec2 cell = floor(p / 70.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = cell + vec2(float(i), float(j));
      if (hash12(c + uSeed) > 0.16) continue;
      vec2 centre = (c + vec2(hash12(c + 1.7), hash12(c + 4.1))) * 70.0;
      float radius = mix(1.5, 6.5, hash12(c + 8.3));
      float spot = 1.0 - smoothstep(radius * 0.4, radius * 2.4, length(p - centre));
      tone *= mix(vec3(1.0), vec3(0.8, 0.62, 0.45), spot * 0.7);
    }
  }
  float tide = smoothstep(0.015, 0.0, abs(fbm(q * 0.004 + uSeed + 31.0) - 0.58));
  tone *= mix(vec3(1.0), vec3(0.82, 0.7, 0.52), tide * 0.35);
  float fold = (p.y - uFold) / 2.5;
  tone *= 1.0 - 0.08 * exp(-fold * fold) + 0.03 * exp(-(fold - 2.2) * (fold - 2.2));
  float chainTone = exp(-pow((mod(p.x, 96.0) - 48.0) / 3.2, 2.0));
  base *= 1.0 - uLaid * uTexture * (0.03 * chainTone + 0.005 * (0.5 + 0.5 * sin(p.y * 6.2831 / 4.2)));
  base *= 1.0 - uLinen * uTexture * 0.02 * (0.5 + 0.5 * sin(p.x * 6.2831 / 3.4) * sin(p.y * 6.2831 / 3.4));
  if (uFelt > 0.0) {
    vec2 q = TURN * p;
    float threads = smoothstep(0.86, 0.97, noise(q * vec2(0.06, 1.1) + uSeed));
    threads += smoothstep(0.86, 0.97, noise(TURN * q * vec2(1.1, 0.06) + 3.0));
    base *= 1.0 - uFelt * uTexture * 0.035 * min(1.0, threads);
  }
  return base * mix(vec3(1.0), tone, uAge);
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  float e = 0.9;
  float h0 = relief(p);
  float slope = 1.2 + 3.0 * uCrinkle;
  // 纸纹深度只做一件事：整体缩放起伏的振幅。
  // 早先它只乘在 laid/linen/crinkle 上，共用的基础噪声不乘——于是调低之后，
  // 每张纸自己的帘线、布纹先被抹掉，剩下的都是同一层噪声，六张纸看起来全成了葱皮纸。
  float amp = uTexture;
  vec3 n = normalize(vec3(-(relief(p + vec2(e, 0.0)) - h0) * slope * amp, -(relief(p + vec2(0.0, e)) - h0) * slope * amp, 1.0));
  outAlbedo = vec4(albedo(p), 1.0);
  outNormal = vec4(n.xy * 0.5 + 0.5, 0.0, 1.0);
}`;
  var LIGHT = `#version 300 es
precision highp float;
uniform sampler2D uAlbedo; uniform sampler2D uNormal;
uniform vec2 uSize; uniform float uScale; uniform int uSource;
uniform vec3 uLightPos; uniform vec3 uLightDir; uniform vec2 uCone; uniform float uExposure;
uniform vec4 uWindow; uniform vec4 uPanes; uniform vec3 uTint; uniform float uLamp;
uniform float uAmbient; uniform vec3 uAmbientTint; uniform float uRelief; uniform float uCrinkle;
uniform float uGrain; uniform float uTime; uniform float uSoft;
out vec4 outColor;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float between(float offset, float cell, float bar, float soft) {
  float t = offset / cell;
  return smoothstep(bar - soft, bar + soft, abs(t - round(t)) * cell);
}
float gobo(vec2 p) {
  float soft = max(0.5, uPanes.z);
  p.x -= (p.y - uWindow.y) * uPanes.w;
  vec2 d = p - uWindow.xy;
  vec2 inside = smoothstep(-soft, soft, uWindow.zw * 0.5 - abs(d));
  vec2 pane = uWindow.zw / uPanes.xy;
  float bar = clamp(0.04 * min(pane.x, pane.y), 4.0, 16.0);
  float open = between(d.x + uWindow.z * 0.5, pane.x, bar, soft) * between(d.y + uWindow.w * 0.5, pane.y, bar, soft);
  return inside.x * inside.y * (0.3 + 0.7 * open);
}
const float BULB = 30.0;
float irradiance(vec3 P, vec3 n) {
  if (uSource == 2) return max(0.0, dot(n, -uLightDir)) * gobo(P.xy);
  vec3 d = P - uLightPos; float d2 = max(1.0, dot(d, d)); vec3 r = d * inversesqrt(d2);
  float near = uSoft * (1.0 - smoothstep(0.0, 260.0, sqrt(d2)));
  float cone = smoothstep(uCone.x - 0.3 * near, uCone.y, dot(r, uLightDir));
  return cone * max(0.0, -dot(n, r)) / (d2 + uSoft * BULB * BULB);
}
void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec3 albedo = texelFetch(uAlbedo, texel, 0).rgb;
  vec2 nxy = texelFetch(uNormal, texel, 0).xy * 2.0 - 1.0;
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uScale - gl_FragCoord.y) / uScale;
  float lit = (1.0 - exp(-irradiance(vec3(p, 0.0), vec3(0.0, 0.0, 1.0)) * uExposure)) * uLamp;
  vec2 uv = p / uSize;
  float vignette = smoothstep(0.15, 1.1, length((uv - vec2(0.5, 0.55)) * vec2(1.0, 1.15)));
  float ambient = mix(1.0, uAmbient * (1.0 - 0.3 * vignette), uLamp);
  vec3 irr = uAmbientTint * ambient + (1.0 - ambient) * lit * uTint;
  float relief = uRelief * (1.0 - 0.4 * lit);
  float bound = (0.16 * uCrinkle + 0.04) * relief;
  irr *= clamp(1.0 + (-nxy.x * 0.35 - nxy.y * 0.55) * (0.6 + 2.2 * uCrinkle) * relief, 1.0 - bound, 1.0 + bound);
  irr *= mix(0.9, 1.0, smoothstep(0.0, 28.0, min(uv.x, 1.0 - uv.x) * uSize.x));
  float g = hash12(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5;
  outColor = vec4(clamp(albedo * irr + g * (uGrain * 0.045 + 1.5 / 255.0), 0.0, 1.0), 1.0);
}`;

  // src/core/paper-light.js
  var PaperLight = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext("webgl2", { premultipliedAlpha: false, antialias: false });
      this.state = this.gl ? "initializing" : "failed";
      this.spec = null;
      this.textures = [];
      this.framebuffer = null;
      this.buffer = null;
      if (this.gl) this.initialize();
    }
    /** 创建全部与 WebGL context 同寿命的资源。上下文恢复后必须完整重跑。 */
    initialize() {
      try {
        this.surfaceProgram = this.program(SURFACE);
        this.lightProgram = this.program(LIGHT);
        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.su = this.locate(this.surfaceProgram, ["uSize", "uScale", "uSeed", "uFold", "uFelt", "uAge", "uMottle", "uCrinkle", "uLaid", "uLinen", "uPaper", "uTexture"]);
        this.lu = this.locate(this.lightProgram, ["uAlbedo", "uNormal", "uSize", "uScale", "uSource", "uLightPos", "uLightDir", "uCone", "uExposure", "uWindow", "uPanes", "uTint", "uLamp", "uAmbient", "uAmbientTint", "uRelief", "uCrinkle", "uGrain", "uTime", "uSoft"]);
        this.state = "ready";
        return true;
      } catch (error) {
        console.warn("paper light disabled:", error.message);
        this.state = "failed";
        return false;
      }
    }
    invalidate() {
      this.spec = null;
      this.textures = [];
      this.framebuffer = null;
      this.buffer = null;
      this.state = "lost";
    }
    restore() {
      if (!this.gl) {
        this.state = "failed";
        return false;
      }
      this.invalidate();
      return this.initialize();
    }
    program(fragment) {
      const gl = this.gl;
      const program = gl.createProgram();
      const sources = [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, fragment]];
      for (const pair of sources) {
        const shader = gl.createShader(pair[0]);
        gl.shaderSource(shader, pair[1]);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader);
      }
      gl.bindAttribLocation(program, 0, "aPos");
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      return program;
    }
    locate(program, names) {
      const out = {};
      for (const name2 of names) out[name2] = this.gl.getUniformLocation(program, name2);
      return out;
    }
    build(spec) {
      const gl = this.gl;
      if (this.state !== "ready") return;
      const paperDef = spec.p;
      const width = Math.max(1, Math.round(spec.width * spec.pixelRatio));
      const height = Math.max(1, Math.round(spec.height * spec.pixelRatio));
      this.canvas.width = width;
      this.canvas.height = height;
      this.spec = spec;
      this.release();
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      for (let i = 0; i < 2; i++) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
        this.textures.push(texture);
      }
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      this.framebuffer = framebuffer;
      const u = this.su;
      gl.useProgram(this.surfaceProgram);
      gl.viewport(0, 0, width, height);
      gl.uniform2f(u.uSize, spec.width, spec.height);
      gl.uniform1f(u.uScale, spec.pixelRatio);
      gl.uniform1f(u.uSeed, 3.7);
      gl.uniform1f(u.uFold, spec.height * 0.38);
      gl.uniform1f(u.uPaper, clamp(Math.sqrt(spec.width * spec.height) / 700, 0.9, 1.9));
      gl.uniform1f(u.uTexture, SETTINGS.texture);
      gl.uniform1f(u.uFelt, paperDef.surface.felt);
      gl.uniform1f(u.uAge, paperDef.surface.age);
      gl.uniform1f(u.uMottle, paperDef.surface.mottle);
      gl.uniform1f(u.uCrinkle, paperDef.surface.crinkle);
      gl.uniform1f(u.uLaid, paperDef.surface.laid);
      gl.uniform1f(u.uLinen, paperDef.surface.linen);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    render(rig, paperDef, time) {
      const gl = this.gl;
      const u = this.lu;
      if (!this.spec || this.state !== "ready" || gl.isContextLost()) return;
      const lightColor = toUnit(theme().light.color);
      const peak = Math.max(lightColor[0], lightColor[1], lightColor[2], 1e-6);
      const room = toUnit(theme().palette.room);
      const strength = rig.source === "moonlight" ? 0.75 : 0.4;
      const tintChannel = (c) => 1 + (0.6 + c * 1.5 - 1) * strength;
      gl.useProgram(this.lightProgram);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
      gl.uniform1i(u.uAlbedo, 0);
      gl.uniform1i(u.uNormal, 1);
      gl.uniform2f(u.uSize, this.spec.width, this.spec.height);
      gl.uniform1f(u.uScale, this.spec.pixelRatio);
      gl.uniform1i(u.uSource, { carriage: 0, "desk-lamp": 1, moonlight: 2 }[rig.source]);
      gl.uniform3fv(u.uLightPos, rig.position);
      gl.uniform3fv(u.uLightDir, rig.direction);
      gl.uniform2f(u.uCone, rig.cosOuter, rig.cosInner);
      gl.uniform1f(u.uExposure, rig.exposure);
      gl.uniform4f(u.uWindow, rig.window.x, rig.window.y, rig.window.width, rig.window.height);
      gl.uniform4f(u.uPanes, rig.window.columns, rig.window.rows, rig.window.softness, rig.window.skew);
      gl.uniform3f(u.uTint, lightColor[0] / peak, lightColor[1] / peak, lightColor[2] / peak);
      gl.uniform1f(u.uLamp, SETTINGS.lamp && SETTINGS.enabled ? 1 : 0);
      gl.uniform1f(u.uAmbient, ambientLevel());
      gl.uniform3f(u.uAmbientTint, tintChannel(room[0]), tintChannel(room[1]), tintChannel(room[2]));
      gl.uniform1f(u.uRelief, 2 * SETTINGS.paperIllumination);
      gl.uniform1f(u.uSoft, SETTINGS.beam === "soft" ? 1 : 0);
      gl.uniform1f(u.uCrinkle, paperDef.surface.crinkle);
      gl.uniform1f(u.uGrain, reduceMotion ? 0 : SETTINGS.grain);
      gl.uniform1f(u.uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    release() {
      if (!this.gl) return;
      this.textures.forEach((texture) => this.gl.deleteTexture(texture));
      this.textures = [];
      if (this.framebuffer) {
        this.gl.deleteFramebuffer(this.framebuffer);
        this.framebuffer = null;
      }
    }
    destroy() {
      this.release();
      if (this.buffer) this.gl.deleteBuffer(this.buffer);
      if (this.surfaceProgram) this.gl.deleteProgram(this.surfaceProgram);
      if (this.lightProgram) this.gl.deleteProgram(this.lightProgram);
      this.buffer = null;
      this.spec = null;
      this.state = "disposed";
    }
  };

  // src/core/glow-layer.js
  var MOTE_HASH = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  var MOTES = Array.from({ length: 110 }, (_, i) => ({
    x: MOTE_HASH(i * 3.1),
    y: MOTE_HASH(i * 7.7),
    z: MOTE_HASH(i * 1.9),
    phase: MOTE_HASH(i * 5.3) * 100,
    size: 0.5 + MOTE_HASH(i * 9.1) * 1.6
  }));
  var wrap01 = (v) => (v % 1 + 1) % 1;
  var POOL_COLUMNS = 192;
  function poolStrength(rig, appearance) {
    if (appearance === "dark") return 1;
    if (rig.source === "moonlight") return 0.2;
    return rig.source === "desk-lamp" ? 0.1 : 0;
  }
  function poolColor(appearance) {
    const light = toUnit(theme().light.color).map((c) => Math.round(c * 255));
    return appearance === "dark" ? light.map((c) => Math.round(c * 0.34)) : light;
  }
  var GlowLayer = class {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d");
      this.width = 0;
      this.height = 0;
      this.pixelRatio = 1;
      this.pool = document.createElement("canvas");
      this.soft = document.createElement("canvas");
      this.bloom = document.createElement("canvas");
      this.poolKey = "";
      this.sprite = document.createElement("canvas");
      this.sprite.width = this.sprite.height = 32;
      const s = this.sprite.getContext("2d");
      const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.22, "rgba(255,255,255,.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      s.fillStyle = g;
      s.fillRect(0, 0, 32, 32);
    }
    resize(width, height, pixelRatio) {
      if (this.width === width && this.height === height && this.pixelRatio === pixelRatio) return;
      this.width = width;
      this.height = height;
      this.pixelRatio = pixelRatio;
      this.canvas.width = Math.max(1, Math.round(width * pixelRatio));
      this.canvas.height = Math.max(1, Math.round(height * pixelRatio));
      this.poolKey = "";
    }
    ensurePool(rig, rgb) {
      const key = JSON.stringify([rig.position, rig.direction, rig.cosOuter, rig.cosInner, rig.exposure, rig.window, rgb, this.width, this.height]);
      if (key === this.poolKey) return;
      this.poolKey = key;
      const columns = POOL_COLUMNS;
      const rows = Math.max(8, Math.round(columns * this.height / Math.max(1, this.width)));
      const channels = rgb.split(",").map(Number);
      for (const target of [this.pool, this.soft, this.bloom]) {
        target.width = columns;
        target.height = rows;
      }
      const poolCtx = this.pool.getContext("2d");
      const softCtx = this.soft.getContext("2d");
      const bloomCtx = this.bloom.getContext("2d");
      const image = poolCtx.createImageData(columns, rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < columns; i++) {
          const lit = lightAmount(rig, (i + 0.5) / columns * this.width, (j + 0.5) / rows * this.height);
          const k = (j * columns + i) * 4;
          image.data[k] = channels[0];
          image.data[k + 1] = channels[1];
          image.data[k + 2] = channels[2];
          image.data[k + 3] = Math.round(Math.min(1, lit) * 255);
        }
      }
      poolCtx.putImageData(image, 0, 0);
      softCtx.filter = "blur(1px)";
      softCtx.drawImage(this.pool, 0, 0);
      softCtx.filter = "none";
      bloomCtx.filter = "blur(6px)";
      bloomCtx.drawImage(this.pool, 0, 0);
      bloomCtx.filter = "none";
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
        c.imageSmoothingQuality = "high";
        c.globalAlpha = pool;
        c.drawImage(this.soft, 0, 0, this.width, this.height);
        c.globalAlpha = pool * (frame.appearance === "dark" ? 0.4 : 0.8);
        c.drawImage(this.bloom, 0, 0, this.width, this.height);
        c.globalAlpha = 1;
      }
      if (rig.source === "desk-lamp") {
        const x = rig.position[0], y = rig.position[1];
        const radius = Math.max(1, this.height * 0.55);
        const spill = c.createRadialGradient(x, y, 0, x, y, radius);
        spill.addColorStop(0, "rgba(" + frame.rgb + ", " + (frame.appearance === "light" ? 0.1 : 0.16) + ")");
        spill.addColorStop(1, "rgba(" + frame.rgb + ", 0)");
        c.fillStyle = spill;
        c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      if (frame.particles > 0) {
        const count = Math.round(MOTES.length * frame.particles);
        const strength = frame.appearance === "light" ? 0.5 : 0.9;
        for (let i = 0; i < count; i++) {
          const m = MOTES[i];
          const speed = 0.4 + m.z;
          const drift = Math.sin(frame.time * 0.05 * speed + m.phase) * 0.04 + frame.time * 4e-3 * (m.z - 0.5);
          const fall = -frame.time * 6e-3 * speed + Math.cos(frame.time * 0.07 + m.phase) * 0.03;
          const x = wrap01(m.x + drift) * this.width;
          const y = wrap01(m.y + fall) * this.height;
          const lit = lightAmount(rig, x, y);
          if (lit < 0.05) continue;
          const twinkle = 0.5 + 0.5 * Math.sin(frame.time * (0.8 + m.z * 2.2) + m.phase);
          const size = m.size * (1 + m.z * 1.6);
          c.globalAlpha = Math.min(1, lit * twinkle * strength);
          c.drawImage(this.sprite, x - size * 2, y - size * 2, size * 4, size * 4);
        }
        c.globalAlpha = 1;
      }
      if (rig.source === "carriage") {
        const x = rig.position[0], y = rig.position[1];
        const radius = Math.max(1, 110 * frame.intensity);
        const glare = c.createRadialGradient(x, y, 0, x, y, radius);
        glare.addColorStop(0, "rgba(" + frame.rgb + ", " + (frame.appearance === "light" ? 0.26 : 0.45) + ")");
        glare.addColorStop(1, "rgba(" + frame.rgb + ", 0)");
        c.fillStyle = glare;
        c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      if (frame.cursor && frame.cursorGlow > 0) {
        const x = frame.cursor.x, y = frame.cursor.y;
        const glow = c.createRadialGradient(x, y, 0, x, y, 34);
        glow.addColorStop(0, "rgba(" + frame.rgb + ", " + (0.4 * frame.cursorGlow).toFixed(3) + ")");
        glow.addColorStop(1, "rgba(" + frame.rgb + ", 0)");
        c.fillStyle = glow;
        c.fillRect(x - 34, y - 34, 68, 68);
      }
    }
  };

  // src/core/quill.js
  var Q_VIEW = { left: 4, top: 74, width: 64, height: 78 };
  var Q_LINES = 1.15;
  var Q_NIB = { x: 0.15, y: 0.84 };
  var Q_LEAN = 35;
  var qRound = (value) => Number(value.toFixed(2));
  function curveThrough(points) {
    let d = "";
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const c1 = [qRound(p1[0] + (p2[0] - p0[0]) / 6), qRound(p1[1] + (p2[1] - p0[1]) / 6)];
      const c2 = [qRound(p2[0] - (p3[0] - p1[0]) / 6), qRound(p2[1] - (p3[1] - p1[1]) / 6)];
      d += " C" + c1[0] + " " + c1[1] + " " + c2[0] + " " + c2[1] + " " + p2[0] + " " + p2[1];
    }
    return d;
  }
  var pathThrough = (points) => "M" + points[0][0] + " " + points[0][1] + curveThrough(points);
  var Q_RACHIS = [[0, -24], [0.4, -46], [2.4, -70], [5.6, -90]];
  function qAlong(t) {
    const p0 = Q_RACHIS[0], p1 = Q_RACHIS[1], p2 = Q_RACHIS[2], p3 = Q_RACHIS[3];
    const u = 1 - t;
    const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const at = [0, 0];
    Q_RACHIS.forEach((p, i) => {
      at[0] += weights[i] * p[0];
      at[1] += weights[i] * p[1];
    });
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const length = Math.hypot(dx, dy) || 1;
    const tangent = [dx / length, dy / length];
    return { at, tangent, normal: [-tangent[1], tangent[0]] };
  }
  var Q_VANE_FROM = 0.05;
  var qGauss = (s, at, width) => Math.exp(-Math.pow((s - at) / width, 2));
  var qTrailing = (s) => 8.4 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.75)), 0.85) * (1 - 0.3 * qGauss(s, 0.42, 0.018) - 0.24 * qGauss(s, 0.67, 0.016));
  var qLeading = (s) => 3.4 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.65)), 0.9) * (1 - 0.32 * qGauss(s, 0.56, 0.02));
  function qEdge(s, side, reach) {
    const t = Q_VANE_FROM + (1 - Q_VANE_FROM) * s;
    const curve = qAlong(t);
    const width = (side > 0 ? qTrailing(s) : qLeading(s)) * (reach == null ? 1 : reach);
    return [
      qRound(curve.at[0] + curve.normal[0] * width * side + curve.tangent[0] * width * 0.38),
      qRound(curve.at[1] + curve.normal[1] * width * side + curve.tangent[1] * width * 0.38)
    ];
  }
  var Q_SAMPLES = Array.from({ length: 61 }, (_, i) => i / 60);
  var Q_VANE = (() => {
    const leading = Q_SAMPLES.map((s) => qEdge(s, -1));
    const trailing = Q_SAMPLES.slice().reverse().map((s) => qEdge(s, 1));
    return pathThrough(leading.concat(trailing.slice(1))) + " Z";
  })();
  function qBarbs(side, count) {
    let d = "";
    for (let i = 0; i < count; i++) {
      const s = 0.04 + i / (count - 1) * 0.9;
      const curve = qAlong(Q_VANE_FROM + (1 - Q_VANE_FROM) * s);
      const end = qEdge(Math.min(1, s + 0.05), side, 0.94);
      const width = side > 0 ? qTrailing(s) : qLeading(s);
      const control = [
        qRound(curve.at[0] + curve.normal[0] * width * side * 0.55),
        qRound(curve.at[1] + curve.normal[1] * width * side * 0.55)
      ];
      d += "M" + qRound(curve.at[0]) + " " + qRound(curve.at[1]) + " Q" + control[0] + " " + control[1] + " " + end[0] + " " + end[1] + " ";
    }
    return d.trim();
  }
  var Q_TRAILING_BARBS = qBarbs(1, 30);
  var Q_LEADING_BARBS = qBarbs(-1, 22);
  var Q_RACHIS_SHAPE = (() => {
    const steps = Array.from({ length: 25 }, (_, i) => i / 24 * 0.98);
    const side = (sign) => steps.map((t) => {
      const curve = qAlong(t);
      const half = 0.62 * (1 - t) + 0.08;
      return [qRound(curve.at[0] + curve.normal[0] * half * sign), qRound(curve.at[1] + curve.normal[1] * half * sign)];
    });
    return pathThrough(side(-1).concat(side(1).reverse())) + " Z";
  })();
  var Q_RACHIS_LINE = "M-0.15 -24 C0.25 -46 2.25 -70 5.6 -90";
  var Q_CALAMUS = "M-1.15 -10.4 C-1.2 -15 -1.05 -20 -0.82 -24.6 L0.82 -24.6 C1.05 -20 1.2 -15 1.15 -10.4 Z";
  var Q_DOWN = "M0 -25.2 q-2.6 0.5 -4.6 -1.4 M0 -26.6 q-3 -0.2 -4.8 -3.2 M0.1 -28 q-2.4 -0.9 -3.6 -4.2 M0.2 -25.4 q2.8 0.7 4.8 -0.8 M0.2 -27 q3.3 -0.1 5.2 -2.9 M0.3 -28.6 q2.7 -0.8 4 -4";
  var Q_FERRULE = "M-1.55 -9 L1.55 -9 L1.4 -11.2 L-1.4 -11.2 Z";
  var Q_NIB_PATH = "M0 0.3 C-0.6 -2 -1.9 -5.4 -1.7 -9.1 L1.7 -9.1 C1.9 -5.4 0.6 -2 0 0.3 Z";
  var Q_SLIT = "M0 -0.2 L0 -5.4";
  var Q_SHOULDERS = "M-1.5 -7.6 Q0 -8.3 1.5 -7.6";
  function buildQuill() {
    const svg = [
      '<svg viewBox="',
      -Q_VIEW.left,
      " ",
      -Q_VIEW.top,
      " ",
      Q_VIEW.width,
      " ",
      Q_VIEW.height,
      '">',
      "<defs>",
      '<linearGradient id="dn-quill-vane" x1="0" x2="1" y1="0" y2="0">',
      '<stop offset="0" stop-color="var(--dn-quill-edge)"/>',
      '<stop offset="0.3" stop-color="var(--dn-quill-sheen)"/>',
      '<stop offset="0.5" stop-color="var(--dn-quill-body)"/>',
      '<stop offset="1" stop-color="var(--dn-quill-edge)"/>',
      "</linearGradient>",
      '<linearGradient id="dn-quill-gilt" x1="0" x2="1" y1="0" y2="0">',
      '<stop offset="0" stop-color="var(--dn-metal-lo)"/>',
      '<stop offset="0.35" stop-color="var(--dn-metal-hi)"/>',
      '<stop offset="0.6" stop-color="var(--dn-metal)"/>',
      '<stop offset="1" stop-color="var(--dn-metal-lo)"/>',
      "</linearGradient>",
      '<linearGradient id="dn-quill-horn" x1="0" x2="1" y1="0" y2="0">',
      '<stop offset="0" stop-color="#8c7651"/><stop offset="0.35" stop-color="#f3e6c6"/><stop offset="1" stop-color="#a58d61"/>',
      "</linearGradient>",
      '<clipPath id="dn-quill-clip"><path d="',
      Q_VANE,
      '"/></clipPath>',
      "</defs>",
      '<g class="dn-quill-sway"><g transform="rotate(',
      Q_LEAN,
      ')">',
      '<path d="',
      Q_DOWN,
      '" class="dn-quill-down"/>',
      '<path d="',
      Q_VANE,
      '" class="dn-quill-vane"/>',
      '<g clip-path="url(#dn-quill-clip)">',
      '<path d="',
      Q_TRAILING_BARBS,
      '" class="dn-quill-barbs"/>',
      '<path d="',
      Q_LEADING_BARBS,
      '" class="dn-quill-barbs"/>',
      '<rect class="dn-quill-shine" x="-8" y="-32" width="22" height="8"/>',
      "</g>",
      '<path d="',
      Q_RACHIS_SHAPE,
      '" class="dn-quill-rachis"/>',
      '<path d="',
      Q_RACHIS_LINE,
      '" class="dn-quill-rachis-light"/>',
      '<path d="',
      Q_CALAMUS,
      '" fill="url(#dn-quill-horn)"/>',
      '<path d="',
      Q_FERRULE,
      '" fill="url(#dn-quill-gilt)"/>',
      '<path d="',
      Q_NIB_PATH,
      '" fill="url(#dn-quill-gilt)"/>',
      '<path d="',
      Q_SHOULDERS,
      '" class="dn-quill-engraving"/>',
      '<path d="',
      Q_SLIT,
      '" class="dn-quill-engraving"/>',
      '<circle cx="0" cy="-6" r="0.5" class="dn-quill-hole"/>',
      '<circle class="dn-quill-glint" cx="0.4" cy="-1.8" r="0.9"/>',
      "</g></g></svg>"
    ].join("");
    const element = document.createElement("div");
    element.className = "dn-quill";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = svg;
    return element;
  }

  // src/core/ink-caret.js
  var measureCanvas = document.createElement("canvas").getContext("2d");
  var BREATH_MS = 1700;
  var REST_MS = 650;
  var SINK = [
    { opacity: 1, offset: 0 },
    { opacity: 1, offset: 0.36, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
    { opacity: 0.08, offset: 0.62 },
    { opacity: 0.08, offset: 0.74, easing: "cubic-bezier(0.3, 0, 0.3, 1)" },
    { opacity: 1, offset: 1 }
  ];
  var SPREAD = [
    { opacity: 0, transform: "scale(1)", offset: 0 },
    { opacity: 0, transform: "scale(1)", offset: 0.36, easing: "ease-out" },
    { opacity: 0.3, transform: "scale(1.2)", offset: 0.52, easing: "ease-in" },
    { opacity: 0, transform: "scale(1.55)", offset: 0.74 },
    { opacity: 0, transform: "scale(1)", offset: 1 }
  ];
  var FRESH = [{ transform: "scale(1.12)" }, { transform: "scale(1)" }];
  var FRESH_HALO = [{ opacity: 0.35, transform: "scale(1.3)" }, { opacity: 0, transform: "scale(1)" }];
  function glyphAfter(editor, range) {
    try {
      if (!editor || !range || !editor.contains(range.startContainer)) return "";
      if (!editor.textContent) return "";
      const rest = document.createRange();
      rest.setStart(range.startContainer, range.startOffset);
      rest.setEnd(editor, editor.childNodes.length);
      const text = rest.toString();
      return text ? text.charAt(0) : "";
    } catch (error) {
      return "";
    }
  }
  function advanceOf(context, char) {
    if (!char) return 0;
    const width = context.measureText(char).width;
    return Number.isFinite(width) ? width : 0;
  }
  function isEditor(element) {
    if (!element || element.nodeType !== 1) return false;
    const tag = element.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || element.isContentEditable;
  }
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
  var InkCaret = class {
    constructor() {
      this.enabled = true;
      this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.element = document.createElement("div");
      this.element.className = "dn-caret";
      this.element.setAttribute("aria-hidden", "true");
      this.halo = document.createElement("div");
      this.halo.className = "dn-ink-halo";
      this.blot = document.createElement("div");
      this.blot.className = "dn-ink-blot";
      this.glyph = document.createElement("span");
      this.glyph.className = "dn-ink-glyph";
      this.element.append(this.halo, this.blot, this.glyph);
      this.breathing = [];
      this.inComposition = false;
      this.shown = false;
      this.editor = null;
      this.lastInkAt = 0;
      this.dirty = true;
      this.lastMeasure = 0;
      this.point = { x: 0, y: 0, height: 18 };
    }
    /** 挂到 body 上。调用方负责把它插在两个纸层之前——它必须躺在纸光之下。 */
    mount(before) {
      this.quillEl = buildQuill();
      this.mode = "ink";
      if (before && before.parentNode) {
        before.parentNode.insertBefore(this.quillEl, before);
        before.parentNode.insertBefore(this.element, before);
      } else {
        document.body.appendChild(this.quillEl);
        document.body.appendChild(this.element);
      }
      this.onSelection = () => {
        this.dirty = true;
        this.sync();
      };
      this.onKey = () => {
        this.dirty = true;
        this.ink();
      };
      this.onAny = () => {
        this.dirty = true;
      };
      this.onScroll = () => {
        this.dirty = true;
      };
      this.onCompositionStart = () => {
        this.inComposition = true;
        this.hide();
      };
      this.onCompositionEnd = () => {
        this.inComposition = false;
        this.sync();
      };
      this.onBlur = () => {
        this.hide();
      };
      document.addEventListener("selectionchange", this.onSelection);
      document.addEventListener("keydown", this.onKey, true);
      document.addEventListener("input", this.onAny, true);
      document.addEventListener("compositionstart", this.onCompositionStart, true);
      document.addEventListener("compositionend", this.onCompositionEnd, true);
      window.addEventListener("blur", this.onBlur);
      window.addEventListener("resize", this.onAny);
      window.addEventListener("scroll", this.onScroll, true);
      this.breathe();
    }
    destroy() {
      document.removeEventListener("selectionchange", this.onSelection);
      document.removeEventListener("keydown", this.onKey, true);
      document.removeEventListener("input", this.onAny, true);
      document.removeEventListener("compositionstart", this.onCompositionStart, true);
      document.removeEventListener("compositionend", this.onCompositionEnd, true);
      window.removeEventListener("blur", this.onBlur);
      window.removeEventListener("resize", this.onAny);
      window.removeEventListener("scroll", this.onScroll, true);
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
      const timing = { duration: BREATH_MS, delay: REST_MS, iterations: Infinity };
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
      this.blot.animate(FRESH, { duration: 160, easing: "ease-out" });
      this.halo.animate(FRESH_HALO, { duration: 240, easing: "ease-out" });
    }
    /** 换形态（墨迹 / 羽毛 / 原生）。要立刻生效，所以顺手把下一次测量标记为脏。 */
    setMode(mode) {
      if (mode !== "ink" && mode !== "quill" && mode !== "none") return;
      this.mode = mode;
      this.hide();
      this.dirty = true;
      this.lastMeasure = 0;
    }
    /** 把宿主的原生光标藏起来之前先确认我们的墨块在场，否则用户会看不到光标。 */
    claimNative() {
      if (!this.editor || this.editor.__dnNativeClaimed) return;
      this.editor.__dnNativeClaimed = true;
      this.editor.style.setProperty("caret-color", "transparent", "important");
    }
    releaseNative() {
      if (!this.editor || !this.editor.__dnNativeClaimed) return;
      this.editor.style.removeProperty("caret-color");
      this.editor.__dnNativeClaimed = false;
    }
    hide() {
      if (!this.shown) return;
      this.shown = false;
      this.element.style.display = "none";
      if (this.quillEl) this.quillEl.style.display = "none";
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
      if (editor.tagName === "INPUT" || editor.tagName === "TEXTAREA") {
        const box = editor.getBoundingClientRect();
        measureCanvas.font = style.fontStyle + " " + style.fontWeight + " " + fontSize + "px " + style.fontFamily;
        const caret = editor.selectionStart == null ? String(editor.value || "").length : editor.selectionStart;
        const textWidth = measureCanvas.measureText(String(editor.value || "").slice(0, caret)).width;
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.4;
        const char2 = String(editor.value || "").charAt(caret);
        return {
          x: box.left + textWidth - (editor.scrollLeft || 0),
          y: box.top + (box.height - lineHeight) / 2,
          height: lineHeight,
          fontSize,
          char: char2,
          cellWidth: char2 ? advanceOf(measureCanvas, char2) : 0,
          focused: document.hasFocus()
        };
      }
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return null;
      const range = selection.getRangeAt(0);
      if (!range.collapsed) return null;
      const rects = range.getClientRects();
      let rect = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
      if ((!rect || !rect.height && !rect.width) && selection.focusNode) {
        const probe = document.createRange();
        probe.selectNodeContents(selection.focusNode);
        rect = probe.getBoundingClientRect();
      }
      if (!rect || !rect.height) return null;
      const anchor = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
      const anchorStyle = anchor ? getComputedStyle(anchor) : style;
      const anchorSize = parseFloat(anchorStyle.fontSize) || fontSize;
      measureCanvas.font = anchorStyle.fontStyle + " " + anchorStyle.fontWeight + " " + anchorSize + "px " + anchorStyle.fontFamily;
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
      if (!this.enabled || this.inComposition) {
        this.hide();
        return null;
      }
      const editor = activeEditor();
      if (!editor) {
        this.hide();
        return null;
      }
      if (editor !== this.editor) {
        this.releaseNative();
        this.editor = editor;
        this.dirty = true;
      }
      const now = performance.now();
      if (!this.dirty && now - this.lastMeasure < 250) return this.shown ? this.point : null;
      this.dirty = false;
      this.lastMeasure = now;
      const info = this.measure(editor);
      if (!info || this.inComposition) {
        this.hide();
        return null;
      }
      if (info.y + info.height < 0 || info.y > window.innerHeight) {
        this.hide();
        return null;
      }
      if (this.mode === "none") {
        this.hide();
        return null;
      }
      if (this.mode === "quill") this.paintQuill(info);
      else this.paintInk(info);
      if (!this.shown) {
        this.shown = true;
        this.breathe();
      }
      this.claimNative();
      this.point = { x: info.x, y: info.y, height: info.height, cellWidth: info.cellWidth || info.fontSize * 0.52 };
      return this.point;
    }
    /** 墨块：一格见方的洇墨，字用纸色反白。 */
    paintInk(info) {
      const width = Math.max(6, Math.min(info.fontSize * 1.25, info.cellWidth || info.fontSize * 0.52));
      if (this.quillEl) this.quillEl.style.display = "none";
      this.element.style.display = "block";
      this.element.style.width = width.toFixed(2) + "px";
      this.element.style.height = info.height.toFixed(2) + "px";
      this.element.style.transform = "translate(" + info.x.toFixed(2) + "px, " + info.y.toFixed(2) + "px)";
      this.element.style.setProperty("--dn-ink-size", info.fontSize.toFixed(1) + "px");
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
      this.element.style.display = "none";
      this.quillEl.style.display = "block";
      this.quillEl.style.width = (Q_VIEW.width * scale).toFixed(2) + "px";
      this.quillEl.style.height = height.toFixed(2) + "px";
      this.quillEl.style.transform = "translate(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px)";
      this.quillEl.dataset.focused = String(info.focused);
      this.quillEl.dataset.appearance = paper().appearance;
    }
  };

  // src/core/scroll-clip.js
  var CLIP_WIDTH = 84;
  var CLIP_HEIGHT = 26;
  var CLIP_EDGE = 88;
  var CLIP_ON_PAPER = CLIP_WIDTH * CLIP_EDGE / 100;
  var CLIP_REST_TILT = -0.1;
  var CLIP_TRACK_MARGIN = 18;
  var CLIP_GLIDE = { frequency: 5, damping: 0.72 };
  var CLIP_TILT = { frequency: 3.2, damping: 0.35 };
  var CLIP_TILT_REST = { distance: 1e-3, speed: 2e-3 };
  var CLIP_PIXEL_REST = { distance: 0.4, speed: 12 };
  var CLIP_RIGHT_INSET = 12;
  var SPRING_SUBSTEP = 1 / 480;
  var CLIP_FINISHES = {
    silver: ["#ffffff", "#b9bfc7", "#4d535b"],
    brass: ["#fff1c6", "#c19a52", "#4f3712"],
    gold: ["#fff6cf", "#d9ad4c", "#6a4a0c"],
    black: ["#9a9a9e", "#2e2e31", "#060607"]
  };
  var CLIP_FRONT = "M90 3 H14 A12 12 0 0 0 14 27 H70";
  var CLIP_HINGE = "M90 21 A9 9 0 0 0 90 3";
  var CLIP_TONGUE = "M76 9 H26 A6 6 0 0 0 26 21 H90";
  function clipWire(d, colors) {
    const light = colors[0];
    const body = colors[1];
    const edge = colors[2];
    return '<g><path d="' + d + '" class="dn-clip-edge" stroke="' + edge + '"/><path d="' + d + '" class="dn-clip-body" stroke="' + body + '"/><path d="' + d + '" class="dn-clip-light" stroke="' + light + '" transform="translate(-0.3 -0.55)"/><path d="' + d + '" class="dn-clip-glint" transform="translate(-0.35 -0.6)"/></g>';
  }
  function stepSpring(body, target, params, dt, rest) {
    const omega = 2 * Math.PI * params.frequency;
    const stiffness = omega * omega;
    const damping = 2 * params.damping * omega;
    const limits = rest || { distance: 0.5, speed: 10 };
    let position = body.position;
    let velocity = body.velocity;
    let remaining = Math.max(0, Math.min(dt, 0.1));
    while (remaining > 0) {
      const h2 = Math.min(SPRING_SUBSTEP, remaining);
      remaining -= h2;
      const acceleration = -stiffness * (position - target) - damping * velocity;
      velocity += acceleration * h2;
      position += velocity * h2;
    }
    if (Math.abs(position - target) < limits.distance && Math.abs(velocity) < limits.speed) {
      return { position: target, velocity: 0 };
    }
    return { position, velocity };
  }
  var ScrollClip = class {
    constructor() {
      this.element = null;
      this.target = null;
      this.shape = "";
      this.y = { position: -1, velocity: 0 };
      this.tilt = { position: 0, velocity: 0 };
      this.trackTop = 0;
      this.trackLeft = 0;
      this.trackHeight = 0;
      this.thumbHeight = CLIP_HEIGHT;
      this.targetY = 0;
      this.last = 0;
      this.dragging = false;
      this.needLayout = true;
      this.placeDirty = true;
      this.appearance = "light";
      this.listeners = [];
      this.padded = null;
      this.paddingBefore = "";
      this.preferred = null;
      this.resizeObserver = null;
      this.mutationObserver = null;
    }
    mount(options) {
      const option = options || {};
      const element = document.createElement("div");
      element.className = "dn-scroll dn-scroll-clip";
      element.hidden = true;
      element.setAttribute("role", "scrollbar");
      element.setAttribute("aria-orientation", "vertical");
      element.setAttribute("aria-label", "滚动正文");
      element.setAttribute("aria-valuemin", "0");
      element.style.zIndex = String(option.zIndex == null ? 6 : option.zIndex);
      element.dataset.appearance = "light";
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
      const style = settings.style === "bar" || settings.style === "native" ? settings.style : "clip";
      if (style === "native") {
        this.detach();
        this.element.hidden = true;
        this.y = { position: -1, velocity: 0 };
        return;
      }
      const shape = style === "clip" ? "clip:" + (settings.finish || "silver") : "bar";
      if (shape !== this.shape) {
        this.shape = shape;
        this.build(shape);
        this.y = { position: -1, velocity: 0 };
      }
      this.needLayout = true;
      this.layout();
    }
    build(shape) {
      const element = this.element;
      const clip = shape.indexOf("clip:") === 0;
      element.className = "dn-scroll " + (clip ? "dn-scroll-clip" : "dn-scroll-bar");
      if (clip) {
        const finish = shape.slice(5);
        const colors = CLIP_FINISHES[finish] || CLIP_FINISHES.silver;
        const id = "dn-clip-" + finish;
        element.style.transformOrigin = CLIP_ON_PAPER + "px 50%";
        element.innerHTML = '<svg viewBox="0 -0.5 100 31" aria-hidden="true"><defs><clipPath id="' + id + '-paper"><rect x="-20" y="-20" width="' + (CLIP_EDGE + 20) + '" height="70"/></clipPath><clipPath id="' + id + '-beyond"><rect x="' + CLIP_EDGE + '" y="-20" width="40" height="70"/></clipPath><filter id="' + id + '-blur" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="1.1"/></filter></defs><g clip-path="url(#' + id + '-paper)"><path d="' + CLIP_TONGUE + '" class="dn-clip-pressed"/><path d="' + CLIP_FRONT + " " + CLIP_HINGE + '" class="dn-clip-shadow" filter="url(#' + id + '-blur)"/></g><g clip-path="url(#' + id + '-beyond)">' + clipWire(CLIP_TONGUE, colors) + "</g>" + clipWire(CLIP_HINGE, colors) + clipWire(CLIP_FRONT, colors) + "</svg>";
      } else {
        element.style.transformOrigin = "50% 50%";
        element.innerHTML = "";
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
      const clip = this.shape.indexOf("clip:") === 0;
      this.trackTop = rect.top + CLIP_TRACK_MARGIN;
      this.trackHeight = Math.max(40, rect.height - CLIP_TRACK_MARGIN * 2);
      this.trackLeft = window.innerWidth - CLIP_RIGHT_INSET;
      this.thumbHeight = clip ? CLIP_HEIGHT : Math.max(28, this.trackHeight * target.clientHeight / target.scrollHeight);
      const travel = Math.max(1, this.trackHeight - this.thumbHeight);
      this.targetY = this.trackTop + clamp(target.scrollTop / base, 0, 1) * travel;
      if (this.appearance !== paper().appearance) {
        this.appearance = paper().appearance;
        this.element.dataset.appearance = this.appearance;
      }
      if (clip) {
        this.element.style.left = this.trackLeft - CLIP_ON_PAPER + "px";
        this.element.style.width = CLIP_WIDTH + "px";
        this.element.style.height = CLIP_HEIGHT + "px";
        this.element.style.opacity = "";
      } else {
        const width = Math.max(2, Number(settings.barWidth) || 6);
        this.element.style.left = this.trackLeft - width - 3 + "px";
        this.element.style.width = width + "px";
        this.element.style.height = this.thumbHeight + "px";
        this.element.style.opacity = String(clamp(
          settings.barOpacity == null ? 0.45 : Number(settings.barOpacity),
          0,
          1
        ));
      }
      this.element.setAttribute("aria-valuemax", String(Math.round(base)));
      this.element.setAttribute("aria-valuenow", String(Math.round(target.scrollTop)));
      if (this.y.position < 0 || reduceMotion) {
        this.y = { position: this.targetY, velocity: 0 };
        this.tilt = { position: 0, velocity: 0 };
      }
      this.placeDirty = true;
    }
    place() {
      if (!this.element) return;
      const clip = this.element.classList.contains("dn-scroll-clip");
      const tilt = clip ? CLIP_REST_TILT + this.tilt.position : 0;
      this.element.style.transform = "translateY(" + this.y.position.toFixed(2) + "px) rotate(" + tilt.toFixed(4) + "rad)";
    }
    /** 滚动位置每帧推进弹簧；返回是否还在动。 */
    step(now) {
      if (!this.element) return false;
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
      let remaining = last ? Math.min(0.5, (now - last) / 1e3) : 1 / 60;
      this.last = now;
      while (remaining > 0) {
        const dt = Math.min(1 / 60, remaining);
        remaining -= dt;
        const previous = this.y.velocity;
        if (!this.dragging) this.y = stepSpring(this.y, this.targetY, CLIP_GLIDE, dt, CLIP_PIXEL_REST);
        const lean = -this.y.velocity * 9e-4 - (this.y.velocity - previous) / Math.max(dt, 1 / 240) * 2e-5;
        this.tilt = stepSpring(this.tilt, clamp(lean, -0.22, 0.22), CLIP_TILT, dt, CLIP_TILT_REST);
      }
      const moving = Math.abs(this.y.position - this.targetY) > 0.05 || this.y.velocity !== 0 || this.tilt.velocity !== 0;
      if (moving || this.dragging || this.placeDirty) {
        this.place();
        this.placeDirty = false;
      }
      if (!moving && !this.dragging) this.last = 0;
      return moving || this.dragging;
    }
    bindPointer() {
      const element = this.element;
      element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        try {
          element.setPointerCapture(event.pointerId);
        } catch (error) {
        }
        this.dragging = true;
        this.grab = event.clientY - this.y.position;
      });
      element.addEventListener("pointermove", (event) => {
        if (!this.dragging || !this.target) return;
        const travel = Math.max(1, this.trackHeight - this.thumbHeight);
        const y = clamp(event.clientY - this.grab, this.trackTop, this.trackTop + travel);
        this.y = { position: y, velocity: (y - this.y.position) * 60 };
        const base = Math.max(0, this.target.scrollHeight - this.target.clientHeight);
        this.target.scrollTop = (y - this.trackTop) / travel * base;
        this.placeDirty = true;
      });
      const stop = (event) => {
        if (!this.dragging) return;
        this.dragging = false;
        if (event.pointerId != null) {
          try {
            element.releasePointerCapture(event.pointerId);
          } catch (error) {
          }
        }
        this.placeDirty = true;
      };
      element.addEventListener("pointerup", stop);
      element.addEventListener("pointercancel", stop);
    }
    /** 从视口中线那一点往上找可滚动容器：只走一条祖先链，代价与树的大小无关。 */
    findScroller() {
      if (this.preferred) {
        const node2 = document.querySelector(this.preferred);
        if (node2 && this.canScroll(node2)) return node2;
      }
      const canScroll = (node2) => this.canScroll(node2);
      let node = document.elementFromPoint(
        Math.round(window.innerWidth * 0.5),
        Math.round(window.innerHeight * 0.45)
      );
      let best = null;
      let bestHeight = 0;
      let guard = 0;
      while (node && guard < 40) {
        guard += 1;
        if (canScroll(node)) {
          const height = node.getBoundingClientRect().height;
          if (height > window.innerHeight * 0.55) return node;
          if (height > bestHeight) {
            best = node;
            bestHeight = height;
          }
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
      if (!next) {
        this.detach();
        return;
      }
      if (next === this.target) return;
      this.detach();
      this.target = next;
      const onScroll = () => {
        this.needLayout = true;
      };
      next.addEventListener("scroll", onScroll, { passive: true });
      this.listeners.push({ target: next, type: "scroll", handler: onScroll });
      const invalidate = () => {
        this.needLayout = true;
      };
      if (typeof ResizeObserver === "function") {
        this.resizeObserver = new ResizeObserver(invalidate);
        this.resizeObserver.observe(next);
      }
      if (typeof MutationObserver === "function") {
        this.mutationObserver = new MutationObserver(invalidate);
        this.mutationObserver.observe(next, { childList: true, subtree: true, characterData: true, attributes: true });
      }
      this.hideNative(next);
      this.needLayout = true;
    }
    /** 容器的原生滚条让位；用内边距补回被让出的宽度，避免正文横向跳一下。 */
    hideNative(element) {
      if (element.dataset.dnScroll === "custom") return;
      const before = element.clientWidth;
      element.dataset.dnScroll = "custom";
      const after = element.clientWidth;
      if (after > before + 0.5) {
        const padding = parseFloat(getComputedStyle(element).paddingRight) || 0;
        this.paddingBefore = element.style.paddingRight;
        element.style.paddingRight = padding + (after - before) + "px";
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
        if (this.padded === this.target) this.target.style.paddingRight = this.paddingBefore || "";
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
  };

  // src/settings-page.js
  var import_react = __toESM(__require("react"), 1);
  var h = import_react.default.createElement;
  var PAPERS_LIST = [
    ["onionskin", "葱皮纸"],
    ["cotton", "棉浆纸"],
    ["laid", "帘纹纸"],
    ["linen", "亚麻纸"],
    ["parchment", "羊皮纸"],
    ["night", "夜纸"]
  ];
  var THEMES_LIST = [
    ["paper-and-ink", "纸与墨"],
    ["midnight-study", "午夜书房"],
    ["moonlit-poetry", "月光诗页"]
  ];
  var CURSORS = [["ink", "墨迹"], ["quill", "羽毛"], ["none", "原生"]];
  var SCROLLS = [["clip", "纸夹"], ["bar", "细杆"], ["native", "原生"]];
  var FINISHES = [["silver", "银"], ["brass", "黄铜"], ["gold", "金"], ["black", "黑"]];
  var COEXISTS = [["auto", "自动适配"], ["material", "只叠材质"], ["full", "接管配色"]];
  var SLIDERS = [
    ["intensity", "灯强", 0, 2, 0.05, (v) => Math.round(v * 100) + "%"],
    ["spread", "光锥", 20, 160, 1, (v) => Math.round(v) + "°"],
    ["softness", "柔边", 0, 1, 0.01, (v) => Math.round(v * 100) + "%"],
    ["grain", "胶片颗粒", 0, 1, 0.01, (v) => Math.round(v * 100) + "%"],
    ["particles", "光里尘埃", 0, 1, 0.01, (v) => Math.round(v * 100) + "%"],
    ["texture", "纸纹深度", 0, 1.6, 0.02, (v) => Math.round(v * 100) + "%"]
  ];
  function Group({ title, children }) {
    return h(
      "section",
      { className: "dn-settings-group", "aria-label": title },
      h("h3", { className: "dn-settings-group-title" }, title),
      h("div", { className: "dn-settings-group-rows" }, children)
    );
  }
  function Row({ id, title, description, block = false, children }) {
    return h(
      "div",
      {
        className: "dn-settings-row" + (block ? " dn-settings-row-block" : ""),
        "data-setting": id
      },
      h(
        "div",
        { className: "dn-settings-row-text" },
        h("div", { className: "dn-settings-row-title" }, title),
        description ? h("div", { className: "dn-settings-row-desc" }, description) : null
      ),
      h("div", { className: "dn-settings-row-control" }, children)
    );
  }
  function Segment({ label, value, choices, onChange }) {
    return h(
      "div",
      { className: "dn-segments", role: "group", "aria-label": label },
      choices.map(([id, name2]) => h("button", {
        key: id,
        type: "button",
        className: "dn-segment",
        "data-active": value === id ? "" : void 0,
        "aria-pressed": value === id ? "true" : "false",
        onClick: () => {
          if (value !== id) onChange(id);
        }
      }, name2))
    );
  }
  function PaperGrid({ value, onChange, colorOf }) {
    return h(
      "div",
      { className: "dn-paper-grid", role: "group", "aria-label": "纸张" },
      PAPERS_LIST.map(([id, name2]) => h(
        "button",
        {
          key: id,
          type: "button",
          className: "dn-paper-choice",
          "data-active": value === id ? "" : void 0,
          "aria-pressed": value === id ? "true" : "false",
          onClick: () => {
            if (value !== id) onChange(id);
          }
        },
        h("span", { className: "dn-paper-swatch", style: { backgroundColor: colorOf(id) }, "aria-hidden": "true" }),
        h("span", { className: "dn-paper-name" }, name2)
      ))
    );
  }
  function Toggle({ label, value, onChange }) {
    return h("button", {
      type: "button",
      className: "dn-switch",
      role: "switch",
      "aria-label": label,
      "aria-checked": value ? "true" : "false",
      "data-on": value ? "" : void 0,
      onClick: () => onChange(!value)
    }, h("span", { className: "dn-switch-knob", "aria-hidden": "true" }));
  }
  function Slider({ label, value, min, max, step, format, onChange }) {
    const progress = max === min ? 0 : Math.min(100, Math.max(0, (value - min) / (max - min) * 100));
    return h(
      "div",
      { className: "dn-slider" },
      h(
        "div",
        { className: "dn-slider-range", style: { "--dn-range-progress": progress + "%" } },
        h("input", {
          type: "range",
          "aria-label": label,
          min,
          max,
          step,
          value,
          onInput: (event) => onChange(Number(event.currentTarget.value))
        })
      ),
      h("output", { className: "dn-slider-value" }, format(value))
    );
  }
  function createNocturneSettings(options) {
    const subscribe = options.subscribe;
    const getRevision = options.revision;
    const getState = options.state;
    const change = options.onChange;
    return function NocturneSettings() {
      (0, import_react.useSyncExternalStore)(subscribe, getRevision, getRevision);
      const settings = getState();
      const resolved = options.resolvedCoexist();
      const foreign = options.foreign();
      const coexistHint = resolved === "material" ? foreign ? "检测到 " + foreign + "：保留其配色与字体，只叠加纸和灯。" : "保留宿主配色与字体，只叠加纸和灯。" : "由缮写室接管纸色、墨色和组件表面；切回材质模式即可还原。";
      return h(
        "main",
        {
          className: "dn-settings",
          "data-dn-settings": "",
          "data-appearance": options.appearance()
        },
        h(
          "header",
          { className: "dn-settings-header" },
          h(
            "div",
            null,
            h("h2", { className: "dn-settings-title" }, "缮写室"),
            h("p", { className: "dn-settings-subtitle" }, "纸、灯与墨 · 所有调整即时预览并自动保存")
          )
        ),
        h(
          Group,
          { title: "纸张与房间" },
          h(
            Row,
            { id: "paper", title: "纸张", description: "决定纸色、墨色、纤维与做旧纹理。", block: true },
            h(PaperGrid, { value: settings.paper, onChange: (value) => change("paper", value), colorOf: options.paperColor })
          ),
          h(
            Row,
            { id: "theme", title: "房间", description: "改变光源、房间气氛与选区色。" },
            h(Segment, { label: "房间", value: settings.theme, choices: THEMES_LIST, onChange: (value) => change("theme", value) })
          )
        ),
        h(
          Group,
          { title: "灯光与纸纹" },
          h(
            Row,
            { id: "lamp", title: "台灯", description: "关闭后只保留环境光。" },
            h(Toggle, { label: "台灯", value: settings.lamp, onChange: (value) => change("lamp", value) })
          ),
          h(
            Row,
            { id: "ambientMotion", title: "环境动效", description: "默认静态。开启后颗粒与尘埃持续运动，会增加全屏重绘。" },
            h(Toggle, { label: "环境动效", value: settings.ambientMotion, onChange: (value) => change("ambientMotion", value) })
          ),
          SLIDERS.map(([key, label, min, max, step, format]) => h(Row, {
            key,
            id: key,
            title: label,
            description: key === "texture" ? "调整纤维、褶皱与纸面起伏；较高数值需要重建纸面。" : void 0
          }, h(Slider, {
            label,
            value: settings[key],
            min,
            max,
            step,
            format,
            onChange: (value) => change(key, value)
          })))
        ),
        h(
          Group,
          { title: "光标与滚动" },
          h(
            Row,
            { id: "cursorMode", title: "光标", description: "IME 合成、拖选或测量失败时自动回到原生光标。" },
            h(Segment, { label: "光标", value: settings.cursorMode, choices: CURSORS, onChange: (value) => change("cursor", value) })
          ),
          h(
            Row,
            { id: "scrollbar", title: "滚动条", description: "保留键盘、触控板和原生滚动物理。" },
            h(Segment, { label: "滚动条", value: settings.scrollbar.style, choices: SCROLLS, onChange: (value) => change("scrollStyle", value) })
          ),
          settings.scrollbar.style === "clip" ? h(
            Row,
            { id: "scrollFinish", title: "纸夹金属" },
            h(Segment, { label: "纸夹金属", value: settings.scrollbar.finish, choices: FINISHES, onChange: (value) => change("scrollFinish", value) })
          ) : null,
          settings.scrollbar.style === "bar" ? h(
            import_react.default.Fragment,
            null,
            h(
              Row,
              { id: "scrollBarWidth", title: "细杆宽度" },
              h(Slider, {
                label: "细杆宽度",
                value: settings.scrollbar.barWidth,
                min: 3,
                max: 14,
                step: 1,
                format: (value) => Math.round(value) + " px",
                onChange: (value) => change("scrollBarWidth", value)
              })
            ),
            h(
              Row,
              { id: "scrollBarOpacity", title: "细杆不透明度" },
              h(Slider, {
                label: "细杆不透明度",
                value: settings.scrollbar.barOpacity,
                min: 0.1,
                max: 1,
                step: 0.05,
                format: (value) => Math.round(value * 100) + "%",
                onChange: (value) => change("scrollBarOpacity", value)
              })
            )
          ) : null
        ),
        h(
          Group,
          { title: "共存与诊断" },
          h(
            Row,
            { id: "coexist", title: "与其他皮肤共存", description: coexistHint },
            h(Segment, { label: "与其他皮肤共存", value: settings.coexist, choices: COEXISTS, onChange: (value) => change("coexist", value) })
          ),
          h(
            Row,
            { id: "diagnostics", title: "诊断记录", description: "默认关闭。开启后记录 DOM 变化、卡顿和 GPU 采样，用于排查渲染问题。" },
            h(Toggle, { label: "诊断记录", value: settings.diagnostics, onChange: (value) => change("diagnostics", value) })
          ),
          h(
            Row,
            { id: "preset", title: "恢复标定值", description: "恢复默认纸张、房间、灯光、光标与滚动设置。" },
            h("button", { type: "button", className: "dn-reset", onClick: () => change("preset", "calibrated") }, "回到标定值")
          )
        ),
        h(
          "footer",
          { className: "dn-settings-footer" },
          h("span", null, "Nocturne · 本地渲染"),
          h("span", null, THEMES[settings.theme].light.source)
        )
      );
    };
  }

  // src/settings-contract.js
  var SETTING_KEYS = Object.freeze([
    "paper",
    "theme",
    "lamp",
    "enabled",
    "intensity",
    "spread",
    "beam",
    "aim",
    "reach",
    "softness",
    "bloom",
    "grain",
    "cursorGlow",
    "paperIllumination",
    "particles",
    "texture",
    "cursorMode",
    "coexist",
    "diagnostics",
    "ambientMotion"
  ]);
  var TOP_LEVEL = /* @__PURE__ */ new Set([
    ...SETTING_KEYS,
    "window",
    "scrollbar",
    "v",
    "__diag",
    "__hangs",
    "__error"
  ]);
  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  // src/adapter.js
  var PAPER_ATTR = "data-dn";
  var STYLE_ID = "dsh-nocturne-style";
  var STORE_KEY = "dsh-nocturne:settings";
  var STORE_VERSION = 1;
  var REMOTE_PATH = "/dsh-nocturne/settings";
  var SURFACE_NAMES = [
    "--dsw-specific-bubble",
    "--dsw-specific-input-major",
    "--dsw-specific-menu",
    "--dsw-specific-selector",
    "--dsw-specific-sidebar-fill"
  ];
  var SURFACE_MIX = {
    "--dsw-specific-bubble": 0.07,
    "--dsw-specific-input-major": 0.05,
    "--dsw-specific-menu": 0.04,
    "--dsw-specific-selector": 0.06,
    "--dsw-specific-sidebar-fill": 0.03
  };
  var remoteTimer = 0;
  var lastDiag = null;
  var hangs = [];
  var selfCheckError = "";
  var measure = document.createElement("canvas").getContext("2d");
  var teardown = null;
  var settingsPageComponent = null;
  function mergeSettings(saved) {
    if (!isRecord(saved)) return;
    for (const key of SETTING_KEYS) {
      if (saved[key] !== void 0 && saved[key] !== null) SETTINGS[key] = saved[key];
    }
    if (isRecord(saved.window)) Object.assign(SETTINGS.window, saved.window);
    if (isRecord(saved.scrollbar)) Object.assign(SETTINGS.scrollbar, saved.scrollbar);
  }
  function boundedNumber(value, fallback, min, max, integer = false) {
    const number = typeof value === "number" ? value : NaN;
    const safe = Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    return integer ? Math.round(safe) : safe;
  }
  function normalize() {
    const defaults = NOCTURNE_DEFAULTS;
    if (!PAPERS[SETTINGS.paper]) SETTINGS.paper = defaults.paper;
    if (!THEMES[SETTINGS.theme]) SETTINGS.theme = defaults.theme;
    if (["ink", "quill", "none"].indexOf(SETTINGS.cursorMode) < 0) SETTINGS.cursorMode = defaults.cursorMode;
    if (["auto", "material", "full"].indexOf(SETTINGS.coexist) < 0) SETTINGS.coexist = defaults.coexist;
    if (["pointed", "soft"].indexOf(SETTINGS.beam) < 0) SETTINGS.beam = defaults.beam;
    for (const key of ["lamp", "enabled", "diagnostics", "ambientMotion"]) {
      if (typeof SETTINGS[key] !== "boolean") SETTINGS[key] = defaults[key];
    }
    const limits = {
      intensity: [0, 2],
      spread: [20, 160],
      aim: [-1, 1],
      reach: [0.1, 3],
      softness: [0, 1],
      bloom: [0, 1],
      grain: [0, 1],
      cursorGlow: [0, 1],
      paperIllumination: [0, 1],
      particles: [0, 1],
      texture: [0, 1.6]
    };
    for (const [key, range] of Object.entries(limits)) {
      SETTINGS[key] = boundedNumber(SETTINGS[key], defaults[key], range[0], range[1]);
    }
    if (!isRecord(SETTINGS.scrollbar)) SETTINGS.scrollbar = { ...defaults.scrollbar };
    const bar = SETTINGS.scrollbar;
    if (["clip", "bar", "native"].indexOf(bar.style) < 0) bar.style = defaults.scrollbar.style;
    if (!CLIP_FINISHES[bar.finish]) bar.finish = defaults.scrollbar.finish;
    bar.barWidth = boundedNumber(bar.barWidth, defaults.scrollbar.barWidth, 3, 14);
    bar.barOpacity = boundedNumber(bar.barOpacity, defaults.scrollbar.barOpacity, 0.1, 1);
    if (!isRecord(SETTINGS.window)) SETTINGS.window = { ...defaults.window };
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
    const saved = { v: STORE_VERSION };
    for (const key of SETTING_KEYS) saved[key] = SETTINGS[key];
    saved.window = { ...SETTINGS.window };
    saved.scrollbar = { ...SETTINGS.scrollbar };
    if (lastDiag) saved.__diag = lastDiag;
    if (hangs.length) saved.__hangs = hangs.slice();
    if (selfCheckError) saved.__error = selfCheckError;
    return saved;
  }
  function readSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) mergeSettings(JSON.parse(raw));
    } catch (error) {
    }
    normalize();
  }
  function loadRemote() {
    if (typeof fetch !== "function") return Promise.resolve(false);
    return fetch(REMOTE_PATH, { headers: { accept: "application/json" }, credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).then((payload) => {
      const saved = payload && payload.settings;
      if (!saved || typeof saved !== "object") return false;
      mergeSettings(saved);
      normalize();
      persistLocal();
      return true;
    }).catch(() => false);
  }
  function persistLocal() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(snapshot()));
    } catch (error) {
    }
  }
  function saveRemote() {
    if (typeof fetch !== "function") return;
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(() => {
      try {
        fetch(REMOTE_PATH, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(snapshot())
        }).catch(() => {
        });
      } catch (error) {
      }
    }, 700);
  }
  function persist() {
    persistLocal();
    saveRemote();
  }
  function findCaret() {
    const active = document.activeElement;
    if (!active) return null;
    const tag = active.tagName;
    if (!(tag === "TEXTAREA" || tag === "INPUT" || active.isContentEditable)) return null;
    try {
      if (active.isContentEditable) {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return null;
        const box2 = selection.getRangeAt(0).getClientRects()[0];
        return box2 ? { x: box2.left, y: box2.top + box2.height / 2 } : null;
      }
      const box = active.getBoundingClientRect();
      const style = getComputedStyle(active);
      measure.font = style.fontStyle + " " + style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
      const caret = active.selectionStart == null ? active.value.length : active.selectionStart;
      const textWidth = measure.measureText(String(active.value).slice(0, caret)).width;
      return { x: box.left + textWidth - (active.scrollLeft || 0), y: box.top + box.height / 2 };
    } catch (error) {
      return null;
    }
  }
  function foreignSkin() {
    try {
      const root = getComputedStyle(document.documentElement);
      if (root.getPropertyValue("--dsh-claude-caret-color").trim() !== "") return "dsh-claude-style";
      if (root.getPropertyValue("--dsh-claude-blur-soft").trim() !== "") return "dsh-claude-style";
      const body = getComputedStyle(document.body);
      if (body.getPropertyValue("--dsh-claude-caret-color").trim() !== "") return "dsh-claude-style";
    } catch (error) {
    }
    return null;
  }
  function tokenMode() {
    if (SETTINGS.coexist === "material") return "material";
    return "full";
  }
  function detectHostAppearance() {
    try {
      for (const node of [document.documentElement, document.body]) {
        if (!node) continue;
        for (const name2 of ["data-ds-dark-theme", "data-dark-theme"]) {
          if (!node.hasAttribute(name2)) continue;
          const value = node.getAttribute(name2);
          if (value !== "false" && value !== "light") return "dark";
        }
        const theme2 = node.getAttribute("data-theme") || node.getAttribute("data-appearance");
        if (theme2 && /dark/i.test(theme2)) return "dark";
        if (theme2 && /light/i.test(theme2)) return "light";
        if (node.classList && (node.classList.contains("dark") || node.classList.contains("theme-dark"))) return "dark";
      }
      const rootScheme = getComputedStyle(document.documentElement).colorScheme || "";
      const bodyScheme = document.body ? getComputedStyle(document.body).colorScheme || "" : "";
      const scheme = bodyScheme || rootScheme;
      if (/dark/i.test(scheme) && !/light/i.test(scheme)) return "dark";
      if (/light/i.test(scheme) && !/dark/i.test(scheme)) return "light";
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    } catch (error) {
    }
    return "light";
  }
  function watchWhite() {
    const hits = [];
    let total = 0;
    let budget = 0;
    let windowStart = 0;
    let armedUntil = 0;
    const arm = () => {
      armedUntil = performance.now() + 2500;
    };
    const near = (value) => {
      const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(value);
      if (!match) return false;
      if (match[4] !== void 0 && Number(match[4]) < 0.6) return false;
      return Number(match[1]) > 228 && Number(match[2]) > 226 && Number(match[3]) > 224;
    };
    const label = (node) => {
      if (!node || node.nodeType !== 1) return "";
      const cls = String(node.className || "").split(" ").filter(Boolean).slice(0, 2).join(".");
      return node.tagName.toLowerCase() + (cls ? "." + cls : "");
    };
    const record = (node) => {
      if (!SETTINGS.diagnostics) return;
      if (node.nodeType !== 1 || total >= 40) return;
      const style = getComputedStyle(node);
      const inWindow = performance.now() < armedUntil;
      if (!near(style.backgroundColor)) {
        if (!inWindow) return;
        const alpha = /rgba?\([^)]*,\s*([\d.]+)\)$/.exec(style.backgroundColor);
        if (style.backgroundColor === "rgba(0, 0, 0, 0)") return;
        if (alpha && Number(alpha[1]) < 0.5) return;
      }
      const box = node.getBoundingClientRect();
      hits.push({
        at: (/* @__PURE__ */ new Date()).toISOString().slice(11, 23),
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
      if (now - windowStart > 1e3) {
        windowStart = now;
        budget = 0;
      }
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
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    return { observer, hits, arm };
  }
  function parseColor(value) {
    const text = String(value || "").trim();
    let match = /^#([0-9a-f]{6})$/i.exec(text);
    if (match) {
      return [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255).concat(1);
    }
    match = /^rgba?\(([^)]+)\)$/.exec(text);
    if (match) {
      const parts = match[1].split(/[,/]/).map((v) => v.trim()).filter(Boolean);
      if (parts.length >= 3) {
        return [
          Number(parts[0]) / 255,
          Number(parts[1]) / 255,
          Number(parts[2]) / 255,
          parts[3] === void 0 ? 1 : Number(parts[3])
        ];
      }
    }
    match = /^color\(srgb\s+([^)]+)\)$/.exec(text);
    if (match) {
      const parts = match[1].split(/[\s/]+/).filter(Boolean);
      if (parts.length >= 3) {
        return [
          Number(parts[0]),
          Number(parts[1]),
          Number(parts[2]),
          parts[3] === void 0 ? 1 : Number(parts[3])
        ];
      }
    }
    return null;
  }
  function isBrightSurface(value) {
    const rgba = parseColor(value);
    if (!rgba) return false;
    if (rgba[3] < 0.85) return false;
    return Math.min(rgba[0], rgba[1], rgba[2]) > 0.88;
  }
  function auditStacking() {
    const floor = 2147482e3;
    const found = [];
    const label = (el) => {
      const cls = String(el.className || "").split(" ").filter(Boolean).slice(0, 2).join(".");
      return el.tagName.toLowerCase() + (cls ? "." + cls : "");
    };
    let scanned = 0;
    for (const el of document.querySelectorAll("body *")) {
      if (scanned > 12e3 || found.length >= 10) break;
      scanned += 1;
      const style = getComputedStyle(el);
      if (style.position === "static") continue;
      const z = Number(style.zIndex);
      if (!isFinite(z) || z <= floor) continue;
      if (el.hasAttribute && el.hasAttribute(PAPER_ATTR)) continue;
      found.push({
        el: label(el),
        z,
        position: style.position,
        bg: style.backgroundColor,
        opacity: style.opacity,
        pointer: style.pointerEvents,
        blend: style.mixBlendMode,
        anim: style.animationName.slice(0, 20),
        box: [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)]
      });
    }
    const bright = [];
    for (const el of document.querySelectorAll("body *")) {
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
        parent: el.parentElement ? label(el.parentElement) : "",
        box: [Math.round(box.width), Math.round(box.height)],
        area: Math.round(box.width * box.height)
      });
    }
    bright.sort((a, b) => b.area - a.area);
    return { scanned, above: found, bright };
  }
  function auditTokens() {
    const names = /* @__PURE__ */ new Set();
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (error) {
        continue;
      }
      if (!rules) continue;
      for (const rule of rules) {
        const text = rule.cssText;
        if (!text || text.indexOf("--dsw") < 0) continue;
        const found = text.match(/--dsw-[a-z0-9-]+/g);
        if (found) for (const name2 of found) names.add(name2);
        if (names.size > 300) break;
      }
      if (names.size > 300) break;
    }
    const body = getComputedStyle(document.body);
    const bright = [];
    for (const name2 of names) {
      const value = body.getPropertyValue(name2).trim();
      if (!value || !isBrightSurface(value)) continue;
      bright.push(name2 + "=" + value.slice(0, 40));
      if (bright.length >= 30) break;
    }
    return { total: names.size, bright };
  }
  function mixHex(from, to, amount) {
    const a = toUnit(from);
    const b = toUnit(to);
    const channels = [0, 1, 2].map((i) => Math.round((a[i] * (1 - amount) + b[i] * amount) * 255));
    return "#" + channels.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
  }
  function rgbaHex(hex, alpha) {
    const channels = toUnit(hex).map((v) => Math.round(v * 255));
    return "rgba(" + channels.join(", ") + ", " + alpha + ")";
  }
  function tokenMap(p) {
    const dark = p.appearance === "dark";
    const layers = {
      one: dark ? mixHex(p.paper, "#ffffff", 0.045) : mixHex(p.paper, "#000000", 0.035),
      two: dark ? mixHex(p.paper, "#000000", 0.035) : mixHex(p.paper, "#000000", 0.07),
      three: dark ? mixHex(p.paper, "#ffffff", 0.075) : mixHex(p.paper, "#ffffff", 0.025),
      four: dark ? mixHex(p.paper, "#ffffff", 0.105) : mixHex(p.paper, "#ffffff", 0.05)
    };
    const state = dark ? {
      brand: "#c9a45c",
      brandHover: "#d9b878",
      error: "#d88a9a",
      success: "#9cc3a4",
      warn: "#e2cf9a",
      business: "#8ea8e0",
      idle: "#8f89a6"
    } : {
      brand: "#8a6529",
      brandHover: "#a27b3b",
      error: "#9c3a2a",
      success: "#4c6b2f",
      warn: "#8a6a1c",
      business: "#2f5277",
      idle: "#7d7264"
    };
    const ink = p.ink;
    const primaryForeground = p.paper;
    const overlayText = dark ? p.ink : "#f7efdd";
    return {
      "--dsw-alias-bg-base": p.paper,
      "--dsw-alias-bg-module-platform": layers.one,
      "--dsw-alias-bg-layer-1": layers.one,
      "--dsw-alias-bg-layer-2": layers.two,
      "--dsw-alias-bg-layer-3": layers.three,
      "--dsw-alias-bg-layer-4": layers.four,
      "--dsw-alias-bg-overlay": layers.three,
      "--dsw-alias-bg-mask-1": dark ? "rgba(0, 0, 0, .58)" : "rgba(32, 24, 16, .28)",
      "--dsw-alias-bg-document-selection": p.selection,
      "--dsw-alias-label-primary": ink,
      "--dsw-alias-label-secondary": p.inkMuted,
      "--dsw-alias-label-tertiary": p.inkFaint,
      "--dsw-alias-label-dimmed": p.inkFaint,
      "--dsw-alias-label-caption": p.inkFaint,
      "--dsw-alias-label-shimmer": rgbaHex(ink, 0.18),
      "--dsw-alias-label-error": state.error,
      "--dsw-alias-label-primary-foreground": primaryForeground,
      "--dsw-alias-link": state.business,
      "--dsw-alias-menu-icon": p.inkMuted,
      "--dsw-alias-border-l1": rgbaHex(ink, dark ? 0.1 : 0.12),
      "--dsw-alias-border-l2": rgbaHex(ink, dark ? 0.18 : 0.18),
      "--dsw-alias-border-l3": rgbaHex(ink, dark ? 0.28 : 0.26),
      "--dsw-alias-border-l4": rgbaHex(ink, dark ? 0.38 : 0.34),
      "--dsw-alias-border-l2-darkmode-thin": rgbaHex(ink, dark ? 0.12 : 0.16),
      "--dsw-alias-brand-primary": state.brand,
      "--dsw-alias-button-primary-fill": state.brand,
      "--dsw-alias-button-primary-hover": state.brandHover,
      "--dsw-alias-button-ghost-active-fill": rgbaHex(state.brand, 0.16),
      "--dsw-alias-button-ghost-active-border": rgbaHex(state.brand, 0.46),
      "--dsw-alias-button-tool-bar-fill": layers.two,
      "--dsw-alias-interactive-bg-hover": rgbaHex(ink, 0.06),
      "--dsw-alias-interactive-bg-active": rgbaHex(ink, 0.11),
      "--dsw-alias-interactive-bg-hover-danger": rgbaHex(state.error, 0.12),
      "--dsw-alias-state-success-primary": state.success,
      "--dsw-alias-state-success-tertiary": rgbaHex(state.success, 0.16),
      "--dsw-alias-state-warn-primary": state.warn,
      "--dsw-alias-state-warn-tertiary": rgbaHex(state.warn, 0.16),
      "--dsw-alias-state-warn-label": state.warn,
      "--dsw-alias-state-error-primary": state.error,
      "--dsw-alias-state-business-primary": state.business,
      "--dsw-alias-state-idle-primary": state.idle,
      "--dsw-alias-markdown-code-block": layers.two,
      "--dsw-alias-markdown-code-block-banner": layers.one,
      "--dsw-alias-markdown-inline-code": layers.two,
      "--dsw-alias-markdown-tag": rgbaHex(state.brand, 0.16),
      "--dsw-alias-code-diff-added": rgbaHex(state.success, 0.15),
      "--dsw-alias-code-diff-deleted": rgbaHex(state.error, 0.14),
      "--dsw-alias-scrollbar-bg-l2": rgbaHex(ink, dark ? 0.16 : 0.18),
      "--dsw-alias-scrollbar-hover-l2": rgbaHex(ink, dark ? 0.3 : 0.3),
      "--dsw-alias-switch-thumb": dark ? mixHex(p.paper, "#ffffff", 0.78) : p.paper,
      "--dsw-alias-tooltip-bg": dark ? layers.four : "#2b231c",
      "--dsw-alias-tooltip-key-bg": dark ? layers.three : "#3a2f27",
      "--dsw-alias-toast-bg": dark ? layers.four : "#2b231c",
      "--dsw-alias-toast-label": overlayText,
      "--dsw-alias-menu-group-header-fill": rgbaHex(p.paper, 0.94),
      "--dn-paper": p.paper,
      "--dn-ink": p.ink,
      "--dn-caret-ink": p.cursor,
      "--dn-metal-lo": "#5e431c",
      "--dn-metal-hi": "#f3dca4",
      "--dn-metal": "#b8904c",
      "--dn-sheet": p.paper,
      "--dn-selection": washColor(),
      "--dsh-font-family-text": '"EB Garamond", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Source Han Serif SC", "Songti SC", "Noto Serif CJK SC", serif',
      "--dsh-font-family-code": '"Courier Prime", "IBM Plex Mono", "Courier New", "DejaVu Sans Mono", ui-monospace, monospace'
    };
  }
  var ownedStyles = /* @__PURE__ */ new Map();
  function ownedStyleKey(element, name2) {
    return (element === document.documentElement ? "root:" : "body:") + name2;
  }
  function setOwnedStyle(element, name2, value, priority = "") {
    const key = ownedStyleKey(element, name2);
    let owned = ownedStyles.get(key);
    if (!owned) {
      owned = {
        element,
        name: name2,
        valueBefore: element.style.getPropertyValue(name2),
        priorityBefore: element.style.getPropertyPriority(name2)
      };
      ownedStyles.set(key, owned);
    }
    const text = String(value);
    element.style.setProperty(name2, text, priority);
    owned.valueWritten = text;
    owned.priorityWritten = priority;
  }
  function restoreOwnedStyles(includeLight = true) {
    for (const [key, owned] of ownedStyles) {
      if (!includeLight && owned.name === "--dn-light-rgb") continue;
      const style = owned.element.style;
      if (style.getPropertyValue(owned.name) === owned.valueWritten && style.getPropertyPriority(owned.name) === owned.priorityWritten) {
        if (owned.valueBefore) style.setProperty(owned.name, owned.valueBefore, owned.priorityBefore);
        else style.removeProperty(owned.name);
      }
      ownedStyles.delete(key);
    }
  }
  function applySurfaces() {
    const body = document.body;
    if (!body) return;
    for (const name2 of SURFACE_NAMES) {
      setOwnedStyle(body, name2, surfaceColor(SURFACE_MIX[name2]), "important");
    }
  }
  function applyTokens() {
    restoreOwnedStyles(false);
    const root = document.documentElement;
    const p = paper();
    if (tokenMode() === "material") {
      const own = {
        "--dn-sheet": "transparent",
        "--dn-selection": washColor(),
        "--dn-paper": p.paper,
        "--dn-ink": p.ink,
        "--dn-caret-ink": p.cursor,
        "--dn-metal-lo": "#5e431c",
        "--dn-metal-hi": "#f3dca4",
        "--dn-metal": "#b8904c"
      };
      for (const [name2, value] of Object.entries(own)) setOwnedStyle(root, name2, value);
      return;
    }
    applySurfaces();
    const map = tokenMap(p);
    const body = document.body;
    for (const [name2, value] of Object.entries(map)) {
      setOwnedStyle(root, name2, value, "important");
      if (body) setOwnedStyle(body, name2, value, "important");
    }
  }
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS_TEXT;
    (document.head || document.documentElement).appendChild(style);
  }
  function mount() {
    if (document.querySelector("canvas[" + PAPER_ATTR + "]")) return;
    let hostAppearance = detectHostAppearance();
    setPaperAppearance(hostAppearance);
    readSettings();
    injectStyle();
    const paperCanvas = document.createElement("canvas");
    paperCanvas.setAttribute(PAPER_ATTR, "paper");
    paperCanvas.setAttribute("aria-hidden", "true");
    const glowCanvas = document.createElement("canvas");
    glowCanvas.setAttribute(PAPER_ATTR, "glow");
    glowCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(paperCanvas);
    document.body.appendChild(glowCanvas);
    const caret = new InkCaret();
    caret.mount(paperCanvas);
    const scrollClip = new ScrollClip();
    scrollClip.mount({ zIndex: 2147482003 });
    const white = watchWhite();
    const paperLight = new PaperLight(paperCanvas);
    const glow = new GlowLayer(glowCanvas);
    let size = { width: 1, height: 1 };
    let origin = { left: 0, top: 0 };
    let caretPoint = null;
    let needsBuild = true;
    let needsLight = true;
    let lastLightAt = 0;
    let frameId = 0;
    let stopped = false;
    function measureSheet() {
      const width = Math.max(1, Math.round(window.innerWidth));
      const height = Math.max(1, Math.round(window.innerHeight));
      const pixelBudgetDpr = Math.sqrt(195e4 / (width * height));
      const dpr = Math.max(0.5, Math.min(2, window.devicePixelRatio || 1, pixelBudgetDpr));
      for (const canvas of [paperCanvas, glowCanvas]) {
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
      }
      glow.resize(width, height, dpr);
      const changed = width !== size.width || height !== size.height || dpr !== size.pixelRatio;
      size = { width, height, pixelRatio: dpr };
      origin = { left: 0, top: 0 };
      if (changed || needsBuild) {
        paperLight.build({ width, height, pixelRatio: dpr, p: paper() });
        needsBuild = false;
        needsLight = true;
        rebuiltThisFrame = true;
      }
      scrollClip.needLayout = true;
    }
    let lastFrameAt = 0;
    let lastGlowAt = 0;
    let lastRgbWritten = "";
    let rebuiltThisFrame = false;
    let lastCaretPoint = null;
    let cursorMovedThisFrame = false;
    let thisFrameActive = false;
    function paintFrame(now) {
      const startedAt = performance.now();
      const time = now / 1e3;
      const appearance = paper().appearance;
      caretPoint = caret.sync() || findCaret();
      const caretSheetX = caretPoint ? caretPoint.x - origin.left : size.width / 2;
      const rig = buildRig(size, caretSheetX);
      const animateGrain = SETTINGS.ambientMotion && SETTINGS.grain > 0 && !reduceMotion;
      let lightFrameRan = false;
      if (needsLight || animateGrain && now - lastLightAt > 120) {
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
      const caretMoved = caretPoint && lastCaretPoint && (Math.abs(caretPoint.x - lastCaretPoint.x) > 0.5 || Math.abs(caretPoint.y - lastCaretPoint.y) > 0.5);
      const caretAppeared = Boolean(caretPoint) !== Boolean(lastCaretPoint);
      const dustDue = SETTINGS.ambientMotion && !reduceMotion && SETTINGS.particles > 0 && now - lastGlowAt > 60;
      if (lightFrameRan || caretMoved || caretAppeared || dustDue) {
        glow.render({
          rig,
          lamp: SETTINGS.lamp && SETTINGS.enabled,
          rgb: lightChannels.join(", "),
          poolRgb: poolChannels.join(", "),
          appearance,
          intensity: SETTINGS.intensity,
          particles: SETTINGS.particles,
          cursorGlow: SETTINGS.cursorGlow,
          cursor: caretPoint ? { x: caretPoint.x - origin.left, y: caretPoint.y - origin.top } : null,
          time: SETTINGS.ambientMotion && !reduceMotion ? time : 0
        });
        lastGlowAt = now;
      }
      lastCaretPoint = caretPoint ? { x: caretPoint.x, y: caretPoint.y } : null;
      cursorMovedThisFrame = false;
      const scrollMoving = scrollClip.step(now);
      thisFrameActive = SETTINGS.ambientMotion && (SETTINGS.grain > 0 || SETTINGS.particles > 0) || scrollMoving;
      const rgb = lightChannels.join(" ");
      if (rgb !== lastRgbWritten) {
        setOwnedStyle(document.documentElement, "--dn-light-rgb", rgb);
        lastRgbWritten = rgb;
      }
      const cost = performance.now() - startedAt;
      if (lastFrameAt) {
        const gap = now - lastFrameAt;
        if (SETTINGS.diagnostics && gap > 200) {
          hangs.push({
            at: (/* @__PURE__ */ new Date()).toISOString().slice(11, 23),
            gap: Math.round(gap),
            cost: Math.round(cost),
            nodes: document.getElementsByTagName("*").length,
            rebuilt: rebuiltThisFrame,
            editorEmpty: caretPoint ? false : true,
            canvases: document.querySelectorAll("canvas[" + PAPER_ATTR + "]").length
          });
          if (hangs.length > 12) hangs.shift();
          persist();
        }
      }
      lastFrameAt = now;
      rebuiltThisFrame = false;
    }
    let lastPaintAt = 0;
    function frame(now) {
      if (stopped) return;
      const interval = thisFrameActive && !reduceMotion ? 1e3 / 30 : 1e3 / 8;
      if (now - lastPaintAt >= interval) {
        lastPaintAt = now;
        try {
          paintFrame(now);
        } catch (error) {
          if (!selfCheckError) {
            selfCheckError = String(error && error.stack || error).slice(0, 240);
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
        attributeFilter: ["data-ds-dark-theme", "data-dark-theme", "data-theme", "data-appearance", "class"]
      });
    }
    const colorSchemeQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (colorSchemeQuery) {
      if (typeof colorSchemeQuery.addEventListener === "function") colorSchemeQuery.addEventListener("change", onHostAppearanceChange);
      else if (typeof colorSchemeQuery.addListener === "function") colorSchemeQuery.addListener(onHostAppearanceChange);
    }
    const onSelection = () => {
      needsLight = true;
    };
    const onVisibility = () => {
      if (document.hidden) {
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      } else if (!frameId && !stopped) {
        lastPaintAt = 0;
        needsLight = true;
        frameId = requestAnimationFrame(frame);
      }
    };
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
    paperCanvas.addEventListener("webglcontextlost", onContextLost);
    paperCanvas.addEventListener("webglcontextrestored", onContextRestored);
    window.addEventListener("resize", reposition);
    document.addEventListener("selectionchange", onSelection);
    document.addEventListener("visibilitychange", onVisibility);
    const onKeyForAudit = (event) => {
      if (!SETTINGS.diagnostics || event.key !== "Enter" || event.shiftKey) return;
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
    document.addEventListener("keydown", onKeyForAudit, true);
    measureSheet();
    frameId = requestAnimationFrame(frame);
    let diagPending = false;
    setTimeout(() => {
      diagPending = true;
    }, 2e3);
    function samplePaper() {
      try {
        const gl = paperCanvas.getContext("webgl2");
        if (!gl || gl.isContextLost()) return null;
        const w = paperCanvas.width;
        const h2 = paperCanvas.height;
        const cols = 28;
        const rows = 16;
        const pixel = new Uint8Array(4);
        const values = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = Math.min(w - 1, Math.round((col + 0.5) / cols * w));
            const y = Math.min(h2 - 1, Math.round((row + 0.5) / rows * h2));
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            values.push(0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]);
          }
        }
        values.sort((m, n) => m - n);
        const at = (q) => Math.round(values[Math.min(values.length - 1, Math.floor(q * values.length))]);
        return {
          mean: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
          p05: at(0.05),
          p50: at(0.5),
          p95: at(0.95),
          max: Math.round(values[values.length - 1])
        };
      } catch (error) {
        return null;
      }
    }
    function reportDiag(includePixels = false) {
      let renderer = "";
      let webgl2 = false;
      try {
        const gl = paperCanvas.getContext("webgl2");
        webgl2 = Boolean(gl);
        const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
        if (gl && info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)).slice(0, 60);
      } catch (error) {
      }
      const rect = paperCanvas.getBoundingClientRect();
      lastDiag = {
        at: (/* @__PURE__ */ new Date()).toISOString(),
        version: DN_VERSION,
        white: white.hits.slice(),
        surfaces: (function() {
          const body = document.body;
          return body ? [
            getComputedStyle(body).getPropertyValue("--dsw-specific-bubble").trim(),
            getComputedStyle(body).getPropertyValue("--dsw-specific-input-major").trim()
          ] : null;
        })(),
        origin: location.origin,
        dpr: window.devicePixelRatio,
        viewport: [window.innerWidth, window.innerHeight],
        canvas: [paperCanvas.width, paperCanvas.height, Math.round(rect.width), Math.round(rect.height)],
        webgl2,
        paperState: paperLight.state,
        renderer,
        tokenMode: tokenMode(),
        foreign: foreignSkin(),
        bgBase: getComputedStyle(document.documentElement).getPropertyValue("--dsw-alias-bg-base").trim(),
        dnPaper: getComputedStyle(document.documentElement).getPropertyValue("--dn-paper").trim(),
        canvases: document.querySelectorAll("canvas[" + PAPER_ATTR + "]").length,
        caret: caret.shown ? caret.mode : "hidden",
        scroll: {
          style: SETTINGS.scrollbar.style,
          attached: Boolean(scrollClip.target),
          host: scrollClip.target ? scrollClip.target.tagName.toLowerCase() + ":" + String(scrollClip.target.className || "").slice(0, 24) : null,
          height: scrollClip.target ? scrollClip.target.clientHeight : 0,
          travel: scrollClip.target ? Math.max(0, scrollClip.target.scrollHeight - scrollClip.target.clientHeight) : 0,
          shown: scrollClip.element ? !scrollClip.element.hidden : false
        },
        papers: Object.keys(PAPERS).length,
        themes: Object.keys(THEMES).length,
        // 与标定基准同口径：上游参考值 p50≈115 / p95≈178（1440×900、parchment、balanced 灯）
        paperPixels: includePixels || SETTINGS.diagnostics ? samplePaper() : null
      };
      persist();
    }
    const settingsListeners = /* @__PURE__ */ new Set();
    let settingsRevision = 0;
    function notifySettings() {
      settingsRevision += 1;
      for (const listener of settingsListeners) listener();
    }
    function updateSettings(patch, reset = false) {
      const keys = new Set(reset ? [...SETTING_KEYS, "window", "scrollbar"] : Object.keys(patch || {}));
      if (reset) Object.assign(SETTINGS, JSON.parse(JSON.stringify(NOCTURNE_DEFAULTS)));
      else mergeSettings(patch);
      normalize();
      lastPaintAt = 0;
      const changed = (...names) => reset || names.some((name2) => keys.has(name2));
      if (changed("paper", "theme", "coexist")) applyTokens();
      if (changed("cursorMode")) caret.setMode(SETTINGS.cursorMode);
      if (changed("scrollbar")) scrollClip.apply();
      if (changed("paper")) caret.hide();
      needsLight = true;
      if (changed("paper", "theme", "texture")) {
        needsBuild = true;
        reposition();
      }
      notifySettings();
      persist();
    }
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
        if (key === "preset") {
          updateSettings(null, true);
          return;
        }
        if (key === "cursor") {
          updateSettings({ cursorMode: value });
          return;
        }
        if (key === "scrollStyle" || key === "scrollFinish") {
          updateSettings({ scrollbar: { [key === "scrollStyle" ? "style" : "finish"]: value } });
          return;
        }
        if (key === "scrollBarWidth" || key === "scrollBarOpacity") {
          updateSettings({ scrollbar: { [key === "scrollBarWidth" ? "barWidth" : "barOpacity"]: value } });
          return;
        }
        updateSettings({ [key]: value });
      }
    });
    caret.setMode(SETTINGS.cursorMode);
    scrollClip.apply();
    applyTokens();
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
        if (THEMES[themeId]) updateSettings({ theme: themeId });
        return SETTINGS.theme;
      },
      lamp(on) {
        updateSettings({ lamp: on !== false });
      },
      /** 默认只保留轻量自检；开启后才扫描 DOM、记录卡顿并自动采样 GPU。 */
      diagnostics(on) {
        updateSettings({ diagnostics: on !== false });
      },
      /** 关掉墨迹光标：宿主自己的光标立刻回来（caret-color 会被还原）。 */
      caret(on) {
        caret.enabled = on !== false;
        if (!caret.enabled) caret.hide();
        return caret.enabled;
      },
      /** 滚条形态：'clip' 纸夹 / 'bar' 细杆 / 'native' 原生。 */
      scroll(style) {
        const next = ["clip", "bar", "native"].indexOf(style) < 0 ? "clip" : style;
        updateSettings({ scrollbar: { style: next } });
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
          return { error: String(error).slice(0, 200) };
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
      off() {
        if (teardown) teardown();
      }
    };
    teardown = () => {
      if (stopped) return;
      stopped = true;
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      observer.disconnect();
      appearanceObserver.disconnect();
      if (colorSchemeQuery) {
        if (typeof colorSchemeQuery.removeEventListener === "function") colorSchemeQuery.removeEventListener("change", onHostAppearanceChange);
        else if (typeof colorSchemeQuery.removeListener === "function") colorSchemeQuery.removeListener(onHostAppearanceChange);
      }
      window.removeEventListener("resize", reposition);
      document.removeEventListener("selectionchange", onSelection);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", onKeyForAudit, true);
      paperCanvas.removeEventListener("webglcontextlost", onContextLost);
      paperCanvas.removeEventListener("webglcontextrestored", onContextRestored);
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
      clearTimeout(remoteTimer);
      restoreOwnedStyles();
      delete window.__dshNocturne;
    };
  }
  function unmount() {
    if (teardown) {
      const run = teardown;
      teardown = null;
      run();
    }
  }
  function registerSettingsPage(ctx) {
    if (!ctx || !ctx.slots || !settingsPageComponent) return;
    return ctx.slots.inject("settings.section", () => ctx.slots.register({
      name: "settings.section",
      id: "nocturne",
      order: 24,
      label: () => "缮写室"
    }, settingsPageComponent));
  }
  var name = "dsh-nocturne";
  var inject = ["slots"];
  function apply(ctx) {
    mount();
    if (ctx && typeof ctx.effect === "function") {
      ctx.effect(() => registerSettingsPage(ctx), "dsh-nocturne: settings section");
    } else {
      registerSettingsPage(ctx);
    }
    return unmount;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (!document.querySelector("canvas[" + PAPER_ATTR + "]")) mount();
    }, { once: true });
  } else if (!document.querySelector("canvas[" + PAPER_ATTR + "]")) {
    mount();
  }
  return __toCommonJS(client_entry_exports);
})();

    module.exports = __DshNocturneModule;
    Object.defineProperty(module.exports, Symbol.toStringTag, {value: 'Module'});
    return module.exports;
  }
});
