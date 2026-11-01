const test = require('node:test');
const assert = require('node:assert/strict');
const {loadContract} = require('./helpers/client-contract.cjs');

function channel(value) {
  const c = Number(value) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  const value = hex.replace('#', '');
  return 0.2126 * channel(parseInt(value.slice(0, 2), 16))
    + 0.7152 * channel(parseInt(value.slice(2, 4), 16))
    + 0.0722 * channel(parseInt(value.slice(4, 6), 16));
}
function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test('all 12 paper variants keep text contrast above 4.5:1', () => {
  const c = loadContract();
  const ids = Object.keys(c.PAPERS);
  assert.equal(ids.length, 6);
  for (const id of ids) {
    for (const appearance of ['light', 'dark']) {
      c.setPaperAppearance(appearance);
      const p = c.paperFor(id);
      assert.equal(p.appearance, appearance, id + '/' + appearance);
      assert.ok(contrast(p.ink, p.paper) >= 4.5, id + '/' + appearance + ' ink contrast ' + contrast(p.ink, p.paper).toFixed(2));
      assert.ok(contrast(p.inkMuted, p.paper) >= 4.5, id + '/' + appearance + ' muted contrast ' + contrast(p.inkMuted, p.paper).toFixed(2));
    }
  }
});

test('automatic coexistence follows host appearance instead of yielding colors', () => {
  const c = loadContract();
  c.SETTINGS.coexist = 'auto';
  c.rootStyle.setProperty('--dsh-claude-caret-color', '#ffffff');
  assert.equal(c.tokenMode(), 'full');
});
