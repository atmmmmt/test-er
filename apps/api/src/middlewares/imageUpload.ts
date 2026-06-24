import multer from 'multer';
import sharp from 'sharp';
import { env } from '../config/env.js';

export const imageMulter = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024 } });

export async function toOptimizedWebp(file: Express.Multer.File) {
  const thresholdBytes = env.IMAGE_WEBP_THRESHOLD_KB * 1024;
  if (file.size < thresholdBytes) return { buffer: file.buffer, mime: file.mimetype, compressed: false };
  const buffer = await sharp(file.buffer).rotate().webp({ quality: env.IMAGE_WEBP_QUALITY }).toBuffer();
  return { buffer, mime: 'image/webp', compressed: true };
}
