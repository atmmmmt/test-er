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

fs.mkdirSync(path.dirname(dest), { recursive: true });
try { fs.unlinkSync(tmp); } catch (_) {}
const outFd = fs.openSync(tmp, 'w');
let written = 0;
const dec = new fzstd.Decompress((chunk) => {
  const b = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  fs.writeSync(outFd, b);
  written += b.length;
});

const inFd = fs.openSync(src, 'r');
const buf = Buffer.allocUnsafe(4 * 1024 * 1024);
let pos = 0;
try {
  while (true) {
    const n = fs.readSync(inFd, buf, 0, buf.length, pos);
    if (!n) break;
    pos += n;
    dec.push(new Uint8Array(buf.buffer, buf.byteOffset, n), false);
  }
  dec.push(new Uint8Array(0), true);
} finally {
  fs.closeSync(inFd);
  fs.closeSync(outFd);
}
fs.renameSync(tmp, dest);
console.log(`Archive prepared: ${dest} (${written} bytes)`);
