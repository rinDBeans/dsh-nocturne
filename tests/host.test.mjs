import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {apply} from '../lib/index.js';

async function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-nocturne-host-'));
  let registration;
  const ctx = {
    logger: {warn() {}},
    get(name) {
      if (name === 'dshHomePath') return (...parts) => path.join(home, ...parts);
      return undefined;
    },
    inject(services, mount) {
      mount({
        effect(fn) { fn(); },
        webServer: {register(config) { registration = config; return () => {}; }}
      });
    }
  };
  apply(ctx);
  const server = http.createServer(registration.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    const resolved = path.resolve(home);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('unsafe cleanup');
    fs.rmSync(resolved, {recursive: true, force: true});
  });
  const port = server.address().port;
  return {
    home, port,
    request({method = 'GET', body = '', headers = {}} = {}) {
      return new Promise((resolve, reject) => {
        const req = http.request({
          host: '127.0.0.1', port, path: '/dsh-nocturne/settings', method,
          headers: {'content-length': Buffer.byteLength(body), ...headers}
        }, (res) => {
          let text = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => { text += chunk; });
          res.on('end', () => resolve({status: res.statusCode, text}));
        });
        req.on('error', reject);
        req.end(body);
      });
    }
  };
}

test('settings route round-trips JSON to disk', async (t) => {
  const f = await fixture(t);
  const put = await f.request({
    method: 'PUT', body: JSON.stringify({paper: 'night', intensity: 1.2}),
    headers: {'content-type': 'application/json'}
  });
  assert.equal(put.status, 200);
  const get = await f.request();
  assert.equal(get.status, 200);
  assert.deepEqual(JSON.parse(get.text).settings, {paper: 'night', intensity: 1.2});
  assert.ok(fs.existsSync(path.join(f.home, 'cache', 'dsh-nocturne', 'settings.json')));
});

test('settings route rejects malformed JSON and non-local Host', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request({method: 'PUT', body: '{bad', headers: {'content-type': 'application/json'}})).status, 400);
  assert.equal((await f.request({headers: {host: 'example.test'}})).status, 403);
});

test('settings route rejects invalid setting types and unknown keys', async (t) => {
  const f = await fixture(t);
  const headers = {'content-type': 'application/json'};
  assert.equal((await f.request({method: 'PUT', body: JSON.stringify({intensity: 'bad'}), headers})).status, 400);
  assert.equal((await f.request({method: 'PUT', body: JSON.stringify({unknownSetting: true}), headers})).status, 400);
});

test('settings route rejects cross-site Origin and simple-text writes', async (t) => {
  const f = await fixture(t);
  const crossSite = await f.request({
    method: 'POST', body: JSON.stringify({paper: 'night'}),
    headers: {'content-type': 'application/json', origin: 'https://example.test'}
  });
  assert.equal(crossSite.status, 403);
  const simpleText = await f.request({
    method: 'POST', body: JSON.stringify({paper: 'night'}),
    headers: {'content-type': 'text/plain'}
  });
  assert.equal(simpleText.status, 415);
});
