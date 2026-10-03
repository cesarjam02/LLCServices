import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://lily_app:LilyDb2026%21ChangeMe@localhost:5432/lily?schema=public'),
  JWT_SECRET: z.string().min(32).default('development-only-secret-change-before-production'),
  TEMP_SUPERADMIN_USERNAME: z.string().optional(),
  TEMP_SUPERADMIN_PASSWORD: z.string().min(4).optional(),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error('Variables de entorno inválidas:', z.treeifyError(result.error));
  process.exit(1);
}

export const env = result.data;
