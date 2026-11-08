import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: new URL('../.env', import.meta.url) });
process.env.NODE_ENV ??= 'production';
if (!process.env.DATABASE_URL?.startsWith('mysql://')) {
  throw new Error('Configura DATABASE_URL con la conexión MySQL de Hostinger.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configura JWT_SECRET con al menos 32 caracteres.');
}
if (!process.env.ADMIN_PASSWORD) throw new Error('Configura ADMIN_PASSWORD.');
const require = createRequire(new URL('../package.json', import.meta.url));
function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: backendDirectory, env: process.env, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(require.resolve('prisma/build/index.js'), ['migrate', 'deploy']);
run(fileURLToPath(new URL('../prisma/seed.mjs', import.meta.url)), ['--initial-only']);
// Preserve the same upload paths used by npm workspace commands.
process.chdir(backendDirectory);
