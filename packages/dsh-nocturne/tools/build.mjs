#!/usr/bin/env node
/**
 * 从样张抽取渲染核心，拼成 DSH 客户端插件。
 *
 * 单一真源：sample/nocturne-desk.html 的 <script> 里 1-5 节（数据 / 数学 / 灯 / 纸 / 辉光）。
 * 抽取而不是复制，是为了避免"样张好看、宿主走样"这种最常见的漂移。
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const samplePath = join(repo, 'sample', 'nocturne-desk.html');
const adapterPath = join(here, '..', 'src', 'adapter.js');
const stylePath = join(here, '..', 'src', 'style.css');
const outPath = join(here, '..', 'lib', 'client.js');

const html = readFileSync(samplePath, 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
if (!script) throw new Error('sample 里没有找到 <script>');

const marker = '6 · 装配与主循环';
const at = script.indexOf(marker);
if (at < 0) throw new Error('找不到 1-5 节与第 6 节的分界');
const cut = script.lastIndexOf('/*', at);
const core = script.slice(0, cut).trimEnd();

const adapter = readFileSync(adapterPath, 'utf8').trimEnd();
const css = readFileSync(stylePath, 'utf8');

// 墨迹光标的样式只在样张里维护一份，构建时抽过来，避免两处各写一套。
const caretMatch = html.match(/\/\*>>> caret-css \*\/([\s\S]*?)\/\*<<< caret-css \*\//);
if (!caretMatch) throw new Error('样张里的 caret-css 标记变了');
const caretCss = caretMatch[1]
  .replace('z-index:1;', 'z-index: 2147481999;')                    // 压在纸光之下，但高于宿主界面
  .replaceAll('var(--cursor)', 'var(--dn-caret-ink, #3a2c20)')
  .replaceAll('var(--paper)', 'var(--dsw-alias-bg-base, #efdfbd)')
  .replaceAll('var(--font-mono)', 'var(--dsh-font-family-code, ui-monospace, monospace)');

// 纸夹的样式同样只在样张里维护一份，抽过来时把样张的变量名换成插件自己的。
const sharedMatch = html.match(/\/\*>>> shared-css \*\/([\s\S]*?)\/\*<<< shared-css \*\//);
if (!sharedMatch) throw new Error('样张里的 shared-css 标记变了');
const sharedCss = sharedMatch[1]
  .replaceAll('var(--gilt)', 'var(--dn-metal, #b8904c)');

const cssLiteral = 'const CSS_TEXT = ' + JSON.stringify(css + '\n' + caretCss + '\n' + sharedCss) + ';';
// 版本号从 package.json 注入：自检里带上它，才能确认宿主跑的是哪一版。
const version = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')).version;

const lines = [];
lines.push('/**');
lines.push(' * dsh-nocturne — 浏览器半。');
lines.push(' *');
lines.push(' * 纸、灯、辉光三层的渲染代码由 tools/build.mjs 从 sample/nocturne-desk.html 抽取；');
lines.push(' * 上游配方来自 Chaosnap/Typewriter-Nocturne（MIT），随包保留其版权行。');
lines.push(' *');
lines.push(' *   核心 ' + core.split('\n').length + ' 行 · 适配 ' + adapter.split('\n').length + ' 行 · 样式 ' + css.split('\n').length + ' 行');
lines.push(' *   样张 ' + relative(repo, samplePath).replace(/\\/g, '/') + '（' + statSync(samplePath).size + ' bytes）');
lines.push(' */');
lines.push("window.__ModuleLoader__.load({");
lines.push("  id: 'dsh-nocturne',");
lines.push('  factory: (require) => {');
lines.push('    var module = { exports: {} };');
lines.push('    var exports = module.exports;');
lines.push("    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });");
lines.push('');
lines.push(core);
lines.push('');
lines.push(cssLiteral);
lines.push('');
lines.push('const DN_VERSION = ' + JSON.stringify(version) + ';');
lines.push('');
lines.push(adapter);
lines.push('');
lines.push('    return module.exports;');
lines.push('  }');
lines.push('});');
lines.push('');

const file = lines.join('\n');
writeFileSync(outPath, file);
console.log('client.js:', file.split('\n').length, 'lines,', file.length, 'bytes');
console.log('core lines:', core.split('\n').length);
