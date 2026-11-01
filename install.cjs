#!/usr/bin/env node
/**
 * dsh-nocturne 安装器。
 *
 *   node install.cjs                  # 装进 desktop 档案
 *   node install.cjs --profile web    # 装进别的档案
 *   node install.cjs --dry-run        # 只打印将要改什么
 *   node install.cjs --revert         # 外科式移除本插件
 *
 * 只修改档案里的本插件目录、dependencies 和 bundles。回滚不恢复整份历史清单，
 * 因此不会抹掉安装之后对其他插件做的修改，也不会在重复安装后留下悬空登记。
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

const log = (...parts) => console.log(...parts);
const fail = (message) => { console.error('✗ ' + message); process.exit(1); };
if (!/^[a-z0-9][a-z0-9_-]*$/i.test(profileName)) fail('非法档案名：' + profileName);

const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const profile = path.resolve(home, 'profiles', profileName);
const packageName = 'dsh-nocturne';
const source = path.resolve(__dirname);
/** 装进档案的只有运行时需要的那几项：仓库根就是包，整目录复制会把 tests/、_probe/ 和 .git 一起搬进档案。 */
const PACKAGE_ENTRIES = ['package.json', 'lib', 'cordis.patch.yml', 'README.md', 'LICENSE'];
const target = path.join(profile, 'node_modules', packageName);
const pkgJsonPath = path.join(profile, 'package.json');

function assertInsideProfile(file) {
  const relative = path.relative(profile, path.resolve(file));
  if (!relative || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw new Error('拒绝操作档案外的路径：' + file);
  }
}
for (const file of [target, pkgJsonPath]) assertInsideProfile(file);
if (!fs.existsSync(profile)) fail('找不到档案目录：' + profile);
if (!fs.existsSync(pkgJsonPath)) fail('档案里没有 package.json：' + pkgJsonPath);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = (file) => file + '.bak-nocturne-' + stamp;
const backups = [];

function readManifest() {
  try {
    const value = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('根节点不是对象');
    return value;
  } catch (error) {
    fail('无法读取档案 package.json：' + error.message);
  }
}

function writeTextAtomic(file, text) {
  assertInsideProfile(file);
  const temporary = file + '.tmp-nocturne-' + process.pid;
  assertInsideProfile(temporary);
  try {
    fs.writeFileSync(temporary, text, 'utf8');
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, {force: true});
  }
}

function writeManifest(value) {
  writeTextAtomic(pkgJsonPath, JSON.stringify(value, null, 2) + '\n');
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const copy = backupPath(file);
  assertInsideProfile(copy);
  fs.copyFileSync(file, copy);
  backups.push(copy);
}

function removeTree(directory) {
  assertInsideProfile(directory);
  fs.rmSync(directory, {recursive: true, force: true});
}

// ── revert：只移除本插件自己的登记，不回滚其他插件或用户的后续修改。 ──
if (revert) {
  const manifest = readManifest();
  const bundles = manifest.dsh && manifest.dsh.profile && Array.isArray(manifest.dsh.profile.bundles)
    ? manifest.dsh.profile.bundles : [];
  const nextBundles = bundles.filter((name) => name !== packageName);
  const registered = !!(manifest.dependencies && manifest.dependencies[packageName]);
  const changed = registered || nextBundles.length !== bundles.length;

  if (changed) {
    backup(pkgJsonPath);
    if (manifest.dependencies) delete manifest.dependencies[packageName];
    if (manifest.dsh && manifest.dsh.profile && Array.isArray(manifest.dsh.profile.bundles)) {
      manifest.dsh.profile.bundles = nextBundles;
    }
    writeManifest(manifest);
  }
  const hadTarget = fs.existsSync(target);
  if (hadTarget) removeTree(target);
  log(changed || hadTarget ? '✓ 已移除' : '✓ 已移除（本插件原本就没有登记）');
  log('  其他依赖与 bundle 保持不变；重启 DSH 后生效。');
  process.exit(0);
}

// ── install ──
const pkgJson = readManifest();
const originalManifest = fs.readFileSync(pkgJsonPath, 'utf8');
pkgJson.dependencies = pkgJson.dependencies || {};
pkgJson.dsh = pkgJson.dsh || {};
pkgJson.dsh.profile = pkgJson.dsh.profile || {};
const bundles = Array.isArray(pkgJson.dsh.profile.bundles)
  ? pkgJson.dsh.profile.bundles
  : (pkgJson.dsh.profile.bundles = []);

const alreadyDependency = pkgJson.dependencies[packageName];
const alreadyBundle = bundles.includes(packageName);
log('档案：' + profile);
log('  依赖           ' + (alreadyDependency ? '已存在（' + alreadyDependency + '）' : '将新增 file:' + source));
log('  bundle         ' + (alreadyBundle ? '已存在' : '将新增'));
log('  node_modules   ' + (fs.existsSync(target) ? '将替换' : '将写入'));
if (dryRun) {
  log('\n（--dry-run，没有改动任何文件）');
  process.exit(0);
}

const staging = target + '.tmp-nocturne-' + process.pid + '-' + stamp;
const previous = target + '.old-nocturne-' + process.pid + '-' + stamp;
for (const directory of [staging, previous]) assertInsideProfile(directory);
let movedPrevious = false;
let installedStaging = false;
let failure = null;

backup(pkgJsonPath);
try {
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.mkdirSync(staging, {recursive: true});
  for (const entry of PACKAGE_ENTRIES) {
    const from = path.join(source, entry);
    if (!fs.existsSync(from)) continue;
    fs.cpSync(from, path.join(staging, entry), {recursive: true});
  }
  if (fs.existsSync(target)) {
    fs.renameSync(target, previous);
    movedPrevious = true;
  }
  fs.renameSync(staging, target);
  installedStaging = true;

  pkgJson.dependencies[packageName] = 'file:' + source;
  if (!bundles.includes(packageName)) bundles.push(packageName);
  writeManifest(pkgJson);
} catch (error) {
  failure = error;
  try {
    // 先恢复清单，再恢复旧目录；任何一步失败都保留 previous 供人工恢复。
    writeTextAtomic(pkgJsonPath, originalManifest);
    if (installedStaging && fs.existsSync(target)) removeTree(target);
    if (movedPrevious && fs.existsSync(previous)) fs.renameSync(previous, target);
  } catch (rollbackError) {
    failure = new Error(error.message + '；自动恢复也失败：' + rollbackError.message);
  }
} finally {
  if (fs.existsSync(staging)) removeTree(staging);
  if (!failure && fs.existsSync(previous)) removeTree(previous);
}
if (failure) fail('安装未完成：' + failure.message);

log('\n✓ 装好了。备份：');
for (const file of backups) log('  ' + path.basename(file));
log('\n重启 DSH 后生效。想撤掉就运行：node install.cjs --revert');
