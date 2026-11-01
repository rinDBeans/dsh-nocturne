import {SETTINGS, PAPERS, THEMES} from './state.js';

const STUDIO_THEMES = [
  {id: 'paper-and-ink', name: '纸与墨'},
  {id: 'midnight-study', name: '子夜书斋'},
  {id: 'moonlit-poetry', name: '月下诗稿'}
];
const STUDIO_PAPERS = [
  {id: 'onionskin', name: '葱皮'},
  {id: 'cotton', name: '棉浆'},
  {id: 'laid', name: '帘纹'},
  {id: 'linen', name: '亚麻'},
  {id: 'parchment', name: '羊皮'},
  {id: 'night', name: '夜纸'}
];
const STUDIO_COEXIST = [
  {id: 'auto', name: '自动'},
  {id: 'material', name: '只叠材质'},
  {id: 'full', name: '接管配色'}
];
const STUDIO_CURSORS = [
  {id: 'ink', name: '墨迹'},
  {id: 'quill', name: '羽毛'},
  {id: 'none', name: '原生'}
];
const STUDIO_SCROLL = [
  {id: 'clip', name: '纸夹'},
  {id: 'bar', name: '细杆'},
  {id: 'native', name: '原生'}
];
/** 四种金属：高光 → 本体 → 暗边，直接做成色片给按钮用。 */
const STUDIO_FINISHES = [
  {id: 'silver', name: '银', swatch: 'linear-gradient(140deg,#ffffff,#b9bfc7 55%,#4d535b)'},
  {id: 'brass', name: '黄铜', swatch: 'linear-gradient(140deg,#fff1c6,#c19a52 55%,#4f3712)'},
  {id: 'gold', name: '金', swatch: 'linear-gradient(140deg,#fff6cf,#d9ad4c 55%,#6a4a0c)'},
  {id: 'black', name: '黑', swatch: 'linear-gradient(140deg,#9a9a9e,#2e2e31 55%,#060607)'}
];
const STUDIO_SLIDERS = [
  {key: 'intensity', label: '灯强', min: 0, max: 2, step: 0.05, format: (v) => Math.round(v * 100) + '%'},
  {key: 'spread', label: '光锥', min: 20, max: 160, step: 1, format: (v) => Math.round(v) + '°'},
  {key: 'softness', label: '柔边', min: 0, max: 1, step: 0.01, format: (v) => Math.round(v * 100) + '%'},
  {key: 'grain', label: '胶片颗粒', min: 0, max: 1, step: 0.01, format: (v) => Math.round(v * 100) + '%'},
  {key: 'particles', label: '光里尘埃', min: 0, max: 1, step: 0.01, format: (v) => Math.round(v * 100) + '%'},
  {key: 'texture', label: '纸纹深度', min: 0, max: 1.6, step: 0.02, format: (v) => Math.round(v * 100) + '%'}
];

function buildStudio(options) {
  const onChange = options.onChange;
  const state = options.state();

  const root = document.createElement('div');
  root.className = 'dn-studio';
  root.dataset.open = 'false';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '缮写室');

  const part = [];
  part.push('<button class="close" type="button" aria-label="关闭">×</button>');
  part.push('<div class="eyebrow">Nocturne Studio</div>');
  part.push('<h2>灯、纸与墨</h2>');
  part.push('<div class="group"><h3>房间</h3><div class="grid" data-group="theme"></div></div>');
  part.push('<div class="group"><h3>纸</h3><div class="grid" data-group="paper"></div></div>');
  part.push('<div class="group"><div class="switch"><span class="label">台灯</span>'
    + '<button class="toggle" type="button" role="switch" aria-checked="true" aria-label="台灯"></button></div></div>');
  part.push('<div class="group" data-group="sliders"></div>');
  part.push('<div class="group"><h3>光标</h3><div class="grid" data-group="cursor"></div></div>');
  part.push('<div class="group"><h3>滚条</h3><div class="grid" data-group="scroll"></div>'
    + '<div class="grid" data-group="finish" hidden></div>'
    + '<div data-group="bar-slider" hidden></div>'
    + '<p class="note" data-group="scroll-hint">纸夹是 Gem 夹，夹在纸的右缘：外圈在纸前、'
    + '内舌压在纸上、弯头探出纸外。拖动它就能卷动正文。</p></div>');
  part.push('<div class="group"><h3>共存</h3><div class="grid" data-group="coexist"></div>'
    + '<p class="note" data-group="coexist-hint" hidden></p></div>');
  part.push('<div class="group"><button class="reset" type="button">回到标定值</button></div>');
  part.push('<div class="group"><p class="note">纸、灯、墨的色值与纸面参数取自 Typewriter-Nocturne（MIT）。'
    + '这里的每一项都直接改渲染参数，改完即见。</p></div>');
  root.innerHTML = part.join('');

  const groupOf = (name) => root.querySelector('[data-group="' + name + '"]');

  function choiceButton(id, label, swatch) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.value = id;
    button.setAttribute('aria-pressed', 'false');
    if (swatch) {
      const chip = document.createElement('span');
      chip.className = 'swatch';
      chip.style.background = swatch;
      button.appendChild(chip);
    }
    const text = document.createElement('span');
    text.textContent = label;
    button.appendChild(text);
    return button;
  }

  for (const item of STUDIO_THEMES) {
    const theme = THEMES[item.id];
    const swatch = 'linear-gradient(140deg, ' + theme.palette.room + ' 0 52%, ' + theme.light.color + ' 52% 100%)';
    groupOf('theme').appendChild(choiceButton(item.id, item.name, swatch));
  }
  for (const item of STUDIO_PAPERS) {
    groupOf('paper').appendChild(choiceButton(item.id, item.name, PAPERS[item.id].paper));
  }
  for (const item of STUDIO_CURSORS) {
    groupOf('cursor').appendChild(choiceButton(item.id, item.name, null));
  }
  for (const item of STUDIO_COEXIST) {
    groupOf('coexist').appendChild(choiceButton(item.id, item.name, null));
  }
  for (const item of STUDIO_SCROLL) {
    groupOf('scroll').appendChild(choiceButton(item.id, item.name, null));
  }
  for (const item of STUDIO_FINISHES) {
    groupOf('finish').appendChild(choiceButton(item.id, item.name, item.swatch));
  }

  const reads = [];

  /** 组内的小滑杆：值落在嵌套对象里，所以读和写都走取值函数。 */
  function miniSlider(host, spec) {
    const wrap = document.createElement('div');
    wrap.className = 'slider';
    const head = document.createElement('div');
    head.className = 'head';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = spec.label;
    const value = document.createElement('span');
    value.className = 'value';
    head.append(label, value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.setAttribute('aria-label', spec.label);
    input.addEventListener('input', () => {
      const next = Number(input.value);
      value.textContent = spec.format(next);
      onChange(spec.key, next);
    });
    wrap.append(head, input);
    host.appendChild(wrap);
    reads.push(() => {
      const current = spec.value();
      input.value = String(current);
      value.textContent = spec.format(current);
    });
  }

  miniSlider(groupOf('bar-slider'), {
    key: 'scrollBarWidth', label: '杆宽', min: 3, max: 14, step: 1,
    format: (v) => Math.round(v) + 'px', value: () => state.scrollbar.barWidth
  });
  miniSlider(groupOf('bar-slider'), {
    key: 'scrollBarOpacity', label: '杆不透明度', min: 0.1, max: 1, step: 0.05,
    format: (v) => Math.round(v * 100) + '%', value: () => state.scrollbar.barOpacity
  });

  for (const slider of STUDIO_SLIDERS) {
    const wrap = document.createElement('div');
    wrap.className = 'slider';
    const head = document.createElement('div');
    head.className = 'head';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = slider.label;
    const value = document.createElement('span');
    value.className = 'value';
    head.append(label, value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.setAttribute('aria-label', slider.label);
    input.addEventListener('input', () => {
      const next = Number(input.value);
      value.textContent = slider.format(next);
      onChange(slider.key, next);
    });
    wrap.append(head, input);
    groupOf('sliders').appendChild(wrap);
    reads.push(() => {
      input.value = String(state[slider.key]);
      value.textContent = slider.format(state[slider.key]);
    });
  }

  const toggle = root.querySelector('.toggle');
  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-checked') !== 'true';
    toggle.setAttribute('aria-checked', String(next));
    onChange('lamp', next);
  });

  root.querySelector('.reset').addEventListener('click', () => {
    onChange('preset', 'calibrated');
    sync();
  });

  root.querySelector('.close').addEventListener('click', () => {
    root.dataset.open = 'false';
    handle.setAttribute('aria-expanded', 'false');
  });

  // 组名不等于设置键：光标那组叫 cursor，设置里叫 cursorMode。
  const KEY_OF = {
    theme: 'theme', paper: 'paper', cursor: 'cursor', coexist: 'coexist',
    scroll: 'scrollStyle', finish: 'scrollFinish'
  };
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button.choice');
    if (!button) return;
    const group = button.parentElement.dataset.group;
    onChange(KEY_OF[group] || group, button.dataset.value);
    sync();
  });

  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'dn-handle';
  handle.setAttribute('aria-expanded', 'false');
  handle.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 4h10M3 8h10M3 12h6"/></svg><span>缮写室</span>';
  handle.addEventListener('click', () => {
    const open = root.dataset.open !== 'true';
    root.dataset.open = String(open);
    handle.setAttribute('aria-expanded', String(open));
  });

  function sync() {
    const mark = (group, active) => {
      for (const button of root.querySelectorAll('[data-group="' + group + '"] button.choice')) {
        button.setAttribute('aria-pressed', String(button.dataset.value === active));
      }
    };
    mark('theme', state.theme);
    mark('paper', state.paper);
    mark('cursor', state.cursorMode);
    mark('coexist', state.coexist);
    mark('scroll', state.scrollbar.style);
    mark('finish', state.scrollbar.finish);
    // 金属只在"纸夹"下有意义，杆宽只在"细杆"下有意义——没有的项不显示。
    groupOf('finish').hidden = state.scrollbar.style !== 'clip';
    groupOf('bar-slider').hidden = state.scrollbar.style !== 'bar';
    // 探测到别的皮肤在改同一批 token 时，明说一句，并给出一键切换。
    const hint = root.querySelector('[data-group="coexist-hint"]');
    const foreign = typeof options.foreign === 'function' ? options.foreign() : null;
    const resolved = typeof options.resolvedCoexist === 'function'
      ? options.resolvedCoexist()
      : (state.coexist === 'auto' ? (foreign ? 'material' : 'full') : state.coexist);
    if (hint) {
      if (foreign) {
        hint.hidden = false;
        const why = state.coexist === 'auto' ? '已自动让位：' : '';
        hint.textContent = '检测到 ' + foreign + ' 正在覆盖同一批配色 token。'
          + (resolved === 'material'
            ? why + '只叠纸与灯，两套皮肤可以叠着用。'
            : why + '本皮肤接管配色——两套同时改同一批 token，谁后加载谁赢。');
      } else {
        hint.hidden = true;
      }
    }
    toggle.setAttribute('aria-checked', String(state.lamp));
    for (const read of reads) read();
  }
  sync();

  return {element: root, handle, sync};
}

/* ═══════════════════════════════════════════════════════════════════════════
   5.9 · 纸夹滚条
   上游（lib/nocturne/components/scroll-clip.tsx）：一枚 Gem 夹夹在纸的右缘——
   外圈在纸前，内舌在纸后（只留下压住纸面的一道痕），弯头探出纸外。它跟着滚动
   位置走弹簧（5Hz / 阻尼 0.72），移动时朝反方向微微歪一下（3.2Hz / 0.35）。

   这里没有终端，所以"滚动"换成任意滚动容器：从视口中线上那一点往上找。
   整棵树可能上万节点，逐元素问 overflow 会把主线程按住——elementFromPoint
   只走一条祖先链，代价与树的大小无关。
   ═══════════════════════════════════════════════════════════════════════ */
/** 画布 100 × 31 单位；屏幕上 84 × 26，纸边落在 88 单位处，所以弯头刚好探出去。 */

export {buildStudio};
