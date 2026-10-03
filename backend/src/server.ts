import { createApp } from './app.js';
import { env } from './config/env.js';

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
