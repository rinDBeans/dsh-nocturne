#!/usr/bin/env node
/** 从同一组 ES 模块构建离线样张与 DSH 客户端；--check 只检查产物是否最新。 */
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, relative} from 'node:path';
import {build} from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
// 包就在仓库根上：tools/ 的上一级同时是包目录与仓库目录。
const repo = join(here, '..');
const pkg = repo;
const check = process.argv.includes('--check');
const paths = {
  template: join(repo, 'sample', 'nocturne-desk.template.html'),
  sampleEntry: join(repo, 'sample', 'nocturne-desk.js'),
  sampleOut: join(repo, 'sample', 'nocturne-desk.html'),
  clientEntry: join(pkg, 'src', 'client-entry.js'),
  clientOut: join(pkg, 'lib', 'client.js'),
  hostEntry: join(pkg, 'src', 'host.js'),
  hostOut: join(pkg, 'lib', 'index.js'),
  style: join(pkg, 'src', 'style.css'),
  caret: join(pkg, 'src', 'caret.css'),
  shared: join(pkg, 'src', 'shared.css'),
  settingsStyle: join(pkg, 'src', 'settings-page.css'),
  manifest: join(pkg, 'package.json')
};

async function bundle(entryPoint, globalName, options = {}) {
  const result = await build({
    absWorkingDir: repo,
    entryPoints: [entryPoint], bundle: true, write: false,
    format: options.format || 'iife', globalName,
    platform: options.platform || 'browser', target: options.target || 'es2020',
    external: options.external || [],
    charset: 'utf8', legalComments: 'inline', logLevel: 'silent'
  });
  return result.outputFiles[0].text.trimEnd();
}

function replaceRequired(source, marker, value) {
  if (!source.includes(marker)) throw new Error('模板缺少占位符：' + marker);
  return source.replace(marker, () => value);
}

function emit(file, content) {
  const normalized = content.endsWith('\n') ? content : content + '\n';
  if (check) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== normalized) {
      throw new Error('产物不是最新：' + relative(repo, file));
    }
    console.log('✓ ' + relative(repo, file));
    return;
  }
  if (existsSync(file) && readFileSync(file, 'utf8') === normalized) {
    console.log('= ' + relative(repo, file) + '（无变化）');
    return;
  }
  writeFileSync(file, normalized, 'utf8');
  console.log('✓ ' + relative(repo, file) + '（' + Buffer.byteLength(normalized) + ' bytes）');
}

const [clientBundle, sampleBundle, hostBundle] = await Promise.all([
  bundle(paths.clientEntry, '__DshNocturneModule', {external: ['react']}),
  bundle(paths.sampleEntry, '__NocturneSample'),
  bundle(paths.hostEntry, undefined, {platform: 'node', format: 'esm', target: 'node18'})
]);
const caretCss = readFileSync(paths.caret, 'utf8')
  .replace(/\/\*>>> studio-css \*\/[\s\S]*?\/\*<<< studio-css \*\//g, '')
  .replace('z-index:1;', 'z-index: 2147481999;')
  .replaceAll('var(--cursor)', 'var(--dn-caret-ink, #3a2c20)')
  .replaceAll('var(--paper)', 'var(--dsw-alias-bg-base, #efdfbd)')
  .replaceAll('var(--font-mono)', 'var(--dsh-font-family-code, ui-monospace, monospace)');
const sharedCss = readFileSync(paths.shared, 'utf8')
  .replaceAll('var(--gilt)', 'var(--dn-metal, #b8904c)');
const cssText = readFileSync(paths.style, 'utf8') + '\n' + caretCss + '\n' + sharedCss
  + '\n' + readFileSync(paths.settingsStyle, 'utf8');
const version = JSON.parse(readFileSync(paths.manifest, 'utf8')).version;

const client = [
  '/**',
  ' * dsh-nocturne — 浏览器半。由 ES 模块构建，请勿直接编辑。',
  ' * 上游配方来自 Chaosnap/Typewriter-Nocturne（MIT）。',
  ' */',
  'window.__ModuleLoader__.load({',
  "  id: 'dsh-nocturne',",
  '  factory: (require) => {',
  '    var module = { exports: {} };',
  '    var exports = module.exports;',
  '    const CSS_TEXT = ' + JSON.stringify(cssText) + ';',
  '    const DN_VERSION = ' + JSON.stringify(version) + ';',
  '',
  clientBundle,
  '',
  '    module.exports = __DshNocturneModule;',
  "    Object.defineProperty(module.exports, Symbol.toStringTag, {value: 'Module'});",
  '    return module.exports;',
  '  }',
  '});',
  ''
].join('\n');

let sample = readFileSync(paths.template, 'utf8');
sample = replaceRequired(sample, '/*__CARET_CSS__*/', readFileSync(paths.caret, 'utf8'));
sample = replaceRequired(sample, '/*__SHARED_CSS__*/', readFileSync(paths.shared, 'utf8'));
sample = replaceRequired(sample, '/*__NOCTURNE_BUNDLE__*/', sampleBundle.replace(/<\/script/gi, '<\\/script'));
emit(paths.sampleOut, sample);
emit(paths.clientOut, client);
emit(paths.hostOut, hostBundle);
