const test = require('node:test');
const assert = require('node:assert/strict');
const {loadContract} = require('./helpers/client-contract.cjs');

test('normalize repairs invalid enums, booleans, numbers and nested objects', () => {
  const c = loadContract();
  c.mergeSettings({
    paper: 'missing', theme: null, lamp: 'false', enabled: 0,
    intensity: 'bad', spread: Infinity, softness: -5, grain: 9,
    cursorGlow: NaN, paperIllumination: 8, particles: -1, texture: 99,
    beam: 'unknown', cursorMode: 'bad', coexist: 'bad',
    window: [], scrollbar: {style: 'bad', finish: 'bad', barWidth: 999, barOpacity: -2}
  });
  c.normalize();
  assert.equal(c.SETTINGS.paper, 'parchment');
  assert.equal(c.SETTINGS.lamp, true);
  assert.equal(c.SETTINGS.enabled, true);
  assert.equal(c.SETTINGS.intensity, c.NOCTURNE_DEFAULTS.intensity);
  assert.ok(Number.isFinite(c.SETTINGS.spread));
  assert.ok(c.SETTINGS.softness >= 0 && c.SETTINGS.softness <= 1);
  assert.ok(c.SETTINGS.grain >= 0 && c.SETTINGS.grain <= 1);
  assert.ok(c.SETTINGS.texture >= 0 && c.SETTINGS.texture <= 1.6);
  assert.equal(c.SETTINGS.scrollbar.style, 'clip');
  assert.equal(c.SETTINGS.scrollbar.finish, 'silver');
  assert.ok(c.SETTINGS.scrollbar.barWidth <= 14);
  assert.ok(c.SETTINGS.scrollbar.barOpacity >= 0.1);
});

test('window settings accept only finite bounded values', () => {
  const c = loadContract();
  c.mergeSettings({window: {x: -4, y: 8, columns: -2, rows: 99, softness: Infinity, slant: 'bad'}});
  c.normalize();
  assert.ok(c.SETTINGS.window.x >= 0 && c.SETTINGS.window.x <= 1);
  assert.ok(c.SETTINGS.window.y >= 0 && c.SETTINGS.window.y <= 1);
  assert.ok(c.SETTINGS.window.columns >= 1);
  assert.ok(c.SETTINGS.window.rows <= 8);
  assert.ok(Number.isFinite(c.SETTINGS.window.softness));
  assert.ok(Number.isFinite(c.SETTINGS.window.slant));
});

test('snapshot persists bloom and clones nested settings without unknown keys', () => {
  const c = loadContract();
  c.mergeSettings({bloom: 0.4, unknown: 'ignored'});
  c.normalize();
  const saved = c.snapshot();
  assert.equal(saved.bloom, 0.4);
  assert.equal(saved.unknown, undefined);
  assert.notEqual(saved.window, c.SETTINGS.window);
  assert.notEqual(saved.scrollbar, c.SETTINGS.scrollbar);
});
