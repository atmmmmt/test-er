import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
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

app.get('/api/health', async (_req, res) => {
  try {
    const result = await runYtDlp(['--version']);
    res.json({ ok: true, ytDlp: result.stdout.trim(), ffmpeg: Boolean(ffmpegStatic), streaming: true });
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

// Fast path: stream bytes to the browser immediately instead of downloading the whole file on Render first.
app.get('/api/download', (req, res) => {
  const url = String(req.query?.url || '').trim();
  const mode = req.query?.mode === 'mp3' ? 'mp3' : 'mp4';
  const requestedName = String(req.query?.name || 'video');
  if (!validHttpUrl(url)) return res.status(400).send('الرابط غير صالح');

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');

  if (mode === 'mp4') {
    const filename = downloadName(requestedName, 'mp4');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', contentDisposition(filename));

    // Prefer a single MP4 stream containing both video+audio. This avoids the expensive server-side merge step.
    const child = spawn(YTDLP_PATH, [
      ...baseArgs(),
      '-f', 'best[ext=mp4][vcodec!=none][acodec!=none]/best[vcodec!=none][acodec!=none]',
      '--no-part',
      '-o', '-',
      url
    ], { windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', d => { if (stderr.length < 4000) stderr += d.toString(); });
    child.on('error', err => { if (!res.headersSent) res.status(500).send('تعذر بدء التحميل'); else res.destroy(err); });
    child.stdout.pipe(res);
    child.on('close', code => {
      if (code !== 0 && !res.writableEnded) {
        console.error('yt-dlp stream failed:', stderr.slice(-1500));
        res.destroy();
      }
    });
    req.on('aborted', () => child.kill('SIGTERM'));
    res.on('close', () => { if (!child.killed) child.kill('SIGTERM'); });
    return;
  }

  if (!ffmpegStatic) return res.status(500).send('FFmpeg غير متوفر');
  const filename = downloadName(requestedName, 'mp3');
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', contentDisposition(filename));

  // Stream source audio through ffmpeg in real time. No temporary file and no second wait.
  const yt = spawn(YTDLP_PATH, [
    ...baseArgs(),
    '-f', 'bestaudio/best',
    '--no-part',
    '-o', '-',
    url
  ], { windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });

  const ff = spawn(ffmpegStatic, [
    '-hide_banner', '-loglevel', 'error',
    '-i', 'pipe:0',
    '-vn', '-codec:a', 'libmp3lame', '-b:a', '192k',
    '-f', 'mp3', 'pipe:1'
  ], { windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });

  let ytErr = '', ffErr = '';
  yt.stderr.on('data', d => { if (ytErr.length < 3000) ytErr += d.toString(); });
  ff.stderr.on('data', d => { if (ffErr.length < 3000) ffErr += d.toString(); });
  yt.stdout.pipe(ff.stdin);
  ff.stdout.pipe(res);

  yt.on('error', err => { console.error('yt-dlp error', err); ff.kill('SIGTERM'); if (!res.headersSent) res.status(500).end(); else res.destroy(); });
  ff.on('error', err => { console.error('ffmpeg error', err); yt.kill('SIGTERM'); if (!res.headersSent) res.status(500).end(); else res.destroy(); });
  yt.on('close', code => { if (code !== 0) { console.error('yt-dlp audio failed:', ytErr.slice(-1200)); ff.kill('SIGTERM'); } });
  ff.on('close', code => { if (code !== 0 && !res.writableEnded) { console.error('ffmpeg failed:', ffErr.slice(-1200)); res.destroy(); } });

  const stop = () => { if (!yt.killed) yt.kill('SIGTERM'); if (!ff.killed) ff.kill('SIGTERM'); };
  req.on('aborted', stop);
  res.on('close', stop);
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Downloader running on port ${PORT}`);
  console.log(`yt-dlp: ${YTDLP_PATH}`);
  console.log(`ffmpeg: ${ffmpegStatic || 'not found'}`);
  console.log('download mode: streaming');
});
