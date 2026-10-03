import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const categories = [
  ['Citas consulares', null],
  ['Courier', null],
  ['Extras', null],
  ['Impresiones y fax', null],
  ['Money Orders', null],
  ['Otros', null],
  ['Pago de facturas', null],
  ['Tarjetas de presentación', null],
];

const username = process.env.ADMIN_USERNAME ?? 'superadmin';
const password = process.env.ADMIN_PASSWORD ?? '1234';
const passwordHash = await hash(password, 12);

await prisma.user.upsert({
  where: { username },
  update: { name: 'Superadministrador', passwordHash, role: 'ADMIN', active: true },
  create: { username, name: 'Superadministrador', passwordHash, role: 'ADMIN' },
});

await prisma.category.updateMany({
  where: { name: { notIn: categories.map(([name]) => name) } },
  data: { active: false },
});

for (const [name, type] of categories) {
  await prisma.category.upsert({
    where: { name },
    update: { type, active: true },
    create: { name, type, active: true },
  });
}

await prisma.$disconnect();
console.log(`Seed completado. Usuario administrativo: ${username}`);
