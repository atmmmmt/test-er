const fs = require('fs');
const path = require('path');
const fzstd = require('fzstd');

const root = path.join(__dirname, '..');
const src = path.join(root, 'data', 'nawafith_internal.sqlite3.zst');
const dest = path.join(root, 'data', 'nawafith_internal.sqlite3');
const tmp = dest + '.tmp';

if (fs.existsSync(dest) && fs.statSync(dest).size > 100 * 1024 * 1024) {
  console.log('Archive database already prepared.');
  process.exit(0);
}
if (!fs.existsSync(src)) throw new Error(`Compressed archive not found: ${src}`);
console.log('Decompressing archive database...');
const compressed = fs.readFileSync(src);
const decoded = fzstd.decompress(compressed);
try { fs.unlinkSync(tmp); } catch (_) {}
fs.writeFileSync(tmp, Buffer.from(decoded.buffer, decoded.byteOffset, decoded.byteLength));
fs.renameSync(tmp, dest);
console.log(`Archive prepared: ${dest} (${fs.statSync(dest).size} bytes)`);
