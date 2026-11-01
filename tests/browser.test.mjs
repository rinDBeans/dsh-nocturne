import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const repo = fileURLToPath(new URL('..', import.meta.url));
const clientSource = fs.readFileSync(path.join(repo, 'packages/dsh-nocturne/lib/client.js'), 'utf8');
const reactSource = fs.readFileSync(path.join(repo, 'node_modules/react/umd/react.production.min.js'), 'utf8');
const reactDomSource = fs.readFileSync(path.join(repo, 'node_modules/react-dom/umd/react-dom.production.min.js'), 'utf8');
const candidates = [
  process.env.EDGE_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);
const edgePath = candidates.find((file) => fs.existsSync(file));
const options = edgePath ? {} : {skip: 'Microsoft Edge not found' };
let browser;
let server;
let origin;

const shell = [
  '<!doctype html><html style="--dsw-alias-bg-base: host-root !important; --dn-light-rgb: 1 2 3">',
  '<head><meta charset="utf-8"><style>body{margin:0}#scroll{height:400px;overflow-y:auto}#content{height:2000px}</style></head>',
  '<body style="--dsw-specific-bubble: host-body">',
  '<main id="scroll"><div id="content">会话</div></main><div id="editor" contenteditable="true">输入文字</div>',
  '<script>window.__ModuleLoader__={load(def){window.__plugin=def.factory(()=>({}))}};</script>',
  '<script src="/client.js"></script></body></html>'
].join('');

const settingsShell = [
  '<!doctype html><html><head><meta charset="utf-8"><style>',
  ':root{--dsw-font-family:Inter,system-ui,sans-serif;--dsw-alias-brand-primary:#b8904c;--dsw-alias-bg-overlay:#fff;--dsw-alias-bg-layer-1:#f7f4ed;--dsw-alias-bg-layer-2:#fff;--dsw-alias-bg-layer-3:#fff;--dsw-alias-label-primary:#28241f;--dsw-alias-label-secondary:#6f675d;--dsw-alias-label-tertiary:#8a8177;--dsw-alias-label-caption:#9a9187;--dsw-alias-border-l1:#e4ded4;--dsw-alias-border-l2:#d4cabc;--dsw-specific-selector:#ece7de;--dsw-alias-interactive-bg-hover:#00000008;--dsw-radius-md:6px}',
  'body{margin:0;background:#e9e5de;font-family:Inter,system-ui,sans-serif}.settings-panel{display:grid;grid-template-columns:176px minmax(0,1fr);width:900px;height:720px;margin:20px auto;overflow:hidden;border:1px solid #d8d1c7;border-radius:12px;background:#fff}.settings-nav{padding:24px 12px;background:#f5f2ec}.settings-nav-title{margin:0 12px 20px;font-size:16px}.settings-nav button{display:block;width:100%;padding:8px 12px;border:0;border-radius:6px;background:transparent;text-align:left;color:#5f584f}.settings-nav button[data-active]{background:#e6dfd4;color:#211d18}.settings-options{overflow-y:auto;padding:20px 28px;background:#fff}</style></head>',
  '<body><div class="settings-panel"><nav class="settings-nav"><div class="settings-nav-title">设置</div><button>通用</button><button>模型</button><button data-active>缮写室</button></nav><div class="settings-options" id="settings-content"></div></div>',
  '<script>window.__registrations={};window.__effectCleanups=[];window.__ModuleLoader__={load(def){window.__plugin=def.factory((id)=>id==="react"?window.React:{});}};</script>',
  '<script src="/react.js"></script><script src="/react-dom.js"></script><script src="/client.js"></script>',
  '<script>window.__ctx={slots:{inject(name,fn){return fn()},register(meta,component){window.__registrations[meta.id]={meta,component};return()=>{delete window.__registrations[meta.id]}}},effect(fn){const cleanup=fn();if(typeof cleanup==="function")window.__effectCleanups.push(cleanup)}};window.__plugin.apply(window.__ctx);</script>',
  '</body></html>'
].join('');

before(async () => {
  if (!edgePath) return;
  server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/shell') {
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
      res.end(shell);
      return;
    }
    if (pathname === '/settings-shell') {
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
      res.end(settingsShell);
      return;
    }
    if (pathname === '/client.js' || pathname === '/react.js' || pathname === '/react-dom.js') {
      res.writeHead(200, {'content-type': 'text/javascript; charset=utf-8'});
      res.end(pathname === '/client.js' ? clientSource : pathname === '/react.js' ? reactSource : reactDomSource);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({
    executablePath: edgePath, headless: true,
    args: ['--disable-dev-shm-usage']
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function assertBrowserClean(page, errors) {
  assert.deepEqual(errors, []);
  const frameError = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('dsh-nocturne:settings') || '{}').__error || null;
    } catch {
      return null;
    }
  });
  assert.equal(frameError, null);
}

async function shellPage(context, reducedMotion = 'no-preference') {
  const page = await context.newPage({reducedMotion});
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.emulateMedia({reducedMotion});
  await page.goto(origin + '/shell');
  await page.waitForFunction(() => Boolean(window.__dshNocturne));
  return {page, errors};
}

test('native settings section renders and operates all control families', options, async () => {
  const context = await browser.newContext({viewport: {width: 1000, height: 760}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(origin + '/settings-shell');
  await page.waitForFunction(() => Boolean(window.__registrations.nocturne && window.__dshNocturne));
  assert.equal(await page.evaluate(() => window.__registrations.nocturne.meta.label()), '缮写室');
  await page.evaluate(() => {
    window.__settingsRoot = ReactDOM.createRoot(document.querySelector('#settings-content'));
    window.__settingsRoot.render(React.createElement(window.__registrations.nocturne.component));
  });
  await page.waitForSelector('.dn-settings');
  assert.equal(await page.locator('.dn-settings-group').count(), 4);
  assert.equal(await page.locator('[data-setting="paper"] button').count(), 6);
  assert.equal(await page.locator('.dn-studio, .dn-handle').count(), 0);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.dn-settings')).fontFamily), 'Inter, system-ui, sans-serif');

  await page.locator('[data-setting="paper"] button', {hasText: '棉浆纸'}).click();
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--dsw-alias-bg-base') === '#eee6d5');
  await page.locator('[data-setting="theme"] button', {hasText: '月光诗页'}).click();
  assert.equal(await page.evaluate(() => window.__dshNocturne.settings.theme), 'moonlit-poetry');
  const lamp = page.getByRole('switch', {name: '台灯', exact: true});
  await lamp.click();
  assert.equal(await lamp.getAttribute('aria-checked'), 'false');
  const ambient = page.getByRole('switch', {name: '环境动效', exact: true});
  assert.equal(await ambient.getAttribute('aria-checked'), 'false');
  await ambient.click();
  assert.equal(await ambient.getAttribute('aria-checked'), 'true');
  await ambient.click();

  await page.locator('input[aria-label="灯强"]').evaluate((input) => {
    input.value = '1.5';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  assert.equal(await page.evaluate(() => window.__dshNocturne.settings.intensity), 1.5);
  assert.equal(await page.locator('input[aria-label="灯强"]').evaluate((input) => input.parentElement.style.getPropertyValue('--dn-range-progress')), '75%');
  await page.locator('[data-setting="scrollbar"] button', {hasText: '细杆'}).click();
  await page.waitForSelector('[data-setting="scrollBarWidth"]');
  await page.getByRole('switch', {name: '诊断记录', exact: true}).click();
  assert.equal(await page.evaluate(() => window.__dshNocturne.settings.diagnostics), true);

  await page.locator('[data-setting="paper"] button', {hasText: '夜纸'}).click();
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--dsw-alias-bg-base') === '#e9e6f0');
  assert.equal(await page.locator('.dn-settings').getAttribute('data-appearance'), 'light');
  await page.evaluate(() => document.documentElement.setAttribute('data-ds-dark-theme', ''));
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--dsw-alias-bg-base') === '#1d1a20');
  assert.equal(await page.locator('.dn-settings').getAttribute('data-appearance'), 'dark');
  assert.equal(await page.locator('.dn-slider-range').first().evaluate((range) => getComputedStyle(range).getPropertyValue('--dn-slider-fill').trim()), '#c4b8db');
  await page.evaluate(() => document.documentElement.removeAttribute('data-ds-dark-theme'));
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--dsw-alias-bg-base') === '#e9e6f0');

  await page.locator('[data-setting="coexist"] button', {hasText: '只叠材质'}).click();
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--dsw-alias-bg-base')), '');
  await page.locator('.dn-reset').click();
  assert.equal(await page.evaluate(() => window.__dshNocturne.settings.paper), 'parchment');
  assert.equal(await page.evaluate(() => window.__dshNocturne.settings.diagnostics), false);

  await page.locator('.settings-panel').screenshot({path: path.join(repo, 'docs/previews/nocturne-settings-native.png')});
  await page.setViewportSize({width: 480, height: 760});
  const overflow = await page.evaluate(() => {
    const root = document.querySelector('.dn-settings');
    return root.scrollWidth - root.clientWidth;
  });
  assert.ok(overflow <= 1, 'settings must not overflow narrow content: ' + overflow);

  const cleaned = await page.evaluate(() => {
    window.__settingsRoot.unmount();
    for (const cleanup of window.__effectCleanups) cleanup();
    const api = window.__dshNocturne;
    if (api) api.off();
    return {
      registrations: Object.keys(window.__registrations).length,
      floating: document.querySelectorAll('.dn-studio, .dn-handle').length,
      canvases: document.querySelectorAll('canvas[data-dn]').length
    };
  });
  assert.deepEqual(cleaned, {registrations: 0, floating: 0, canvases: 0});
  await assertBrowserClean(page, errors);
  await context.close();
});

test('ink caret measures and follows a contenteditable selection', options, async () => {
  const context = await browser.newContext({viewport: {width: 1100, height: 720}});
  const {page, errors} = await shellPage(context);
  await page.evaluate(() => {
    const editor = document.querySelector('#editor');
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.waitForTimeout(500);
  const shown = await page.evaluate(() => ({
    display: getComputedStyle(document.querySelector('.dn-caret')).display,
    native: document.querySelector('#editor').style.caretColor,
    diag: window.__dshNocturne.diag().caret
  }));
  assert.deepEqual(shown, {display: 'block', native: 'transparent', diag: 'ink'});

  const beforeMove = await page.locator('.dn-caret').getAttribute('style');
  await page.evaluate(() => {
    const editor = document.querySelector('#editor');
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(true);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.waitForTimeout(350);
  const afterMove = await page.locator('.dn-caret').getAttribute('style');
  assert.notEqual(afterMove, beforeMove);

  await page.evaluate(() => document.querySelector('#editor').dispatchEvent(new CompositionEvent('compositionstart', {bubbles: true})));
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.dn-caret').evaluate((caret) => getComputedStyle(caret).display), 'none');
  assert.equal(await page.locator('#editor').evaluate((editor) => editor.style.caretColor), '');
  await page.evaluate(() => document.querySelector('#editor').dispatchEvent(new CompositionEvent('compositionend', {bubbles: true})));
  await page.waitForTimeout(350);
  assert.equal(await page.locator('.dn-caret').evaluate((caret) => getComputedStyle(caret).display), 'block');

  await page.evaluate(() => {
    const editor = document.querySelector('#editor');
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.dn-caret').evaluate((caret) => getComputedStyle(caret).display), 'none');

  const restored = await page.evaluate(() => {
    const editor = document.querySelector('#editor');
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    return new Promise((resolve) => setTimeout(() => {
      const display = getComputedStyle(document.querySelector('.dn-caret')).display;
      window.__dshNocturne.off();
      resolve({display, nativeAfterOff: editor.style.caretColor, carets: document.querySelectorAll('.dn-caret').length});
    }, 350));
  });
  assert.deepEqual(restored, {display: 'block', nativeAfterOff: '', carets: 0});
  await assertBrowserClean(page, errors);
  await context.close();
});

test('quill caret renders its SVG geometry at the selection', options, async () => {
  const context = await browser.newContext({viewport: {width: 1100, height: 720}});
  const {page, errors} = await shellPage(context);
  await page.evaluate(() => {
    window.__dshNocturne.use('parchment', {cursorMode: 'quill'});
    const editor = document.querySelector('#editor');
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.waitForTimeout(500);
  const shown = await page.evaluate(() => ({
    display: getComputedStyle(document.querySelector('.dn-quill')).display,
    inkDisplay: getComputedStyle(document.querySelector('.dn-caret')).display,
    paths: document.querySelectorAll('.dn-quill svg path').length
  }));
  assert.equal(shown.display, 'block');
  assert.equal(shown.inkDisplay, 'none');
  assert.ok(shown.paths > 0, 'expected quill vector paths');
  await assertBrowserClean(page, errors);
  await context.close();
});

test('console API synchronizes tokens and material/off restore host styles', options, async () => {
  const context = await browser.newContext({viewport: {width: 1280, height: 720}});
  const {page, errors} = await shellPage(context);
  await page.evaluate(() => window.__dshNocturne.use('cotton', {intensity: 1.35}));
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--dsw-alias-bg-base') === '#eee6d5');
  const beforeTheme = await page.evaluate(() => document.documentElement.style.getPropertyValue('--dn-selection'));
  await page.evaluate(() => window.__dshNocturne.theme('moonlit-poetry'));
  const afterTheme = await page.evaluate(() => document.documentElement.style.getPropertyValue('--dn-selection'));
  assert.notEqual(afterTheme, beforeTheme);

  await page.evaluate(() => window.__dshNocturne.use('cotton', {coexist: 'material'}));
  const material = await page.evaluate(() => ({
    alias: document.documentElement.style.getPropertyValue('--dsw-alias-bg-base'),
    surface: document.body.style.getPropertyValue('--dsw-specific-bubble'),
    sheet: document.documentElement.style.getPropertyValue('--dn-sheet')
  }));
  assert.deepEqual(material, {alias: 'host-root', surface: 'host-body', sheet: 'transparent'});

  const restored = await page.evaluate(() => {
    const api = window.__dshNocturne;
    api.use('cotton', {coexist: 'full'});
    api.off();
    return {
      alias: document.documentElement.style.getPropertyValue('--dsw-alias-bg-base'),
      surface: document.body.style.getPropertyValue('--dsw-specific-bubble'),
      light: document.documentElement.style.getPropertyValue('--dn-light-rgb'),
      canvases: document.querySelectorAll('canvas[data-dn]').length,
      api: Boolean(window.__dshNocturne)
    };
  });
  assert.deepEqual(restored, {alias: 'host-root', surface: 'host-body', light: '1 2 3', canvases: 0, api: false});
  await assertBrowserClean(page, errors);
  await context.close();
});

test('WebGL context loss and restore recreates a ready renderer', options, async (t) => {
  const context = await browser.newContext({viewport: {width: 1000, height: 700}});
  const {page, errors} = await shellPage(context);
  const supported = await page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-dn="paper"]');
    const gl = canvas.getContext('webgl2');
    const extension = gl && gl.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    setTimeout(() => extension.restoreContext(), 120);
    return true;
  });
  if (!supported) {
    t.skip('WEBGL_lose_context unavailable');
  } else {
    await page.waitForFunction(() => window.__dshNocturne.diag().paperState === 'ready', {timeout: 10000});
  }
  await assertBrowserClean(page, errors);
  await context.close();
});

test('without WebGL the static paper fallback remains visible', options, async () => {
  const context = await browser.newContext({viewport: {width: 1000, height: 700}});
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === 'webgl2') return null;
      return original.call(this, type, ...args);
    };
  });
  const {page, errors} = await shellPage(context);
  const fallback = await page.evaluate(() => ({
    state: window.__dshNocturne.diag().paperState,
    webgl2: window.__dshNocturne.diag().webgl2,
    background: getComputedStyle(document.body).backgroundColor
  }));
  assert.equal(fallback.state, 'failed');
  assert.equal(fallback.webgl2, false);
  assert.equal(fallback.background, 'rgb(239, 223, 189)');
  await assertBrowserClean(page, errors);
  await context.close();
});

test('static default caps canvas pixels and avoids ambient repaints', options, async () => {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2});
  const {page, errors} = await shellPage(context);
  await page.waitForTimeout(500);
  const pixels = await page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-dn="paper"]');
    return canvas.width * canvas.height;
  });
  assert.ok(pixels > 0 && pixels <= 2000000, 'canvas must respect the pixel budget: ' + pixels);
  const fingerprint = () => page.evaluate(() => {
    const text = document.querySelector('canvas[data-dn="glow"]').toDataURL();
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0;
  });
  const first = await fingerprint();
  await page.waitForTimeout(300);
  assert.equal(await fingerprint(), first, 'static mode should not repaint ambient glow');
  await page.evaluate(() => window.__dshNocturne.use('parchment', {ambientMotion: true}));
  await page.waitForTimeout(300);
  assert.notEqual(await fingerprint(), first, 'opt-in ambient motion should resume animation');
  await assertBrowserClean(page, errors);
  await context.close();
});

test('reduced motion freezes decorative dust and content growth updates scrollbar', options, async () => {
  const context = await browser.newContext({viewport: {width: 1000, height: 700}});
  const {page, errors} = await shellPage(context, 'reduce');
  await page.evaluate(() => window.__dshNocturne.use('parchment', {ambientMotion: true}));
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
  // 等初次远程回退与 surface 重建结束，避免把初始化帧误判成装饰动画。
  await page.waitForTimeout(500);
  const fingerprint = () => page.evaluate(() => {
    const text = document.querySelector('canvas[data-dn="glow"]').toDataURL();
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0;
  });
  const first = await fingerprint();
  await page.waitForTimeout(300);
  const second = await fingerprint();
  assert.equal(second, first, 'reduced motion must keep the glow frame static');

  await page.evaluate(() => window.__dshNocturne.scroll('bar'));
  const before = await page.evaluate(() => parseFloat(document.querySelector('.dn-scroll').style.height));
  await page.evaluate(() => { document.querySelector('#content').style.height = '4000px'; });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => parseFloat(document.querySelector('.dn-scroll').style.height));
  assert.ok(after < before, 'expected thumb height to shrink after content grows: ' + before + ' -> ' + after);
  await assertBrowserClean(page, errors);
  await context.close();
});

test('offline sample renders all 18 paper/theme combinations', options, async () => {
  const context = await browser.newContext({viewport: {width: 1000, height: 700}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  const papers = ['onionskin', 'cotton', 'laid', 'linen', 'parchment', 'night'];
  const themes = ['paper-and-ink', 'midnight-study', 'moonlit-poetry'];
  const base = pathToFileURL(path.join(repo, 'sample/nocturne-desk.html')).href;
  for (const paper of papers) {
    for (const theme of themes) {
      await page.goto(base + '?paper=' + paper + '&theme=' + theme, {waitUntil: 'load'});
      const size = await page.evaluate(() => {
        const canvas = document.querySelector('#paper');
        return canvas ? [canvas.width, canvas.height] : [0, 0];
      });
      assert.ok(size[0] > 1 && size[1] > 1, paper + '/' + theme);
    }
  }
  await assertBrowserClean(page, errors);
  await context.close();
});
