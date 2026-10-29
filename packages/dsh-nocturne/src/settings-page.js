import React, {useSyncExternalStore} from 'react';
import {PAPERS, THEMES} from './core/state.js';

const h = React.createElement;
const PAPERS_LIST = [
  ['onionskin', '葱皮纸'], ['cotton', '棉浆纸'], ['laid', '帘纹纸'],
  ['linen', '亚麻纸'], ['parchment', '羊皮纸'], ['night', '夜纸']
];
const THEMES_LIST = [
  ['paper-and-ink', '纸与墨'], ['midnight-study', '午夜书房'], ['moonlit-poetry', '月光诗页']
];
const CURSORS = [['ink', '墨迹'], ['quill', '羽毛'], ['none', '原生']];
const SCROLLS = [['clip', '纸夹'], ['bar', '细杆'], ['native', '原生']];
const FINISHES = [['silver', '银'], ['brass', '黄铜'], ['gold', '金'], ['black', '黑']];
const COEXISTS = [['auto', '自动'], ['material', '只叠材质'], ['full', '接管配色']];
const SLIDERS = [
  ['intensity', '灯强', 0, 2, 0.05, (v) => Math.round(v * 100) + '%'],
  ['spread', '光锥', 20, 160, 1, (v) => Math.round(v) + '°'],
  ['softness', '柔边', 0, 1, 0.01, (v) => Math.round(v * 100) + '%'],
  ['grain', '胶片颗粒', 0, 1, 0.01, (v) => Math.round(v * 100) + '%'],
  ['particles', '光里尘埃', 0, 1, 0.01, (v) => Math.round(v * 100) + '%'],
  ['texture', '纸纹深度', 0, 1.6, 0.02, (v) => Math.round(v * 100) + '%']
];

function Group({title, children}) {
  return h('section', {className: 'dn-settings-group', 'aria-label': title},
    h('h3', {className: 'dn-settings-group-title'}, title),
    h('div', {className: 'dn-settings-group-rows'}, children));
}

function Row({id, title, description, block = false, children}) {
  return h('div', {
    className: 'dn-settings-row' + (block ? ' dn-settings-row-block' : ''),
    'data-setting': id
  },
    h('div', {className: 'dn-settings-row-text'},
      h('div', {className: 'dn-settings-row-title'}, title),
      description ? h('div', {className: 'dn-settings-row-desc'}, description) : null),
    h('div', {className: 'dn-settings-row-control'}, children));
}

function Segment({label, value, choices, onChange}) {
  return h('div', {className: 'dn-segments', role: 'group', 'aria-label': label},
    choices.map(([id, name]) => h('button', {
      key: id, type: 'button', className: 'dn-segment',
      'data-active': value === id ? '' : undefined,
      'aria-pressed': value === id ? 'true' : 'false',
      onClick: () => { if (value !== id) onChange(id); }
    }, name)));
}

function PaperGrid({value, onChange}) {
  return h('div', {className: 'dn-paper-grid', role: 'group', 'aria-label': '纸张'},
    PAPERS_LIST.map(([id, name]) => h('button', {
      key: id, type: 'button', className: 'dn-paper-choice',
      'data-active': value === id ? '' : undefined,
      'aria-pressed': value === id ? 'true' : 'false',
      onClick: () => { if (value !== id) onChange(id); }
    },
      h('span', {className: 'dn-paper-swatch', style: {backgroundColor: PAPERS[id].paper}, 'aria-hidden': 'true'}),
      h('span', {className: 'dn-paper-name'}, name))));
}

function Toggle({label, value, onChange}) {
  return h('button', {
    type: 'button', className: 'dn-switch', role: 'switch',
    'aria-label': label, 'aria-checked': value ? 'true' : 'false',
    'data-on': value ? '' : undefined,
    onClick: () => onChange(!value)
  }, h('span', {className: 'dn-switch-knob', 'aria-hidden': 'true'}));
}

function Slider({label, value, min, max, step, format, onChange}) {
  const progress = max === min ? 0 : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return h('div', {className: 'dn-slider'},
    h('div', {className: 'dn-slider-range', style: {'--dn-range-progress': progress + '%'}},
      h('input', {
        type: 'range', 'aria-label': label, min, max, step, value,
        onInput: (event) => onChange(Number(event.currentTarget.value))
      })),
    h('output', {className: 'dn-slider-value'}, format(value)));
}

export function createNocturneSettings(options) {
  const subscribe = options.subscribe;
  const getRevision = options.revision;
  const getState = options.state;
  const change = options.onChange;

  return function NocturneSettings() {
    useSyncExternalStore(subscribe, getRevision, getRevision);
    const settings = getState();
    const resolved = options.resolvedCoexist();
    const foreign = options.foreign();
    const coexistHint = resolved === 'material'
      ? (foreign ? '检测到 ' + foreign + '：保留其配色与字体，只叠加纸和灯。' : '保留宿主配色与字体，只叠加纸和灯。')
      : '由缮写室接管纸色、墨色和组件表面；切回材质模式即可还原。';

    return h('main', {
      className: 'dn-settings',
      'data-dn-settings': '',
      'data-appearance': PAPERS[settings.paper].appearance
    },
      h('header', {className: 'dn-settings-header'},
        h('div', null,
          h('h2', {className: 'dn-settings-title'}, '缮写室'),
          h('p', {className: 'dn-settings-subtitle'}, '纸、灯与墨 · 所有调整即时预览并自动保存'))),

      h(Group, {title: '纸张与房间'},
        h(Row, {id: 'paper', title: '纸张', description: '决定纸色、墨色、纤维与做旧纹理。', block: true},
          h(PaperGrid, {value: settings.paper, onChange: (value) => change('paper', value)})),
        h(Row, {id: 'theme', title: '房间', description: '改变光源、房间气氛与选区色。'},
          h(Segment, {label: '房间', value: settings.theme, choices: THEMES_LIST, onChange: (value) => change('theme', value)}))),

      h(Group, {title: '灯光与纸纹'},
        h(Row, {id: 'lamp', title: '台灯', description: '关闭后只保留环境光。'},
          h(Toggle, {label: '台灯', value: settings.lamp, onChange: (value) => change('lamp', value)})),
        h(Row, {id: 'ambientMotion', title: '环境动效', description: '默认静态。开启后颗粒与尘埃持续运动，会增加全屏重绘。'},
          h(Toggle, {label: '环境动效', value: settings.ambientMotion, onChange: (value) => change('ambientMotion', value)})),
        SLIDERS.map(([key, label, min, max, step, format]) => h(Row, {
          key, id: key, title: label,
          description: key === 'texture' ? '调整纤维、褶皱与纸面起伏；较高数值需要重建纸面。' : undefined
        }, h(Slider, {
          label, value: settings[key], min, max, step, format,
          onChange: (value) => change(key, value)
        })))),

      h(Group, {title: '光标与滚动'},
        h(Row, {id: 'cursorMode', title: '光标', description: 'IME 合成、拖选或测量失败时自动回到原生光标。'},
          h(Segment, {label: '光标', value: settings.cursorMode, choices: CURSORS, onChange: (value) => change('cursor', value)})),
        h(Row, {id: 'scrollbar', title: '滚动条', description: '保留键盘、触控板和原生滚动物理。'},
          h(Segment, {label: '滚动条', value: settings.scrollbar.style, choices: SCROLLS, onChange: (value) => change('scrollStyle', value)})),
        settings.scrollbar.style === 'clip' ? h(Row, {id: 'scrollFinish', title: '纸夹金属'},
          h(Segment, {label: '纸夹金属', value: settings.scrollbar.finish, choices: FINISHES, onChange: (value) => change('scrollFinish', value)})) : null,
        settings.scrollbar.style === 'bar' ? h(React.Fragment, null,
          h(Row, {id: 'scrollBarWidth', title: '细杆宽度'},
            h(Slider, {label: '细杆宽度', value: settings.scrollbar.barWidth, min: 3, max: 14, step: 1,
              format: (value) => Math.round(value) + ' px', onChange: (value) => change('scrollBarWidth', value)})),
          h(Row, {id: 'scrollBarOpacity', title: '细杆不透明度'},
            h(Slider, {label: '细杆不透明度', value: settings.scrollbar.barOpacity, min: 0.1, max: 1, step: 0.05,
              format: (value) => Math.round(value * 100) + '%', onChange: (value) => change('scrollBarOpacity', value)}))) : null),

      h(Group, {title: '共存与诊断'},
        h(Row, {id: 'coexist', title: '与其他皮肤共存', description: coexistHint},
          h(Segment, {label: '与其他皮肤共存', value: settings.coexist, choices: COEXISTS, onChange: (value) => change('coexist', value)})),
        h(Row, {id: 'diagnostics', title: '诊断记录', description: '默认关闭。开启后记录 DOM 变化、卡顿和 GPU 采样，用于排查渲染问题。'},
          h(Toggle, {label: '诊断记录', value: settings.diagnostics, onChange: (value) => change('diagnostics', value)})),
        h(Row, {id: 'preset', title: '恢复标定值', description: '恢复默认纸张、房间、灯光、光标与滚动设置。'},
          h('button', {type: 'button', className: 'dn-reset', onClick: () => change('preset', 'calibrated')}, '回到标定值'))),

      h('footer', {className: 'dn-settings-footer'},
        h('span', null, 'Nocturne · 本地渲染'),
        h('span', null, THEMES[settings.theme].light.source)));
  }
}
