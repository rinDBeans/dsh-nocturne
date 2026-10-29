const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const files = fs.readdirSync(__dirname)
  .filter((name) => /\.test\.(?:cjs|mjs|js)$/.test(name))
  .sort()
  .map((name) => path.join(__dirname, name));
if (!files.length) throw new Error('no tests found');
const result = spawnSync(process.execPath, ['--test', ...files], {stdio: 'inherit'});
process.exit(result.status === null ? 1 : result.status);
