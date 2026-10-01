const fs = require('fs');
const path = require('path');

(async () => {
  const { decompress } = await import('zstdify');
  const root = path.join(__dirname, '..');
  const src = path.join(root, 'data', 'nawafith_internal.sqlite3.zst');
  const dest = path.join(root, 'data', 'nawafith_internal.sqlite3');
  const tmp = dest + '.tmp';

  if (fs.existsSync(dest) && fs.statSync(dest).size > 100 * 1024 * 1024) {
    console.log('Archive database already prepared.');
    return;
  }
  if (!fs.existsSync(src)) throw new Error(`Compressed archive not found: ${src}`);
  console.log('Decompressing archive database...');
  const compressed = fs.readFileSync(src);
  const output = decompress(new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength), { maxSize: 700 * 1024 * 1024 });
  try { fs.unlinkSync(tmp); } catch (_) {}
  fs.writeFileSync(tmp, Buffer.from(output.buffer, output.byteOffset, output.byteLength));
  fs.renameSync(tmp, dest);
  console.log(`Archive prepared: ${dest} (${fs.statSync(dest).size} bytes)`);
})().catch(err => { console.error(err); process.exit(1); });
