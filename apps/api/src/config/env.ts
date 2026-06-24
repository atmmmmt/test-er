import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  WEB_URL: z.string().default('http://localhost:5173'),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  IMAGE_WEBP_THRESHOLD_KB: z.coerce.number().default(250),
  IMAGE_WEBP_QUALITY: z.coerce.number().default(82),
  MAX_IMAGE_SIZE_MB: z.coerce.number().default(8)
});

export const env = schema.parse(process.env);
