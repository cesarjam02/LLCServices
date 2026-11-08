// Local integration test. Never run against a customer's production database.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
if (
  process.env.NODE_ENV === 'production' ||
  !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname)
) {
  throw new Error('Esta verificación solo se permite contra una base local.');
}
const prisma = new PrismaClient();
const ids = { clients: [], transactions: [], transfers: [], files: [] };
const base = 'http://127.0.0.1:3107';
let server;
async function stop() {
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
}
async function start() {
  server = spawn(process.execPath, [fileURLToPath(new URL('../dist/server.js', import.meta.url))], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, NODE_ENV: 'development', PORT: '3107' },
    stdio: 'ignore',
  });
  for (let n = 0; n < 60; n++) {
    if (server.exitCode !== null) throw new Error('El servidor de prueba no pudo iniciar');
    try {
      if ((await fetch(base + '/api/v1/health')).ok) return;
    } catch {
      /* wait for listen */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Tiempo de arranque agotado');
}
try {
  const user = await prisma.user.findFirstOrThrow({ where: { active: true, role: 'ADMIN' } });
  const category = await prisma.category.findFirstOrThrow();
  const cookie =
    'lily_admin=' +
    jwt.sign({ username: user.username }, process.env.JWT_SECRET, { subject: user.id });
  async function send(path, body, method = 'POST') {
    const r = await fetch(base + '/api/v1/admin' + path, { method, body, headers: { cookie } });
    assert.equal(r.status, method === 'POST' ? 201 : 200, await r.clone().text());
    return r.json();
  }
  const pdf = Buffer.concat([
    Buffer.from('%PDF-1.7\n% synthetic test, no personal data\n'),
    Buffer.alloc(6 * 1024 * 1024, 65),
  ]);
  function attach(form, field, bytes = pdf) {
    form.append(field, new Blob([bytes], { type: 'application/pdf' }), 'prueba.pdf');
    return form;
  }
  await start();
  const form = new FormData();
  for (const [k, v] of Object.entries({
    firstName: 'Prueba',
    lastName: 'Persistencia',
    phone: randomUUID(),
    address: 'Solo prueba local',
  }))
    form.set(k, v);
  const { client } = await send('/clients', attach(form, 'document'));
  ids.clients.push(client.id);
  ids.files.push(client.documentPath.slice(7));
  assert.ok(client.documentPath.startsWith('dbfile:'));
  const bad = new FormData();
  attach(bad, 'document', Buffer.from('MZ not a PDF'));
  const badResponse = await fetch(base + '/api/v1/admin/clients/' + client.id, {
    method: 'PATCH',
    body: bad,
    headers: { cookie },
  });
  assert.equal(badResponse.status, 400);
  const beforeFailure = await prisma.storedFile.count();
  const duplicate = new FormData();
  for (const [k, v] of Object.entries({
    firstName: 'Prueba',
    lastName: 'Duplicada',
    phone: client.phone,
    address: 'Prueba local',
  }))
    duplicate.set(k, v);
  attach(duplicate, 'document');
  const failed = await fetch(base + '/api/v1/admin/clients', {
    method: 'POST',
    body: duplicate,
    headers: { cookie },
  });
  assert.equal(failed.status, 500);
  assert.equal(
    await prisma.storedFile.count(),
    beforeFailure,
    'No quedan archivos huérfanos cuando falla el registro',
  );
  const movement = new FormData();
  for (const [k, v] of Object.entries({
    date: new Date().toISOString(),
    type: 'INCOME',
    paymentMethod: 'CASH',
    amount: '12.34',
    clientId: client.id,
    categoryId: category.id,
  }))
    movement.set(k, v);
  const { transaction } = await send('/transactions', attach(movement, 'receipt'));
  ids.transactions.push(transaction.id);
  ids.files.push(transaction.receiptPath.slice(7));
  const giro = new FormData();
  for (const [k, v] of Object.entries({
    date: new Date().toISOString(),
    amount: '12.34',
    clientId: client.id,
    company: 'Prueba local',
  }))
    giro.set(k, v);
  const { transfer } = await send('/money-transfers', attach(giro, 'receipt'));
  ids.transfers.push(transfer.id);
  ids.files.push(transfer.receiptPath.slice(7));
  const routes = [
    `/clients/${client.id}/document`,
    `/transactions/${transaction.id}/receipt`,
    `/money-transfers/${transfer.id}/receipt`,
  ];
  await stop();
  await start();
  for (const path of routes) {
    const url = base + '/api/v1/admin' + path;
    assert.equal((await fetch(url)).status, 401);
    const r = await fetch(url, { headers: { cookie } });
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'private, no-store');
    assert.match(r.headers.get('content-disposition'), /^attachment;/);
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), pdf);
  }
  const replacement = Buffer.from('%PDF-1.7\nreplacement test\n%%EOF');
  const { client: updated } = await send(
    '/clients/' + client.id,
    attach(new FormData(), 'document', replacement),
    'PATCH',
  );
  ids.files.push(updated.documentPath.slice(7));
  assert.equal(await prisma.storedFile.count({ where: { id: client.documentPath.slice(7) } }), 0);
  const r = await fetch(base + '/api/v1/admin' + routes[0], { headers: { cookie } });
  assert.deepEqual(Buffer.from(await r.arrayBuffer()), replacement);
  console.log(
    'OK: archivos de 6 MB, tres tipos de adjuntos, persistencia tras reiniciar, reemplazo, rollback, integridad y acceso privado.',
  );
} finally {
  await stop();
  const entities = [...ids.clients, ...ids.transactions, ...ids.transfers];
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({ where: { entityId: { in: entities } } });
    await tx.transaction.deleteMany({ where: { id: { in: ids.transactions } } });
    await tx.moneyTransfer.deleteMany({ where: { id: { in: ids.transfers } } });
    await tx.client.deleteMany({ where: { id: { in: ids.clients } } });
    await tx.storedFile.deleteMany({ where: { id: { in: ids.files } } });
  });
  await prisma.$disconnect();
  console.log('Registros sintéticos eliminados.');
}
