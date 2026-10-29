/**
 * dsh-nocturne —— 宿主半。
 *
 * 为什么需要它：DSH 桌面版每次启动把 web 服务端口设成 0（端口随机），
 * 于是 GUI 的 origin 每次都变，浏览器 localStorage 跟着失效——用户每重启一次
 * 皮肤就回到默认。宿主半把设置落到磁盘，客户端启动时再取回来。
 *
 * 只做一件事：在 /dsh-nocturne/settings 上读写一个 JSON 文档。
 * 路径与写法照装机里的 dsh-claude-style：$DSH_HOME/cache/<包名>/，临时文件 + rename 原子替换。
 */
import {validateSettingsDocument} from './settings-contract.js';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const PACKAGE_NAME = 'dsh-nocturne';
const ROUTE_PREFIX = '/dsh-nocturne';
const SETTINGS_PATH = ROUTE_PREFIX + '/settings';
const MAX_BODY = 64 * 1024;

export const name = PACKAGE_NAME;

/** $DSH_HOME 由宿主给出；取不到就退回 ~/.dsh，与官方插件一致。 */
function harnessPath(ctx, ...segments) {
  const resolve = ctx.get('dshHomePath');
  if (typeof resolve === 'function') return resolve(...segments);
  return join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), ...segments);
}

const settingsFile = (ctx) => harnessPath(ctx, 'cache', PACKAGE_NAME, 'settings.json');

function readDocument(ctx) {
  const file = settingsFile(ctx);
  if (!existsSync(file)) return null;
  try {
    const value = JSON.parse(readFileSync(file, 'utf8'));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch (error) {
    ctx.logger?.warn?.(PACKAGE_NAME + ': settings unreadable (' + error.message + ')');
    return null;
  }
}

function writeDocument(ctx, document) {
  const file = settingsFile(ctx);
  const temporary = file + '.' + process.pid + '.tmp';
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(temporary, JSON.stringify(document), 'utf8');
    renameSync(temporary, file);
    return true;
  } catch (error) {
    ctx.logger?.warn?.(PACKAGE_NAME + ': settings not written (' + error.message + ')');
    return false;
  }
}

/** 只接受回环地址与本机Host：这条路由不需要对外。 */
function foreignRequest(req) {
  const address = req.socket?.remoteAddress;
  if (address) {
    const plain = address.startsWith('::ffff:') ? address.slice(7) : address;
    if (plain !== '::1' && !/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(plain)) return true;
  }
  const localHostname = (hostname) => hostname === 'localhost' || hostname === '[::1]' || /^127\.\d/.test(hostname);
  const host = req.headers.host;
  if (host) {
    try {
      if (!localHostname(new URL('http://' + host).hostname)) return true;
    } catch {
      return true;
    }
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (origin === 'null' || !localHostname(new URL(origin).hostname)) return true;
    } catch {
      return true;
    }
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') return true;
  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

export function apply(ctx) {
  const mount = (scope) => {
    scope.effect(() => {
      const server = scope.webServer;
      if (!server || typeof server.register !== 'function') {
        ctx.logger?.warn?.(PACKAGE_NAME + ': host has no webServer service; settings will stay in the browser only');
        return;
      }
      let dispose;
      try {
        dispose = server.register({
          kind: 'prefix',
          path: ROUTE_PREFIX,
          handler: (req, res) => {
            const pathname = new URL(req.url ?? '/', 'http://x').pathname;
            if (pathname !== SETTINGS_PATH) {
              res.writeHead(404);
              res.end();
              return;
            }
            if (foreignRequest(req)) {
              sendJson(res, 403, {ok: false, error: 'loopback only'});
              return;
            }
            const method = req.method ?? 'GET';
            if (method === 'GET' || method === 'HEAD') {
              sendJson(res, 200, {ok: true, settings: readDocument(ctx)});
              return;
            }
            if (method === 'PUT' || method === 'POST') {
              const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
              if (contentType !== 'application/json') {
                sendJson(res, 415, {ok: false, error: 'application/json required'});
                return;
              }
              readBody(req).then((text) => {
                let parsed;
                try {
                  parsed = JSON.parse(text);
                } catch {
                  sendJson(res, 400, {ok: false, error: 'invalid json'});
                  return;
                }
                const validationError = validateSettingsDocument(parsed);
                if (validationError) {
                  sendJson(res, 400, {ok: false, error: validationError});
                  return;
                }
                const written = writeDocument(ctx, parsed);
                sendJson(res, written ? 200 : 500, written ? {ok: true} : {ok: false, error: 'settings not written'});
              }, (error) => sendJson(res, 400, {ok: false, error: String(error.message)}));
              return;
            }
            sendJson(res, 405, {ok: false, error: 'GET or PUT only'});
          }
        });
      } catch (error) {
        ctx.logger?.warn?.(PACKAGE_NAME + ': settings route unavailable (' + error.message + ')');
      }
      return () => {
        if (typeof dispose === 'function') {
          try { dispose(); } catch { /* 已卸载 */ }
        }
      };
    });
  };

  if (typeof ctx.inject === 'function') ctx.inject(['webServer'], mount);
  else mount(ctx);
}
