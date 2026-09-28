import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import os from 'os';
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
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > 20) return res.status(429).json({ error: 'طلبات كثيرة، جرّب بعد دقيقة.' });
  next();
});

function validHttpUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host.startsWith('127.')) return false;
    return true;
  } catch {
    return false;
  }
}

function safeName(name = 'video') {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140) || 'video';
}

function runYtDlp(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_PATH, args, {
      ...opts,
      windowsHide: true,
      shell: false
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', d => (stdout += d.toString()));
    child.stderr?.on('data', d => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
    });
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
    res.json({ ok: true, ytDlp: result.stdout.trim(), ffmpeg: Boolean(ffmpegStatic) });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'محرك التنزيل غير جاهز', details: String(err.message).slice(0, 300) });
  }
});

app.post('/api/info', async (req, res) => {
  const url = String(req.body?.url || '').trim();
  if (!validHttpUrl(url)) return res.status(400).json({ error: 'الرابط غير صالح' });

  try {
    const { stdout } = await runYtDlp([
      ...baseArgs(),
      '--dump-single-json',
      url
    ]);
    const data = JSON.parse(stdout);
    res.json({
      title: data.title || 'Video',
      thumbnail: data.thumbnail || null,
      duration: data.duration || null,
      uploader: data.uploader || data.channel || null,
      webpage_url: data.webpage_url || url
    });
  } catch (err) {
    res.status(400).json({
      error: 'تعذر قراءة الفيديو. قد يكون الرابط خاصًا أو غير مدعوم أو محميًا.',
      details: String(err.message).slice(0, 500)
    });
  }
});

app.post('/api/download', async (req, res) => {
  const url = String(req.body?.url || '').trim();
  const mode = req.body?.mode === 'mp3' ? 'mp3' : 'mp4';

  if (!validHttpUrl(url)) return res.status(400).json({ error: 'الرابط غير صالح' });

  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-dl-'));
  const outputTemplate = path.join(jobDir, '%(title).120s-%(id)s.%(ext)s');

  try {
    const common = [
      ...baseArgs(),
      '--restrict-filenames',
      '--max-filesize', '250M',
      '-o', outputTemplate,
      '--print', 'after_move:filepath'
    ];

    const args = mode === 'mp3'
      ? [...common, '-x', '--audio-format', 'mp3', '--audio-quality', '0', url]
      : [...common, '-f', 'bv*+ba/b', '--merge-output-format', 'mp4', url];

    const { stdout } = await runYtDlp(args);
    const lines = stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const finalPath = lines.at(-1);

    if (!finalPath || !fs.existsSync(finalPath)) throw new Error('لم يتم العثور على الملف الناتج');

    const filename = safeName(path.basename(finalPath));
    res.download(finalPath, filename, err => {
      fs.rm(jobDir, { recursive: true, force: true }, () => {});
      if (err && !res.headersSent) res.status(500).end();
    });
  } catch (err) {
    fs.rm(jobDir, { recursive: true, force: true }, () => {});
    res.status(400).json({
      error: 'تعذر تنزيل هذا الرابط. قد يكون الفيديو خاصًا، محميًا بـ DRM، أكبر من الحد المجاني، أو الموقع غير مدعوم حاليًا.',
      details: String(err.message).slice(0, 700)
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Downloader running on port ${PORT}`);
  console.log(`yt-dlp: ${YTDLP_PATH}`);
  console.log(`ffmpeg: ${ffmpegStatic || 'not found'}`);
});
