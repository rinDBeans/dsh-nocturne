const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('generated DSH bundle exposes the expected plugin contract', () => {
  const source = fs.readFileSync(require.resolve('../lib/client.js'), 'utf8');
  let definition;
  const context = {
    console,
    window: {
      matchMedia: () => ({matches: false}),
      __ModuleLoader__: {load: (value) => { definition = value; }}
    },
    document: {
      readyState: 'loading',
      addEventListener() {},
      createElement: () => ({getContext: () => ({})})
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.equal(definition.id, 'dsh-nocturne');
  const plugin = definition.factory(() => ({}));
  assert.equal(plugin.name, 'dsh-nocturne');
  assert.deepEqual(Array.from(plugin.inject), ['slots']);
  assert.equal(typeof plugin.apply, 'function');
});
