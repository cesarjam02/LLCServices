import { createApp } from './app.js';
import { env } from './config/env.js';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (env.NODE_ENV === 'production') {
  console.log('Preparando base MySQL: migraciones y administrador inicial...');
  const preparation = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../scripts/prepare-database.mjs', import.meta.url))],
    { env: process.env, stdio: 'inherit' },
  );
  if (preparation.error) throw preparation.error;
  if (preparation.status !== 0) process.exit(preparation.status ?? 1);
}

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`Lily API disponible en http://localhost:${env.PORT}`);
});

function shutdown(signal: string) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
