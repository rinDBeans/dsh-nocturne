const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {buildSync} = require('esbuild');

const repo = path.resolve(__dirname, '../..');
const adapterPath = path.join(repo, 'packages/dsh-nocturne/src/adapter.js');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const prefix = adapter.slice(0, adapter.indexOf('function mount()'));
const exposure = [
  'globalThis.contract = {',
  'SETTINGS, NOCTURNE_DEFAULTS, PAPERS, THEMES, PaperLight, paperFor, setPaperAppearance,',
  'applyTokens, tokenMode, mergeSettings, normalize, snapshot,',
  'restoreOwnedStyles',
  '};'
].join('\n');
const bundle = buildSync({
  stdin: {
    contents: prefix + '\n' + exposure,
    resolveDir: path.dirname(adapterPath),
    sourcefile: 'adapter-contract.js',
    loader: 'js'
  },
  bundle: true, write: false, format: 'iife', platform: 'browser',
  target: 'es2020', charset: 'utf8', external: ['react'], logLevel: 'silent'
}).outputFiles[0].text;

function styleDeclaration() {
  const values = new Map();
  return {
    setProperty(name, value, priority = '') { values.set(name, {value: String(value), priority}); },
    removeProperty(name) {
      const old = values.get(name);
      values.delete(name);
      return old ? old.value : '';
    },
    getPropertyValue(name) { return values.has(name) ? values.get(name).value : ''; },
    getPropertyPriority(name) { return values.has(name) ? values.get(name).priority : ''; },
    inspect(name) { return values.get(name); }
  };
}

function loadContract() {
  const rootStyle = styleDeclaration();
  const bodyStyle = styleDeclaration();
  const context = {
    console,
    require: () => ({}),
    window: {matchMedia: () => ({matches: false})},
    document: {
      documentElement: {style: rootStyle},
      body: {style: bodyStyle},
      createElement: () => ({getContext: () => ({})})
    },
    getComputedStyle: (element) => ({
      getPropertyValue: (name) => element.style.getPropertyValue(name)
    }),
    localStorage: {getItem: () => null, setItem: () => {}}
  };
  vm.createContext(context);
  vm.runInContext(bundle, context);
  return {...context.contract, rootStyle, bodyStyle};
}
module.exports = {loadContract, styleDeclaration};
