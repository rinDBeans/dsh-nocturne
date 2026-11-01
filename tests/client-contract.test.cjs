const test = require('node:test');
const assert = require('node:assert/strict');
const {loadContract} = require('./helpers/client-contract.cjs');

test('material mode leaves every host color token untouched', () => {
  const c = loadContract();
  c.SETTINGS.coexist = 'material';
  c.rootStyle.setProperty('--dsw-alias-bg-base', 'host-root', 'important');
  c.bodyStyle.setProperty('--dsw-specific-bubble', 'host-body', 'important');
  c.applyTokens();
  assert.equal(c.rootStyle.getPropertyValue('--dsw-alias-bg-base'), 'host-root');
  assert.equal(c.bodyStyle.getPropertyValue('--dsw-specific-bubble'), 'host-body');
});

test('full mode applies paper colors to root and component surfaces', () => {
  const c = loadContract();
  c.SETTINGS.coexist = 'full';
  c.applyTokens();
  assert.equal(c.rootStyle.getPropertyValue('--dsw-alias-bg-base'), c.PAPERS[c.SETTINGS.paper].paper);
  assert.ok(c.bodyStyle.getPropertyValue('--dsw-specific-bubble'));
  // 宿主把 alias 表声明在 body 上，所以纸色也必须写在 body 上：继承值输给本地声明。
  assert.equal(c.bodyStyle.getPropertyValue('--dsw-alias-bg-base'), c.PAPERS[c.SETTINGS.paper].paper);
});

test('restoreOwnedStyles restores preexisting inline values and priorities', () => {
  const c = loadContract();
  c.rootStyle.setProperty('--dsw-alias-bg-base', 'before-root', 'important');
  c.bodyStyle.setProperty('--dsw-specific-bubble', 'before-body', '');
  c.SETTINGS.coexist = 'full';
  c.applyTokens();
  c.restoreOwnedStyles();
  assert.equal(c.rootStyle.inspect('--dsw-alias-bg-base').value, 'before-root');
  assert.equal(c.rootStyle.inspect('--dsw-alias-bg-base').priority, 'important');
  assert.equal(c.bodyStyle.inspect('--dsw-specific-bubble').value, 'before-body');
  assert.equal(c.bodyStyle.inspect('--dsw-specific-bubble').priority, '');
});

test('switching full to material restores host styles and keeps only dn variables', () => {
  const c = loadContract();
  c.rootStyle.setProperty('--dsw-alias-bg-base', 'host-root');
  c.bodyStyle.setProperty('--dsw-specific-bubble', 'host-body');
  c.SETTINGS.coexist = 'full';
  c.applyTokens();
  c.SETTINGS.coexist = 'material';
  c.applyTokens();
  assert.equal(c.rootStyle.getPropertyValue('--dsw-alias-bg-base'), 'host-root');
  assert.equal(c.bodyStyle.getPropertyValue('--dsw-specific-bubble'), 'host-body');
  assert.equal(c.rootStyle.getPropertyValue('--dn-sheet'), 'transparent');
});

test('material preserves host typefaces while full owns and restores paper fonts', () => {
  const c = loadContract();
  c.rootStyle.setProperty('--dsh-font-family-text', 'Host Sans', 'important');
  c.SETTINGS.coexist = 'material';
  c.applyTokens();
  assert.equal(c.rootStyle.getPropertyValue('--dsh-font-family-text'), 'Host Sans');
  c.SETTINGS.coexist = 'full';
  c.applyTokens();
  assert.ok(c.rootStyle.getPropertyValue('--dsh-font-family-text').includes('EB Garamond'));
  c.SETTINGS.coexist = 'material';
  c.applyTokens();
  assert.equal(c.rootStyle.inspect('--dsh-font-family-text').value, 'Host Sans');
  assert.equal(c.rootStyle.inspect('--dsh-font-family-text').priority, 'important');
});

test('restore does not overwrite a newer foreign inline change', () => {
  const c = loadContract();
  c.SETTINGS.coexist = 'full';
  c.applyTokens();
  c.rootStyle.setProperty('--dsw-alias-bg-base', 'foreign-new', 'important');
  c.restoreOwnedStyles();
  assert.equal(c.rootStyle.getPropertyValue('--dsw-alias-bg-base'), 'foreign-new');
});
