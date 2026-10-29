const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const installer = path.resolve(__dirname, '../packages/dsh-nocturne/install.cjs');

function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-nocturne-installer-'));
  t.after(() => {
    const resolved = path.resolve(home);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)) {
      throw new Error('refusing to clean unexpected path: ' + resolved);
    }
    fs.rmSync(resolved, {recursive: true, force: true});
  });
  const profile = path.join(home, 'profiles', 'desktop');
  const manifestPath = path.join(profile, 'package.json');
  const target = path.join(profile, 'node_modules', 'dsh-nocturne');
  fs.mkdirSync(profile, {recursive: true});
  const manifest = {
    name: 'test-profile',
    dependencies: {'other-plugin': '1.0.0'},
    dsh: {profile: {bundles: ['other-plugin']}}
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return {
    home, profile, manifestPath, target,
    read: () => JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
    write: (value) => fs.writeFileSync(manifestPath, JSON.stringify(value, null, 2)),
    run: (...args) => {
      const result = spawnSync(process.execPath, [installer, ...args], {
        env: {...process.env, DSH_HOME: home}, encoding: 'utf8'
      });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      return result;
    }
  };
}

test('install registers and copies the plugin', (t) => {
  const f = fixture(t);
  f.run('--dry-run');
  assert.equal(f.read().dependencies['dsh-nocturne'], undefined);
  f.run();
  const manifest = f.read();
  assert.ok(manifest.dependencies['dsh-nocturne']);
  assert.ok(manifest.dsh.profile.bundles.includes('dsh-nocturne'));
  assert.ok(fs.existsSync(path.join(f.target, 'lib', 'client.js')));
});

test('reinstall then revert removes registration and preserves unrelated edits', (t) => {
  const f = fixture(t);
  f.run();
  f.run();
  const edited = f.read();
  edited.dependencies['installed-later'] = '2.0.0';
  edited.dsh.profile.bundles.push('installed-later');
  f.write(edited);
  f.run('--revert');
  const manifest = f.read();
  assert.equal(manifest.dependencies['dsh-nocturne'], undefined);
  assert.equal(manifest.dsh.profile.bundles.includes('dsh-nocturne'), false);
  assert.equal(fs.existsSync(f.target), false);
  assert.equal(manifest.dependencies['installed-later'], '2.0.0');
  assert.ok(manifest.dsh.profile.bundles.includes('installed-later'));
});

test('revert is idempotent', (t) => {
  const f = fixture(t);
  f.run();
  f.run('--revert');
  f.run('--revert');
  assert.equal(f.read().dependencies['dsh-nocturne'], undefined);
  assert.equal(fs.existsSync(f.target), false);
});
