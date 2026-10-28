#!/usr/bin/env node
/**
 * dsh-nocturne 安装器。
 *
 *   node install.cjs                  # 装进 desktop 档案
 *   node install.cjs --profile web    # 装进别的档案
 *   node install.cjs --dry-run        # 只打印将要改什么
 *   node install.cjs --revert         # 从最近的备份还原
 *
 * 只做两件可逆的事：把包拷进档案的 node_modules、在 package.json 里登记依赖与 bundle。
 * 不动档案的 cordis.patch.yml —— 装载条目由包自带的 cordis.patch.yml 提供，
 * 那是 dsh-dream-skin 用的同一套做法；两边都写会出现重复 id。动手前先备份。
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf('--' + name);
  return index >= 0 ? (args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : true) : false;
};
const dryRun = !!flag('dry-run');
const revert = !!flag('revert');
const profileName = typeof flag('profile') === 'string' ? flag('profile') : 'desktop';

const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const profile = path.join(home, 'profiles', profileName);
const packageName = 'dsh-nocturne';
const source = __dirname;
const target = path.join(profile, 'node_modules', packageName);
const pkgJsonPath = path.join(profile, 'package.json');
const patchPath = path.join(profile, 'cordis.patch.yml');

const log = (...parts) => console.log(...parts);
const fail = (message) => { console.error('✗ ' + message); process.exit(1); };

if (!fs.existsSync(profile)) fail('找不到档案目录：' + profile);
if (!fs.existsSync(pkgJsonPath)) fail('档案里没有 package.json：' + pkgJsonPath);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = (file) => file + '.bak-nocturne-' + stamp;
const backups = [];

function backup(file) {
  if (!fs.existsSync(file)) return;
  const copy = backupPath(file);
  fs.copyFileSync(file, copy);
  backups.push(copy);
}

// ── revert ────────────────────────────────────────────────────────────────
if (revert) {
  const dir = path.dirname(pkgJsonPath);
  const entries = fs.readdirSync(dir).filter((name) => name.startsWith('package.json.bak-nocturne-')).sort();
  if (!entries.length) fail('没有找到安装时的备份');
  const newest = entries[entries.length - 1];
  fs.copyFileSync(path.join(dir, newest), pkgJsonPath);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  log('✓ 已还原：' + newest);
  log('  重启 DSH 后生效。');
  process.exit(0);
}

// ── install ───────────────────────────────────────────────────────────────
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
pkgJson.dependencies = pkgJson.dependencies || {};
pkgJson.dsh = pkgJson.dsh || {};
pkgJson.dsh.profile = pkgJson.dsh.profile || {};
const bundles = pkgJson.dsh.profile.bundles || (pkgJson.dsh.profile.bundles = []);

const alreadyDependency = pkgJson.dependencies[packageName];
const alreadyBundle = bundles.includes(packageName);




log('档案：' + profile);
log('  依赖           ' + (alreadyDependency ? '已存在（' + alreadyDependency + '）' : '将新增 file:' + source));
log('  bundle         ' + (alreadyBundle ? '已存在' : '将新增'));

log('  node_modules   ' + (fs.existsSync(target) ? '将覆盖' : '将写入'));

if (dryRun) {
  log('\n（--dry-run，没有改动任何文件）');
  process.exit(0);
}

backup(pkgJsonPath);


// 1) 拷包
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, {
  recursive: true,
  filter: (from) => !from.includes('node_modules') && !from.endsWith('install.cjs')
});

// 2) 登记
pkgJson.dependencies[packageName] = 'file:' + source;
if (!bundles.includes(packageName)) bundles.push(packageName);
fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');


log('\n✓ 装好了。备份：');
for (const file of backups) log('  ' + path.basename(file));
log('\n重启 DSH 后生效。想撤掉就运行：node install.cjs --revert');
