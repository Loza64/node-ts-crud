import { config } from 'dotenv';

config();

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  ORIGIN: process.env.ORIGIN,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',

  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ?? 'postgres',
  DB_NAME: process.env.DB_NAME ?? 'app_db',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER ?? 'uploads',

  CB_TIMEOUT_MS: Number(process.env.CB_TIMEOUT_MS) || 8000,
  CB_ERROR_THRESHOLD_PERCENTAGE: Number(process.env.CB_ERROR_THRESHOLD_PERCENTAGE) || 50,
  CB_RESET_TIMEOUT_MS: Number(process.env.CB_RESET_TIMEOUT_MS) || 15000,
  CB_VOLUME_THRESHOLD: Number(process.env.CB_VOLUME_THRESHOLD) || 5,

  ORPHAN_PHOTOS_CRON: process.env.ORPHAN_PHOTOS_CRON ?? '0 * * * *',

  ORPHAN_PHOTOS_MIN_AGE_MINUTES: Number(process.env.ORPHAN_PHOTOS_MIN_AGE_MINUTES) || 1440,
};
