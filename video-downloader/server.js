import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import ffmpegStatic from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const LOCAL_YTDLP = path.join(__dirname, 'bin', 'yt-dlp');
const YTDLP_PATH = process.env.YTDLP_PATH || (fs.existsSync(LOCAL_YTDLP) ? LOCAL_YTDLP : 'yt-dlp');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const buckets = new Map();
app.use('/api', (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60_000; }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > 30) return res.status(429).json({ error: 'طلبات كثيرة، جرّب بعد دقيقة.' });
  next();
});

function validHttpUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host.startsWith('127.')) return false;
    return true;
  } catch { return false; }
}

function safeName(name = 'video') {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'video';
}

function downloadName(raw, ext) {
  const base = safeName(String(raw || 'video')).replace(/\.[a-z0-9]{2,5}$/i, '');
  return `${base}.${ext}`;
}

function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_PATH, args, { windowsHide: true, shell: false });
    let stdout = '', stderr = '';
    child.stdout?.on('data', d => (stdout += d.toString()));
    child.stderr?.on('data', d => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(stderr || `yt-dlp exited with code ${code}`)));
  });
}

function baseArgs() {
  const args = ['--no-playlist', '--no-warnings', '--socket-timeout', '20', '--retries', '2'];
  if (ffmpegStatic) args.push('--ffmpeg-location', ffmpegStatic);
  return args;
}

function setDownloadHeaders(res, filename, contentType = 'application/octet-stream', contentLength = null) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', contentDisposition(filename));
  if (contentLength && /^\d+$/.test(String(contentLength))) res.setHeader('Content-Length', String(contentLength));
}

function pickProgressiveFormat(data) {
  const formats = Array.isArray(data?.formats) ? data.formats : [];
  const candidates = formats.filter(f => {
    const protocol = String(f.protocol || '').toLowerCase();
    return Boolean(
      f.url &&
      f.vcodec && f.vcodec !== 'none' &&
      f.acodec && f.acodec !== 'none' &&
      !protocol.includes('m3u8') &&
      !protocol.includes('dash')
    );
  });

  candidates.sort((a, b) => {
    const aMp4 = a.ext === 'mp4' ? 1 : 0;
    const bMp4 = b.ext === 'mp4' ? 1 : 0;
    if (aMp4 !== bMp4) return bMp4 - aMp4;
    const ah = Number(a.height || 0), bh = Number(b.height || 0);
    if (ah !== bh) return bh - ah;
    return Number(b.tbr || 0) - Number(a.tbr || 0);
  });

  return candidates[0] || null;
}

async function proxyProgressive(format, data, req, res, filename) {
  const controller = new AbortController();
  const stop = () => controller.abort();
  req.on('aborted', stop);
  res.on('close', () => { if (!res.writableEnded) stop(); });

  const headers = { ...(data?.http_headers || {}), ...(format?.http_headers || {}) };
  delete headers.Host;
  delete headers.host;
  delete headers['Content-Length'];
  delete headers['content-length'];

  const upstream = await fetch(format.url, {
    method: 'GET',
    headers,
    redirect: 'follow',
    signal: controller.signal
  });

  if (!upstream.ok || !upstream.body) {
    try { upstream.body?.cancel(); } catch {}
    return false;
  }

  const type = upstream.headers.get('content-type') || (format.ext === 'mp4' ? 'video/mp4' : 'application/octet-stream');
  const length = upstream.headers.get('content-length');
  setDownloadHeaders(res, filename, type, length);

  const nodeStream = Readable.fromWeb(upstream.body);
  nodeStream.on('error', err => {
    console.error('upstream stream error:', err.message);
    if (!res.headersSent) res.status(502).end();
    else res.destroy(err);
  });
  nodeStream.pipe(res);
  return true;
}

function streamYtDlpMp4(url, req, res, filename) {
  const child = spawn(YTDLP_PATH, [
    ...baseArgs(),
    '-f', 'best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]',
    '--no-part', '-o', '-', url
  ], { windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  let started = false;
  child.stderr.on('data', d => { if (stderr.length < 8000) stderr += d.toString(); });

  child.stdout.once('data', chunk => {
    if (res.destroyed) return;
    started = true;
    setDownloadHeaders(res, filename, 'application/octet-stream');
    res.write(chunk);
    child.stdout.pipe(res);
  });

  child.on('error', err => {
    console.error('yt-dlp spawn error:', err.message);
    if (!res.headersSent) res.status(500).send('تعذر بدء التحميل');
    else res.destroy(err);
  });

  child.on('close', code => {
    if (code !== 0) console.error('yt-dlp mp4 failed:', stderr.slice(-2500));
    if (!started && !res.headersSent) {
      res.status(400).send('تعذر تنزيل هذه الصيغة من المصدر. جرّب رابطًا عامًا آخر.');
    } else if (code !== 0 && !res.writableEnded) {
      res.destroy();
    }
  });

  const stop = () => { if (!child.killed) child.kill('SIGTERM'); };
  req.on('aborted', stop);
  res.on('close', () => { if (!res.writableEnded) stop(); });
}

function streamMp3(url, req, res, filename) {
  if (!ffmpegStatic) return res.status(500).send('FFmpeg غير متوفر');

  const yt = spawn(YTDLP_PATH, [
    ...baseArgs(), '-f', 'bestaudio/best', '--no-part', '-o', '-', url
  ], { windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

  const ff = spawn(ffmpegStatic, [
    '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-vn',
    '-codec:a', 'libmp3lame', '-b:a', '192k', '-f', 'mp3', 'pipe:1'
  ], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });

  let ytErr = '', ffErr = '', started = false;
  yt.stderr.on('data', d => { if (ytErr.length < 5000) ytErr += d.toString(); });
  ff.stderr.on('data', d => { if (ffErr.length < 5000) ffErr += d.toString(); });
  yt.stdout.pipe(ff.stdin);

  ff.stdout.once('data', chunk => {
    if (res.destroyed) return;
    started = true;
    setDownloadHeaders(res, filename, 'audio/mpeg');
    res.write(chunk);
    ff.stdout.pipe(res);
  });

  yt.on('error', err => { console.error('yt-dlp audio spawn error:', err.message); if (!ff.killed) ff.kill('SIGTERM'); });
  ff.on('error', err => { console.error('ffmpeg spawn error:', err.message); if (!yt.killed) yt.kill('SIGTERM'); if (!res.headersSent) res.status(500).send('تعذر تحويل الصوت'); else res.destroy(err); });
  yt.on('close', code => { if (code !== 0) console.error('yt-dlp audio failed:', ytErr.slice(-2000)); });
  ff.on('close', code => {
    if (code !== 0) console.error('ffmpeg failed:', ffErr.slice(-2000));
    if (!started && !res.headersSent) res.status(400).send('تعذر استخراج الصوت من هذا الرابط.');
    else if (code !== 0 && !res.writableEnded) res.destroy();
  });

  const stop = () => {
    if (!yt.killed) yt.kill('SIGTERM');
    if (!ff.killed) ff.kill('SIGTERM');
  };
  req.on('aborted', stop);
  res.on('close', () => { if (!res.writableEnded) stop(); });
}

app.get('/api/health', async (_req, res) => {
  try {
    const result = await runYtDlp(['--version']);
    res.json({ ok: true, ytDlp: result.stdout.trim(), ffmpeg: Boolean(ffmpegStatic), streaming: 'robust-v2' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'محرك التنزيل غير جاهز', details: String(err.message).slice(0, 300) });
  }
});

app.post('/api/info', async (req, res) => {
  const url = String(req.body?.url || '').trim();
  if (!validHttpUrl(url)) return res.status(400).json({ error: 'الرابط غير صالح' });
  try {
    const { stdout } = await runYtDlp([...baseArgs(), '--dump-single-json', url]);
    const data = JSON.parse(stdout);
    res.json({
      title: data.title || 'Video',
      thumbnail: data.thumbnail || null,
      duration: data.duration || null,
      uploader: data.uploader || data.channel || null,
      webpage_url: data.webpage_url || url
    });
  } catch (err) {
    res.status(400).json({ error: 'تعذر قراءة الفيديو. قد يكون الرابط خاصًا أو غير مدعوم أو محميًا.', details: String(err.message).slice(0, 500) });
  }
});

app.get('/api/download', async (req, res) => {
  const url = String(req.query?.url || '').trim();
  const mode = req.query?.mode === 'mp3' ? 'mp3' : 'mp4';
  const requestedName = String(req.query?.name || 'video');
  if (!validHttpUrl(url)) return res.status(400).send('الرابط غير صالح');

  if (mode === 'mp3') {
    return streamMp3(url, req, res, downloadName(requestedName, 'mp3'));
  }

  const filename = downloadName(requestedName, 'mp4');

  try {
    const { stdout } = await runYtDlp([...baseArgs(), '--dump-single-json', url]);
    const data = JSON.parse(stdout);
    const progressive = pickProgressiveFormat(data);

    if (progressive) {
      try {
        const ok = await proxyProgressive(progressive, data, req, res, filename);
        if (ok) return;
      } catch (err) {
        if (res.headersSent || res.destroyed) return;
        console.error('direct progressive proxy failed, falling back:', err.message);
      }
    }
  } catch (err) {
    console.error('format lookup failed, falling back:', err.message);
  }

  if (!res.headersSent && !res.destroyed) streamYtDlpMp4(url, req, res, filename);
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Downloader running on port ${PORT}`);
  console.log(`yt-dlp: ${YTDLP_PATH}`);
  console.log(`ffmpeg: ${ffmpegStatic || 'not found'}`);
  console.log('download mode: robust streaming v2');
});
